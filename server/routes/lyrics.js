const express = require('express');
const axios = require('axios');

const router = express.Router();

// GET /api/lyrics?artist=...&title=...
router.get('/', async (req, res) => {
  try {
    const { artist, title } = req.query;
    if (!artist || !title) {
      return res.status(400).json({ error: 'artist and title are required' });
    }

    // Sanitize: lyrics.ovh is picky about special characters in the URL path
    const cleanArtist = artist.replace(/[/\\]/g, ' ').trim();
    const cleanTitle = title.replace(/[/\\]/g, ' ').trim();

    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`;
    const response = await axios.get(url, { timeout: 8000 });

    if (response.data?.lyrics) {
      res.json({ lyrics: response.data.lyrics });
    } else {
      res.json({ lyrics: null, message: 'Lyrics not available' });
    }
  } catch (err) {
    if (err.response?.status === 404) {
      return res.json({ lyrics: null, message: 'Lyrics not found' });
    }
    console.error('Lyrics error:', err.message);
    res.json({ lyrics: null, message: 'Lyrics service unavailable' });
  }
});

module.exports = router;
