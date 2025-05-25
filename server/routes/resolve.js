import express from 'express';
import { resolveChannelId } from '../utils/youtube.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { input } = req.body;
    console.log(`[API] Resolving channel ID for input: ${input}`);

    const channelId = await resolveChannelId(input);

    console.log(`[API] Resolved channel ID: ${channelId}`);
    res.json({ success: true, channelId });
  } catch (error) {
    console.error(`[API] Error resolving channel ID: ${error.message}`);
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;