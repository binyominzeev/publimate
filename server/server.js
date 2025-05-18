const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { fetchAndStoreChannelData } = require("./youtubeScraper");

const app = express();
app.use(cors());
app.use(bodyParser.json());

let queue = [];

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
const fs = require("fs");
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
