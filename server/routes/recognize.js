const express = require('express');
const multer = require('multer');
const axios = require('axios');
const crypto = require('crypto');
const FormData = require('form-data');
const Song = require('../models/Song');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Build ACRCloud HMAC-SHA1 signature
function buildAcrSignature(accessKey, accessSecret, timestamp) {
  const stringToSign = [
    'POST',
    '/v1/identify',
    accessKey,
    'audio',
    '1',
    timestamp,
  ].join('\n');

  return crypto
    .createHmac('sha1', accessSecret)
    .update(stringToSign)
    .digest('base64');
}

// POST /api/recognize
router.post('/', optionalAuth, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { ACRCLOUD_HOST, ACRCLOUD_ACCESS_KEY, ACRCLOUD_ACCESS_SECRET } = process.env;

    if (!ACRCLOUD_ACCESS_KEY || ACRCLOUD_ACCESS_KEY === 'your_access_key_here') {
      return res.status(500).json({
        error: 'ACRCloud credentials not configured. Add them to server/.env',
      });
    }

    console.log(`Received audio: ${req.file.size} bytes, sending to ACRCloud...`);

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = buildAcrSignature(ACRCLOUD_ACCESS_KEY, ACRCLOUD_ACCESS_SECRET, timestamp);

    const form = new FormData();
    form.append('sample', req.file.buffer, {
      filename: 'audio.wav',
      contentType: 'audio/wav',
    });
    form.append('sample_bytes', req.file.size.toString());
    form.append('access_key', ACRCLOUD_ACCESS_KEY);
    form.append('data_type', 'audio');
    form.append('signature_version', '1');
    form.append('signature', signature);
    form.append('timestamp', timestamp);

    const acrResponse = await axios.post(
      `https://${ACRCLOUD_HOST}/v1/identify`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 30000,
      }
    );

    const data = acrResponse.data;
    console.log('ACRCloud response status:', data.status);

    // code 0 = match found
    if (data.status?.code !== 0 || !data.metadata?.music?.length) {
      const msg = data.status?.code === 1001
        ? 'No result: make sure music is playing clearly near your microphone.'
        : data.status?.msg || 'Song not recognized';
      return res.json({ success: false, error: msg });
    }

    const track = data.metadata.music[0];
    const artist = track.artists?.[0]?.name || 'Unknown Artist';
    const title = track.title || 'Unknown Title';
    const album = track.album?.name || '';
    const releaseDate = track.release_date?.split('-')[0] || '';

    // Album art — ACRCloud doesn't return it directly; fetch from iTunes Search API
    let albumArt = '';
    try {
      const itunesRes = await axios.get('https://itunes.apple.com/search', {
        params: { term: `${artist} ${title}`, media: 'music', limit: 1 },
        timeout: 5000,
      });
      albumArt = itunesRes.data?.results?.[0]?.artworkUrl100
        ?.replace('100x100bb', '500x500bb') || '';
    } catch {
      // non-fatal — album art is optional
    }

    const searchQuery = encodeURIComponent(`${artist} ${title}`);

    // Prefer deep links from ACRCloud metadata if present
    const spotifyTrackId = track.external_metadata?.spotify?.track?.id;
    const youtubeVid = track.external_metadata?.youtube?.vid;

    const songData = {
      title,
      artist,
      album,
      releaseDate,
      albumArt,
      spotifyUrl: spotifyTrackId
        ? `https://open.spotify.com/track/${spotifyTrackId}`
        : `https://open.spotify.com/search/${searchQuery}`,
      appleMusicUrl: `https://music.apple.com/us/search?term=${searchQuery}`,
      youtubeSearchUrl: youtubeVid
        ? `https://www.youtube.com/watch?v=${youtubeVid}`
        : `https://www.youtube.com/results?search_query=${searchQuery}`,
    };

    // Save to history if authenticated
    if (req.user) {
      try {
        await Song.create({ userId: req.user._id, ...songData });
        const overflow = await Song.find({ userId: req.user._id })
          .sort({ identifiedAt: -1 })
          .skip(50);
        if (overflow.length) {
          await Song.deleteMany({ _id: { $in: overflow.map((s) => s._id) } });
        }
      } catch (histErr) {
        console.error('History save error (non-fatal):', histErr.message);
      }
    }

    res.json({ success: true, song: songData });
  } catch (err) {
    console.error('Recognition error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to recognize song. Please try again.' });
  }
});

module.exports = router;
