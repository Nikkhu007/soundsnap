import { useState, useEffect } from 'react';
import api from '../api/client';
import './SongResult.css';

export default function SongResult({ song, onClose }) {
  const [lyrics, setLyrics] = useState(null);
  const [lyricsState, setLyricsState] = useState('idle'); // idle | loading | done | error
  const [lyricsOpen, setLyricsOpen] = useState(false);

  const fetchLyrics = async () => {
    if (lyricsState !== 'idle') return;
    setLyricsState('loading');
    try {
      const res = await api.get('/lyrics', {
        params: { artist: song.artist, title: song.title },
      });
      setLyrics(res.data.lyrics);
      setLyricsState('done');
    } catch {
      setLyricsState('error');
    }
  };

  const handleLyricsToggle = () => {
    if (!lyricsOpen && lyricsState === 'idle') {
      fetchLyrics();
    }
    setLyricsOpen((v) => !v);
  };

  return (
    <div className="song-result glass animate-in">
      <button className="result-close" onClick={onClose}>✕</button>

      <div className="result-header">
        {song.albumArt ? (
          <img src={song.albumArt} alt={`${song.album} cover`} className="album-art" />
        ) : (
          <div className="album-art-placeholder">
            <span>♪</span>
          </div>
        )}
        <div className="result-info">
          <h2 className="song-title">{song.title}</h2>
          <p className="song-artist">{song.artist}</p>
          {song.album && <p className="song-album">{song.album}</p>}
          {song.releaseDate && (
            <p className="song-year">{song.releaseDate}</p>
          )}
        </div>
      </div>

      <div className="result-links">
        <a
          href={song.youtubeSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="link-btn-music youtube"
        >
          <YouTubeIcon />
          YouTube
        </a>
        <a
          href={song.spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="link-btn-music spotify"
        >
          <SpotifyIcon />
          Spotify
        </a>
        <a
          href={song.appleMusicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="link-btn-music apple"
        >
          <AppleIcon />
          Apple Music
        </a>
      </div>

      <div className="lyrics-section">
        <button className="lyrics-toggle" onClick={handleLyricsToggle}>
          <span>{lyricsOpen ? '▼' : '▶'} Lyrics</span>
          {lyricsState === 'loading' && <span className="lyrics-loading-dot" />}
        </button>

        {lyricsOpen && (
          <div className="lyrics-content">
            {lyricsState === 'loading' && (
              <p className="lyrics-status">Fetching lyrics...</p>
            )}
            {lyricsState === 'done' && lyrics && (
              <pre className="lyrics-text">{lyrics.trim()}</pre>
            )}
            {lyricsState === 'done' && !lyrics && (
              <p className="lyrics-status muted">Lyrics not available for this song.</p>
            )}
            {lyricsState === 'error' && (
              <p className="lyrics-status muted">Lyrics service unavailable right now.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
    </svg>
  );
}

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
    </svg>
  );
}
