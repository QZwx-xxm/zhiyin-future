import { VOICES } from "../lib/realtime";
import { useRealtimeCall } from "../lib/useRealtimeCall";
import { SectionHeader } from "../components/SectionHeader";

export function VideoCallPage() {
  const {
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
  } = useRealtimeCall();

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <span className="eyebrow">熠熠简历助手</span>
          <h1>AI 视频面试 · 实时语音通话</h1>
          <p>基于智谱 GLM Realtime 的实时音视频通话，可与 AI 面试官进行语音/视频交流，并同步显示文字转录。</p>
        </div>
      </section>

      <section className="video-call-grid">
        <div className="card video-call-panel">
          <SectionHeader title="视频画面" subtitle="开启摄像头后，AI 可以看到你的画面" />
          <div className="video-preview">
            <video ref={videoRef} autoPlay playsInline muted />
            {!enableVideo ? (
              <div className="video-placeholder">
                <span className="video-placeholder-icon">📷</span>
                <span>摄像头未开启</span>
              </div>
            ) : null}
            {isSpeaking ? <div className="speaking-indicator">正在说话…</div> : null}
          </div>

          <div className="form-stack call-controls">
            <label className="field-block">
              <span>智谱 API Key</span>
              <input
                className="search-input"
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="请输入 ZHIPU_API_KEY"
              />
            </label>

            <label className="field-block">
              <span>AI 音色</span>
              <select className="search-input" value={voice} onChange={(event) => setVoice(event.target.value)}>
                {VOICES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="call-button-row">
              {isConnected ? (
                <button className="danger-button" onClick={disconnect}>
                  结束通话
                </button>
              ) : (
                <button className="primary-button" onClick={connect} disabled={isConnecting}>
                  {isConnecting ? "连接中..." : "开始通话"}
                </button>
              )}
              <button className="secondary-button" onClick={toggleAudio} disabled={!isConnected}>
                {enableAudio ? "关闭麦克风" : "开启麦克风"}
              </button>
              <button className="secondary-button" onClick={toggleVideo}>
                {enableVideo ? "关闭摄像头" : "开启摄像头"}
              </button>
            </div>

            {error ? <p className="error-text">{error}</p> : null}
          </div>
        </div>

        <div className="card video-call-panel">
          <SectionHeader
            title="实时对话"
            subtitle="语音交流内容会实时转录为文字"
            action={
              messages.length ? (
                <button className="text-button" onClick={clearMessages}>
                  清空对话
                </button>
              ) : undefined
            }
          />
          <div className="call-message-list">
            {messages.length ? (
              messages.map((message) => (
                <div key={message.id} className={`call-message ${message.role}`}>
                  <div className="call-message-head">
                    <strong>{message.role === "assistant" ? "熠熠助手" : "我"}</strong>
                    {message.role === "assistant" && message.status === "output" ? (
                      <span className="typing-dots">
                        <i />
                        <i />
                        <i />
                      </span>
                    ) : null}
                  </div>
                  {message.text ? <p className="call-message-text">{message.text}</p> : null}
                  {message.audioUrl ? (
                    <audio
                      className="message-audio"
                      src={message.audioUrl}
                      controls
                      autoPlay={message.role === "assistant"}
                    />
                  ) : null}
                </div>
              ))
            ) : (
              <div className="call-empty">
                <p className="muted">点击「开始通话」后，即可与 AI 面试官语音交流。</p>
                <p className="muted">建议准备：简历优化、岗位选择、面试表达等话题。</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
