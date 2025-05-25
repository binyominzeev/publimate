import { google } from 'googleapis';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const youtube = google.youtube({
  version: "v3",
  auth: YOUTUBE_API_KEY,
});

async function fetchAndStoreChannelData(channelId, progressCallback = () => {}) {
  console.log(`[FETCH] Fetching channel details for ${channelId}`);
  console.log(`[FETCH] Key used `, YOUTUBE_API_KEY);
 
  const channel = await youtube.channels.list({
    part: "contentDetails,snippet,statistics",
    id: channelId,
  });

  if (!channel.data.items.length) {
    throw new Error("Channel not found");
  }
  
  const channelData = channel.data.items[0];
  
  const channelInfo = {
    id: channelData.id,
    title: channelData.snippet.title,
    description: channelData.snippet.description,
    publishedAt: channelData.snippet.publishedAt,
    thumbnails: channelData.snippet.thumbnails,
    subscriberCount: channelData.statistics.subscriberCount || "Hidden",
  };
  
  const uploadsId = channelData.contentDetails.relatedPlaylists.uploads;
  console.log(`[PLAYLIST] Uploads playlist ID: ${uploadsId}`);

  let nextPage = null;
  const videos = [];

  // First, get total number of videos in the playlist (to calculate progress)
  // Unfortunately, YouTube API doesn't give total count directly in playlistItems.list,
  // but it does in 'pageInfo.totalResults'.
  // We will grab this info on the first call.

  let totalVideos = 0;
  let processedVideos = 0;
  
  const dataDir = "data";
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const outputPath = `data/${channelId}.json`;
  
  do {
    const playlistItems = await youtube.playlistItems.list({
      part: "snippet",
      playlistId: uploadsId,
      maxResults: 50,
      pageToken: nextPage,
    });
    
    if (totalVideos === 0 && playlistItems.data.pageInfo) {
      totalVideos = playlistItems.data.pageInfo.totalResults || 0;
    }

    const ids = playlistItems.data.items.map((i) => i.snippet.resourceId.videoId);

    console.log(`[PLAYLIST] Total videos: ${totalVideos}, ${ids.length}`);

    if (ids.length === 0) break;

    const videoDetails = await youtube.videos.list({
      part: "snippet,statistics,contentDetails",
      id: ids.join(","),
    });

    videoDetails.data.items.forEach((item) => {
      console.log(`[PLAYLIST] Push ${item.id}`);
      videos.push({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
        viewCount: item.statistics.viewCount,
        commentCount: item.statistics.commentCount,
        duration: item.contentDetails.duration,
      });
    });

    processedVideos += videoDetails.data.items.length;

    // Call the progress callback with current progress
    //progressCallback(processedVideos, totalVideos);

    // Save after each page
    try {
      fs.writeFileSync(outputPath, JSON.stringify(videos, null, 2));
      console.log(`[SAVE] ${processedVideos}/${totalVideos} videos saved to ${outputPath}.`);
    } catch (writeErr) {
      console.error(`[ERROR] Failed to save data to ${outputPath}:`, writeErr);
    }

    console.log(`[SAVE] ${processedVideos}/${totalVideos} videos saved.`);

    nextPage = playlistItems.data.nextPageToken;
  } while (nextPage);
  
  console.log(`[SAVE] Writing ${videos.length} videos to ${outputPath}`);

  fs.writeFileSync(
    `data/${channelId}.json`,
    JSON.stringify(videos, null, 2)
  );

  // --- Add this block ---
  const metaPath = path.join("data", "channel_meta.json");
  let meta = {};
  if (fs.existsSync(metaPath)) {
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    } catch (err) {
      console.error(`[ERROR] Failed to read channel_meta.json:`, err);
      meta = {};
    }
  }
  meta[channelId] = channelInfo;
  try {
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    console.log(`[META] Updated channel_meta.json for ${channelId}`);
  } catch (err) {
    console.error(`[ERROR] Failed to write channel_meta.json:`, err);
  }
  // --- End block ---
}

async function updateChannelMetadata(channelId) {
  // Fetch channel metadata
  const channelResponse = await youtube.channels.list({
    part: "snippet,statistics",
    id: channelId,
  });

  if (!channelResponse.data.items.length) {
    throw new Error("Channel not found");
  }

  const channelData = channelResponse.data.items[0];

  const channelInfo = {
    id: channelData.id,
    title: channelData.snippet.title,
    description: channelData.snippet.description,
    publishedAt: channelData.snippet.publishedAt,
    thumbnails: channelData.snippet.thumbnails,
    subscriberCount: channelData.statistics.subscriberCount || "Hidden",
  };

  // Load existing videos JSON
  const dataPath = path.join(__dirname, "data", `${channelId}.json`);
  let data = { channelInfo: {}, videos: [] };

  if (fs.existsSync(dataPath)) {
    const raw = fs.readFileSync(dataPath);
    data = JSON.parse(raw);
  } else {
    console.warn(`No existing data file for channel ${channelId}`);
  }

  // Update channelInfo and save
  data.channelInfo = channelInfo;

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log(`[UPDATE] Channel metadata updated for ${channelId}`);
}

export { fetchAndStoreChannelData };


