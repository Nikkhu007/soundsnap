const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: { type: String, required: true },
  artist: { type: String, required: true },
  album: { type: String, default: '' },
  releaseDate: { type: String, default: '' },
  albumArt: { type: String, default: '' },
  spotifyUrl: { type: String, default: '' },
  appleMusicUrl: { type: String, default: '' },
  youtubeSearchUrl: { type: String, default: '' },
  identifiedAt: {
    type: Date,
    default: Date.now,
  },
});

// Keep only the most recent 50 songs per user
songSchema.index({ userId: 1, identifiedAt: -1 });

module.exports = mongoose.model('Song', songSchema);
