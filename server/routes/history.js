const express = require('express');
const Song = require('../models/Song');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/history — get user's song history
router.get('/', auth, async (req, res) => {
  try {
    const songs = await Song.find({ userId: req.user._id })
      .sort({ identifiedAt: -1 })
      .limit(50);
    res.json({ songs });
  } catch (err) {
    console.error('History fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// DELETE /api/history/:id — delete a single history entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const song = await Song.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('History delete error:', err);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// DELETE /api/history — clear all history
router.delete('/', auth, async (req, res) => {
  try {
    await Song.deleteMany({ userId: req.user._id });
    res.json({ message: 'History cleared' });
  } catch (err) {
    console.error('History clear error:', err);
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

module.exports = router;
