import './ListenButton.css';

export default function ListenButton({ state, progress, onClick }) {
  const isRecording = state === 'recording';
  const isProcessing = state === 'processing';
  const isActive = isRecording || isProcessing;

  const progressDeg = progress * 360;

  return (
    <div className="listen-wrapper">
      <div className={`listen-rings ${isRecording ? 'recording' : ''}`}>
        <div className="ring ring-1" />
        <div className="ring ring-2" />
        <div className="ring ring-3" />
      </div>

      <button
        className={`listen-btn ${isActive ? 'active' : ''} ${isRecording ? 'recording' : ''}`}
        onClick={onClick}
        disabled={isProcessing}
        style={isRecording ? {
          background: `conic-gradient(
            var(--accent) ${progressDeg}deg,
            rgba(255,255,255,0.08) ${progressDeg}deg
          )`,
        } : {}}
      >
        <div className="listen-btn-inner">
          {isRecording ? (
            <div className="waveform">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          ) : isProcessing ? (
            <div className="spinner" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="mic-icon">
              <path
                d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                fill="currentColor"
              />
              <path
                d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>
      </button>

      <p className="listen-label">
        {isRecording
          ? `Listening... ${Math.round(progress * 12)}s / 12s`
          : isProcessing
          ? 'Identifying song...'
          : 'Tap to identify'}
      </p>
    </div>
  );
}
