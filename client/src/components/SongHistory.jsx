import { useState, useEffect } from 'react';
import api from '../api/client';
import './SongHistory.css';

export default function SongHistory({ onSelect }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/history');
      setSongs(res.data.songs);
    } catch (err) {
      console.error('History fetch failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/history/${id}`);
      setSongs((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      console.error('Delete failed:', err.message);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Clear all history?')) return;
    setClearing(true);
    try {
      await api.delete('/history');
      setSongs([]);
    } catch (err) {
      console.error('Clear failed:', err.message);
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="history-section glass">
        <h3 className="history-title">Recent Searches</h3>
        <p className="history-empty">Loading...</p>
      </div>
    );
  }

  return (
    <div className="history-section glass">
      <div className="history-header">
        <h3 className="history-title">Recent Searches</h3>
        {songs.length > 0 && (
          <button className="clear-btn" onClick={handleClear} disabled={clearing}>
            {clearing ? 'Clearing...' : 'Clear all'}
          </button>
        )}
      </div>

      {songs.length === 0 ? (
        <p className="history-empty">No songs identified yet. Start listening!</p>
      ) : (
        <ul className="history-list">
          {songs.map((song) => (
            <li
              key={song._id}
              className="history-item"
              onClick={() => onSelect(song)}
            >
              {song.albumArt ? (
                <img src={song.albumArt} alt="" className="history-art" />
              ) : (
                <div className="history-art-placeholder">♪</div>
              )}
              <div className="history-info">
                <span className="history-song-title">{song.title}</span>
                <span className="history-song-artist">{song.artist}</span>
              </div>
              <div className="history-meta">
                <span className="history-date">
                  {new Date(song.identifiedAt).toLocaleDateString()}
                </span>
                <button
                  className="history-delete"
                  onClick={(e) => handleDelete(song._id, e)}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
