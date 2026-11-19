// 智谱 GLM Realtime 视频通话相关常量与流处理工具

export const REALTIME_URL = "wss://open.bigmodel.cn/api/paas/v4/realtime";

export interface CallMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  audioUrl?: string;
  status: "output" | "complete" | "fail";
}

export const VOICES = [
  { value: "xiaochen", label: "小陈" },
  { value: "tongtong", label: "彤彤" },
  { value: "female-shaonv", label: "少女" },
  { value: "male-qn-daxuesheng", label: "青年男大学生" },
] as const;

// 智谱 Realtime 协议事件（子集）
export const EVT = {
  SESSION_UPDATE: "session.update",
  AUDIO_APPEND: "input_audio_buffer.append",
  VIDEO_APPEND: "input_audio_buffer.append_video_frame",
  COMMIT: "input_audio_buffer.commit",
  RESPONSE_CREATE: "response.create",
  RESPONSE_CANCEL: "response.cancel",

  SESSION_CREATED: "session.created",
  SESSION_UPDATED: "session.updated",
  SPEECH_STARTED: "input_audio_buffer.speech_started",
  SPEECH_STOPPED: "input_audio_buffer.speech_stopped",
  COMMITED: "input_audio_buffer.committed",
  RESPONSE_CREATED: "response.created",
  TRANSCRIPT_COMPLETED: "conversation.item.input_audio_transcription.completed",
  RESPONSE_AUDIO_TEXT: "response.audio_transcript.delta",
  RESPONSE_AUDIO_TEXT_DONE: "response.audio_transcript.done",
  RESPONSE_AUDIO: "response.audio.delta",
  RESPONSE_AUDIO_DONE: "response.audio.done",
  RESPONSE_DONE: "response.done",
  ERROR: "error",
} as const;

// --- 流处理工具 ---

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// 16-bit PCM base64 -> Float32Array
export function pcmBase64ToFloat32(base64: string): Float32Array {
  const buffer = base64ToArrayBuffer(base64);
  const view = new DataView(buffer);
  const n = Math.floor(view.byteLength / 2);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = view.getInt16(i * 2, true) / 32768;
  return out;
}

export function concatFloat32(arrays: Float32Array[]): Float32Array {
  const total = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const arr of arrays) {
    out.set(arr, offset);
    offset += arr.length;
  }
  return out;
}

// Float32Array -> WAV blob
export function createWavFile(samples: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([view], { type: "audio/wav" });
}

// 多段 PCM base64 -> 可播放的 wav object url
export function pcmBase64ArrayToUrl(chunks: string[], sampleRate: number): string | null {
  if (!chunks.length) return null;
  const floats = concatFloat32(chunks.map((chunk) => pcmBase64ToFloat32(chunk)));
  const wav = createWavFile(floats, sampleRate);
  return URL.createObjectURL(wav);
}
