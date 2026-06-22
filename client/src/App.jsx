import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import ListenButton from './components/ListenButton';
import SongResult from './components/SongResult';
import SongHistory from './components/SongHistory';
import AuthModal from './components/AuthModal';
import api from './api/client';
import './App.css';

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const { state, progress, error: recorderError, record, reset } = useAudioRecorder();

  const [showAuth, setShowAuth] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [identifyError, setIdentifyError] = useState(null);
  const [historyKey, setHistoryKey] = useState(0);

  const handleListen = async () => {
    if (state === 'recording' || state === 'processing') return;

    setCurrentSong(null);
    setIdentifyError(null);
    reset();

    let wavBlob;
    try {
      wavBlob = await record();
    } catch (err) {
      return;
    }

    const formData = new FormData();
    formData.append('audio', wavBlob, 'audio.wav');

    try {
      const res = await api.post('/recognize', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 40000,
      });

      if (res.data.success) {
        setCurrentSong(res.data.song);
        setHistoryKey((k) => k + 1);
      } else {
        setIdentifyError(res.data.error || 'Song not recognized. Try again with clearer audio.');
      }
    } catch (err) {
      console.error('Identify error:', err);
      setIdentifyError(
        err.response?.data?.error || 'Failed to connect to recognition service.'
      );
    }

    reset();
  };

  if (authLoading) {
    return (
      <div className="app-loading">
        <div className="spinner-large" />
      </div>
    );
  }

  return (
    <div className="app">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">◉</span>
          <span className="logo-text">SoundSnap</span>
        </div>
        <div className="header-actions">
          {user ? (
            <div className="user-menu">
              <span className="username-badge">@{user.username}</span>
              <button className="btn-ghost" onClick={logout}>Sign out</button>
            </div>
          ) : (
            <button className="btn-ghost" onClick={() => setShowAuth(true)}>
              Sign in
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        <section className="identify-section">
          <div className="identify-card glass">
            <h1 className="tagline">What's that song?</h1>
            <p className="subtitle">
              Hold your device near the music and tap to identify
            </p>

            <div className="listen-area">
              <ListenButton
                state={state}
                progress={progress}
                onClick={handleListen}
              />
            </div>

            {(recorderError || identifyError) && (
              <div className="error-banner">
                {recorderError || identifyError}
              </div>
            )}
          </div>

          {currentSong && (
            <SongResult
              song={currentSong}
              onClose={() => setCurrentSong(null)}
            />
          )}
        </section>

        {user && (
          <section className="history-wrapper">
            <SongHistory
              key={historyKey}
              onSelect={(song) => {
                setCurrentSong(song);
                setIdentifyError(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </section>
        )}

        {!user && (
          <div className="guest-prompt glass">
            <p>
              <button className="link-btn" onClick={() => setShowAuth(true)}>
                Sign in
              </button>{' '}
              to save your song history
            </p>
          </div>
        )}
      </main>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
