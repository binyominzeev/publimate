import express from 'express';
import path from 'path';
import fs from 'fs';
import { extractKeywords } from '../tagging.js';
import { fetchAndStoreChannelData } from '../youtubeScraper.js';

const router = express.Router();
const __dirname = path.resolve();

router.get('/meta', (req, res) => {
  const metaPath = path.join(__dirname, "data", "channel_meta.json");
  if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath));
    res.json(meta);
  } else {
    res.status(404).json({ error: "No metadata found." });
  }
});

router.get('/:channelId', (req, res) => {
  const channelId = req.params.channelId;
  const metaPath = path.join(__dirname, 'data', `channel_meta.json`);

  if (!fs.existsSync(metaPath)) {
    return res.status(404).json({ error: 'Channel metadata not found' });
  }

  try {
    const metaRaw = fs.readFileSync(metaPath, 'utf-8');
    const meta = JSON.parse(metaRaw);

    const channelData = meta[channelId];

    if (!channelData) {
      return res.status(404).json({ error: 'Channel metadata not found for this ID' });
    }

    res.json({
      name: channelData.title || channelData.name || 'Unknown Channel',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read channel metadata' });
  }
});

router.post('/:channelId/keywords', (req, res) => {
  const channelId = req.params.channelId;
  const dataDir = path.join(__dirname, 'data');

  try {
    const keywords = extractKeywords(channelId, dataDir);
    console.log(`[KEYWORDS] Saved ${keywords.length} keywords for ${channelId}`);
    res.json({ success: true, keywords });
  } catch (error) {
    console.error('[KEYWORDS] Failed:', error);
    res.status(500).json({ error: error.message || 'Failed to extract keywords.' });
  }
});

router.get('/:channelId/videos', (req, res) => {
  const channelId = req.params.channelId;
  const filePath = path.join(__dirname, "data", `${channelId}.json`);
  if (fs.existsSync(filePath)) {
    const videos = JSON.parse(fs.readFileSync(filePath));
    res.json(videos);
  } else {
    res.status(404).json({ error: "Videos not found" });
  }
});

export default router;