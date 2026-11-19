import { useCallback, useEffect, useRef, useState } from "react";
import {
  REALTIME_URL,
  EVT,
  blobToBase64,
  concatFloat32,
  createWavFile,
  pcmBase64ArrayToUrl,
  type CallMessage,
} from "./realtime";

const INPUT_SAMPLE_RATE = 16000; // 麦克风输入采样率
const OUTPUT_SAMPLE_RATE = 24000; // 模型输出音频采样率
const VAD_THRESHOLD = 35; // VAD 灵敏度阈值
const VAD_DELAY_FRAMES = 10; // 静音延迟帧数（约 200ms 判断结束说话）

function genId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2, 10)}`;
}

function updateMessage(list: CallMessage[], id: string, patch: Partial<CallMessage>): CallMessage[] {
  return list.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

export function useRealtimeCall() {
  const [messages, setMessages] = useState<CallMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [enableAudio, setEnableAudio] = useState(false);
  const [enableVideo, setEnableVideo] = useState(false);
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_ZHIPU_API_KEY ?? "");
  const [voice, setVoice] = useState<string>("tongtong");
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameTimerRef = useRef<number | null>(null);
  const analyserTimerRef = useRef<number | null>(null);

  const recordChunksRef = useRef<Float32Array[]>([]);
  const isSpeakingRef = useRef(false);
  const delayFrameRef = useRef(0);
  const responseIdRef = useRef("");
  const resFinishedRef = useRef(true);
  const audioChunksRef = useRef<string[]>([]);
  const assistantTextRef = useRef("");
  const enableVideoRef = useRef(false);
  const enableAudioRef = useRef(false);
  const mediaOpenedRef = useRef(false);

  const sendMessage = useCallback((payload: Record<string, unknown>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const sessionUpdate = useCallback(
    (withVideo: boolean) => {
      sendMessage({
        type: EVT.SESSION_UPDATE,
        session: {
          model: "glm-realtime",
          modalities: ["audio", "text"],
          turn_detection: { type: "client_vad" },
          instructions:
            "你是熠熠简历助手中的 AI 面试官，请围绕大学生求职、简历优化、岗位匹配和面试表达进行交流。语气专业、亲切、简洁。",
          beta_fields: {
            chat_mode: withVideo ? "video_passive" : "audio",
            tts_source: "e2e",
            auto_search: false,
          },
          voice,
          output_audio_format: "pcm",
          input_audio_format: "wav",
          input_audio_noise_reduction: { type: "near_field" },
        },
      });
    },
    [sendMessage, voice],
  );

  const pushAudioAppend = useCallback(
    async (base64: string) => {
      sendMessage({ type: EVT.AUDIO_APPEND, audio: base64 });
    },
    [sendMessage],
  );

  const pushVideoFrame = useCallback(
    async (base64: string) => {
      sendMessage({ type: EVT.VIDEO_APPEND, video_frame: base64 });
    },
    [sendMessage],
  );

  const sendCommit = useCallback(() => {
    sendMessage({ type: EVT.COMMIT });
  }, [sendMessage]);

  const sendResponseCreate = useCallback(() => {
    sendMessage({ type: EVT.RESPONSE_CREATE });
  }, [sendMessage]);

  const sendResponseCancel = useCallback(() => {
    sendMessage({ type: EVT.RESPONSE_CANCEL });
  }, [sendMessage]);

  // ---- 打开麦克风 + VAD ----
  const openAudio = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micStreamRef.current = stream;

    const ctx = new AudioContext({ sampleRate: INPUT_SAMPLE_RATE });
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(processor);
    source.connect(analyser);
    processor.connect(ctx.destination);

    processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      if (!input || !input.length) return;
      if (isSpeakingRef.current) {
        recordChunksRef.current.push(new Float32Array(input));
        const wav = createWavFile(new Float32Array(input), INPUT_SAMPLE_RATE);
        blobToBase64(wav).then((b64) => {
          if (b64) pushAudioAppend(b64);
        });
      }
    };

    analyserTimerRef.current = window.setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
      const average = sum / bufferLength;
      if (average > VAD_THRESHOLD) {
        delayFrameRef.current = 0;
        if (!isSpeakingRef.current) {
          isSpeakingRef.current = true;
          setIsSpeaking(true);
          if (!resFinishedRef.current) sendResponseCancel();
        }
      } else {
        delayFrameRef.current += 1;
        if (delayFrameRef.current > VAD_DELAY_FRAMES && isSpeakingRef.current) {
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          const chunks = recordChunksRef.current;
          if (chunks.length) {
            const merged = concatFloat32(chunks);
            const wav = createWavFile(merged, INPUT_SAMPLE_RATE);
            recordChunksRef.current = [];
            const url = URL.createObjectURL(wav);
            setMessages((prev) => [
              ...prev,
              { id: genId(), role: "user", text: "", audioUrl: url, status: "complete" },
            ]);
            sendCommit();
          }
        }
      }
    }, 50);
  }, [pushAudioAppend, sendCommit, sendResponseCancel]);

  // ---- 打开摄像头 + 抽帧 ----
  const openVideo = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoStreamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch(() => undefined);
    }
    frameTimerRef.current = window.setInterval(() => {
      const video = videoRef.current;
      if (!video || !video.videoWidth) return;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          blobToBase64(blob).then((b64) => {
            if (b64) pushVideoFrame(b64);
          });
        }
      }, "image/jpeg", 0.6);
    }, 500);
  }, [pushVideoFrame]);

  const closeAudio = useCallback(() => {
    if (analyserTimerRef.current) {
      clearInterval(analyserTimerRef.current);
      analyserTimerRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => undefined);
      audioCtxRef.current = null;
    }
    isSpeakingRef.current = false;
    setIsSpeaking(false);
    recordChunksRef.current = [];
  }, []);

  const closeVideo = useCallback(() => {
    if (frameTimerRef.current) {
      clearInterval(frameTimerRef.current);
      frameTimerRef.current = null;
    }
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => track.stop());
      videoStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // ---- WebSocket 消息处理 ----
  const handleWsMessage = useCallback(
    (raw: string) => {
      let data: { type?: string; [key: string]: unknown } = {};
      try {
        data = JSON.parse(raw);
      } catch {
        return;
      }
      const type = data.type as string;

      if (type === EVT.SESSION_CREATED) {
        sessionUpdate(enableVideoRef.current);
      } else if (type === EVT.SESSION_UPDATED) {
        // 会话已配置，首次打开媒体
        if (!enableAudioRef.current && !mediaOpenedRef.current) {
          mediaOpenedRef.current = true;
          openAudio().catch(() => setError("请检查麦克风权限是否已开启"));
          setEnableAudio(true);
          if (enableVideoRef.current) {
            openVideo().catch(() => setError("请检查摄像头权限是否已开启"));
          }
        }
      } else if (type === EVT.COMMITED) {
        // client_vad 模式：服务端确认收到提交的音频后，必须手动触发模型生成回复，
        // 否则模型不会主动回复（这是之前"没有回复"的根本原因）。
        sendResponseCreate();
      } else if (type === EVT.TRANSCRIPT_COMPLETED) {
        const transcript = String(data.transcript ?? "");
        if (transcript) {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === "user" && !last.text) {
              return updateMessage(prev, last.id, { text: transcript });
            }
            return [...prev, { id: genId(), role: "user", text: transcript, status: "complete" }];
          });
        }
      } else if (type === EVT.RESPONSE_CREATED) {
        const responseId = String((data.response as { id?: string })?.id ?? genId());
        responseIdRef.current = responseId;
        assistantTextRef.current = "";
        audioChunksRef.current = [];
        resFinishedRef.current = false;
        setMessages((prev) => [
          ...prev,
          { id: responseId, role: "assistant", text: "", status: "output" },
        ]);
      } else if (type === EVT.RESPONSE_AUDIO_TEXT) {
        const delta = String(data.delta ?? "");
        assistantTextRef.current += delta;
        setMessages((prev) =>
          updateMessage(prev, responseIdRef.current, { text: assistantTextRef.current }),
        );
      } else if (type === EVT.RESPONSE_AUDIO) {
        const delta = String(data.delta ?? "");
        if (delta) audioChunksRef.current.push(delta);
      } else if (type === EVT.RESPONSE_DONE) {
        const url = pcmBase64ArrayToUrl(audioChunksRef.current, OUTPUT_SAMPLE_RATE);
        setMessages((prev) =>
          updateMessage(prev, responseIdRef.current, {
            status: "complete",
            text: assistantTextRef.current,
            audioUrl: url ?? undefined,
          }),
        );
        resFinishedRef.current = true;
      } else if (type === EVT.ERROR) {
        setError("通话出错，请检查 API Key 或稍后重试");
      }
    },
    [openAudio, openVideo, sessionUpdate, sendResponseCreate],
  );

  // ---- 连接 / 断开 ----
  const connect = useCallback(async () => {
    if (!apiKey.trim()) {
      setError("请先填写智谱 API Key");
      return;
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    setError(null);
    setIsConnecting(true);
    mediaOpenedRef.current = false;
    enableVideoRef.current = enableVideo;
    enableAudioRef.current = false;

    const url = `${REALTIME_URL}?Authorization=${encodeURIComponent(apiKey.trim())}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnecting(false);
      setIsConnected(true);
    };
    ws.onmessage = (event) => handleWsMessage(String(event.data));
    ws.onclose = () => {
      setIsConnected(false);
      setIsConnecting(false);
      closeAudio();
      closeVideo();
    };
    ws.onerror = () => {
      setIsConnecting(false);
      setIsConnected(false);
      setError("连接出错，请检查网络或 API Key");
    };
  }, [apiKey, enableVideo, handleWsMessage, closeAudio, closeVideo]);

  const disconnect = useCallback(() => {
    closeAudio();
    closeVideo();
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setEnableAudio(false);
    setEnableVideo(false);
    mediaOpenedRef.current = false;
  }, [closeAudio, closeVideo]);

  const toggleAudio = useCallback(() => {
    setEnableAudio((prev) => {
      const next = !prev;
      if (next) openAudio().catch(() => setError("请检查麦克风权限是否已开启"));
      else closeAudio();
      return next;
    });
  }, [openAudio, closeAudio]);

  const toggleVideo = useCallback(() => {
    setEnableVideo((prev) => {
      const next = !prev;
      enableVideoRef.current = next;
      if (next) {
        openVideo().catch(() => setError("请检查摄像头权限是否已开启"));
        if (isConnected) sessionUpdate(true);
      } else {
        closeVideo();
        if (isConnected) sessionUpdate(false);
      }
      return next;
    });
  }, [openVideo, closeVideo, isConnected, sessionUpdate]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // 卸载时清理资源
  useEffect(() => {
    return () => {
      closeAudio();
      closeVideo();
      if (wsRef.current) wsRef.current.close();
    };
  }, [closeAudio, closeVideo]);

  return {
    messages,
    isConnected,
    isConnecting,
    isSpeaking,
    enableAudio,
    enableVideo,
    apiKey,
    setApiKey,
    voice,
    setVoice,
    error,
    videoRef,
    connect,
    disconnect,
    toggleAudio,
    toggleVideo,
    clearMessages,
  };
}
