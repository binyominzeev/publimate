// updateChannelMetadata.js
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
require("dotenv").config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const youtube = google.youtube({ version: "v3", auth: YOUTUBE_API_KEY });

const DATA_DIR = path.join(__dirname, "data");
const META_FILE = path.join(DATA_DIR, "channel_meta.json");

async function updateMetadata() {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".json") && f !== "channel_meta.json");

  let meta = {};
  if (fs.existsSync(META_FILE)) {
    meta = JSON.parse(fs.readFileSync(META_FILE));
  }

  for (const file of files) {
    const channelId = path.basename(file, ".json");

    try {
      console.log(`[INFO] Fetching metadata for channel ${channelId}...`);

      const res = await youtube.channels.list({
        part: "snippet,statistics",
        id: channelId,
      });

      if (!res.data.items.length) {
        console.warn(`[WARN] No data found for channel ${channelId}`);
        continue;
      }

      const item = res.data.items[0];
      const metadata = {
        channelId,
        title: item.snippet.title,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
        thumbnails: item.snippet.thumbnails,
        subscriberCount: item.statistics.subscriberCount,
        viewCount: item.statistics.viewCount,
        videoCount: item.statistics.videoCount,
      };

      meta[channelId] = metadata;

      console.log(`[OK] ${channelId}: ${metadata.title} (${metadata.subscriberCount} subs, ${metadata.videoCount} videos)`);

    } catch (err) {
      console.error(`[ERROR] Failed to fetch metadata for ${channelId}:`, err.message);
    }
  }

  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2));
  console.log(`[DONE] Channel metadata written to ${META_FILE}`);
}

updateMetadata();

