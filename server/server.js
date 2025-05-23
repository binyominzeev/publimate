import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { google } from "googleapis";
import { extractKeywords } from './tagging.js';

import { fetchAndStoreChannelData } from './youtubeScraper.js';
import * as stopwords from 'stopword';
import natural from 'natural';
import { franc } from 'franc';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

app.post('/api/channels/:channelId/keywords', (req, res) => {
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

// resolveChannelId

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const youtube = google.youtube({ version: "v3", auth: YOUTUBE_API_KEY });


export { fetchAndStoreChannelData };

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

// Sites management
const sitesPath = path.join(__dirname, "data", "sites.json");

// Helper to read/write sites
function readSites() {
  if (!fs.existsSync(sitesPath)) return [];
  return JSON.parse(fs.readFileSync(sitesPath, "utf-8"));
}
function writeSites(sites) {
  fs.writeFileSync(sitesPath, JSON.stringify(sites, null, 2));
}

// Get all sites
app.get("/api/sites", (req, res) => {
  res.json(readSites());
});

// Create a new site
app.post("/api/sites", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });
  const sites = readSites();
  const siteId = name.trim().toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
  const newSite = { siteId, name: name.trim(), channels: [] };
  sites.push(newSite);
  writeSites(sites);
  res.json(newSite);
});

// Get a single site (with channels)
app.get("/api/sites/:siteId", (req, res) => {
  const sites = readSites();
  const site = sites.find(s => s.siteId === req.params.siteId);
  if (!site) return res.status(404).json({ error: "Site not found" });
  res.json(site);
});

// Assign (add) a channel to a site
app.post("/api/sites/:siteId/channels", (req, res) => {
  const { channelId } = req.body;
  if (!channelId) return res.status(400).json({ error: "channelId required" });
  const sites = readSites();
  const site = sites.find(s => s.siteId === req.params.siteId);
  if (!site) return res.status(404).json({ error: "Site not found" });
  if (!site.channels.includes(channelId)) {
    site.channels.push(channelId);
    writeSites(sites);
  }
  res.json(site);
});

// Remove a channel from a site
app.delete("/api/sites/:siteId/channels/:channelId", (req, res) => {
  const { siteId, channelId } = req.params;
  const sites = readSites();
  const site = sites.find(s => s.siteId === siteId);
  if (!site) return res.status(404).json({ error: "Site not found" });
  site.channels = site.channels.filter(id => id !== channelId);
  writeSites(sites);
  res.json(site);
});
