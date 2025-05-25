import express from 'express';
import { fetchAndStoreChannelData } from '../youtubeScraper.js'; // <-- Add this line

const router = express.Router();
let queue = [];

router.get('/', (req, res) => {
  res.json(queue);
});

router.post('/', async (req, res) => {
  const { channelId } = req.body;
  const entry = {
    channelId,
    status: "queued",
    totalVideos: 0,
    processedVideos: 0,
  };
  queue.push(entry);
  res.json({ success: true });

  try {
    entry.status = "processing";

    await fetchAndStoreChannelData(channelId, (processed, total) => {
      entry.processedVideos = processed;
      entry.totalVideos = total;
    });

    entry.status = "done";
  } catch (err) {
    entry.status = "error";
  }
});

export default router;