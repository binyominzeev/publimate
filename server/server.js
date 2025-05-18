const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require('fs');
const { fetchAndStoreChannelData } = require("./youtubeScraper");

const app = express();
app.use(cors());
app.use(bodyParser.json());

let queue = [];

app.get("/api/channels/meta", (req, res) => {
  const metaPath = path.join(__dirname, "data", "channel_meta.json");
  if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath));
    res.json(meta);
  } else {
    res.status(404).json({ error: "No metadata found." });
  }
});

// GET /api/channels/:channelId
app.get('/api/channels/:channelId', (req, res) => {
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


app.get("/api/channels/:channelId/videos", (req, res) => {
  const channelId = req.params.channelId;
  const filePath = path.join(__dirname, "data", `${channelId}.json`);
  if (fs.existsSync(filePath)) {
    const videos = JSON.parse(fs.readFileSync(filePath));
    res.json(videos);
  } else {
    res.status(404).json({ error: "Videos not found" });
  }
});


app.get("/api/channels/:channelId/videos", (req, res) => {
  const { channelId } = req.params;
  const filePath = path.join(__dirname, "data", `${channelId}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath));
    res.json(data);
  } else {
    res.status(404).json({ error: "Channel not found." });
  }
});


app.get("/api/queue", (req, res) => {
  res.json(queue);
});

app.post("/api/queue", async (req, res) => {
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

app.post("/api/resolve-channel-id", async (req, res) => {
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





const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// --- YouTube Scraper Utility (youtubeScraper.js) ---
const { google } = require("googleapis");
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const youtube = google.youtube({ version: "v3", auth: YOUTUBE_API_KEY });


module.exports = { fetchAndStoreChannelData };

async function resolveChannelId(input) {
  console.log(`[resolveChannelId] Input: ${input}`);

  let url;
  try {
    url = new URL(input);
    console.log(`[resolveChannelId] Parsed URL: ${url.href}`);
  } catch (e) {
    console.log(`[resolveChannelId] Not a URL, assuming direct channel ID or username`);
    return input;
  }

  const path = url.pathname; // e.g. "/c/AliAbdaal"
  const parts = path.split("/").filter(Boolean);
  console.log(`[resolveChannelId] Path parts: ${parts.join(", ")}`);

  if (parts.length === 0) {
    throw new Error("Invalid YouTube channel URL");
  }

  try {
    if (parts[0] === "channel") {
      console.log(`[resolveChannelId] Detected /channel/ URL`);
      return parts[1];
    }

    if (parts[0] === "user") {
      console.log(`[resolveChannelId] Detected /user/ URL, resolving username: ${parts[1]}`);
      const res = await youtube.channels.list({
        part: "id",
        forUsername: parts[1],
      });
      if (res.data.items.length === 0) {
        throw new Error("Channel not found for username");
      }
      console.log(`[resolveChannelId] Resolved channel ID: ${res.data.items[0].id}`);
      return res.data.items[0].id;
    }

    if (parts[0] === "c") {
      console.log(`[resolveChannelId] Detected /c/ custom URL, searching for channel named: ${parts[1]}`);
      const res = await youtube.search.list({
        part: "snippet",
        q: parts[1],
        type: "channel",
        maxResults: 1,
      });
      if (res.data.items.length === 0) {
        throw new Error("Channel not found for custom URL");
      }
      console.log(`[resolveChannelId] Resolved channel ID from search: ${res.data.items[0].snippet.channelId}`);
      return res.data.items[0].snippet.channelId;
    }

    // No prefix, treat first part as username or custom handle
    console.log(`[resolveChannelId] No prefix, trying username resolution for: ${parts[0]}`);
    let res = await youtube.channels.list({
      part: "id",
      forUsername: parts[0],
    });
    if (res.data.items.length > 0) {
      console.log(`[resolveChannelId] Resolved channel ID from username: ${res.data.items[0].id}`);
      return res.data.items[0].id;
    }

    console.log(`[resolveChannelId] Username resolution failed, falling back to search`);
    res = await youtube.search.list({
      part: "snippet",
      q: parts[0],
      type: "channel",
      maxResults: 1,
    });
    if (res.data.items.length === 0) {
      throw new Error("Channel not found by fallback search");
    }
    console.log(`[resolveChannelId] Resolved channel ID from fallback search: ${res.data.items[0].snippet.channelId}`);
    return res.data.items[0].snippet.channelId;

  } catch (e) {
    console.error(`[resolveChannelId] Error resolving channel ID: ${e.message}`);
    throw e;
  }
}
