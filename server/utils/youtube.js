import { google } from "googleapis";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const youtube = google.youtube({ version: "v3", auth: YOUTUBE_API_KEY });

async function resolveChannelId(input) {
  console.log(`[resolveChannelId] Input: ${input}`);

  let url, parts;
  try {
    url = new URL(input);
    console.log(`[resolveChannelId] Parsed URL: ${url.href}`);
    const path = url.pathname;
    parts = path.split("/").filter(Boolean);
    console.log(`[resolveChannelId] Path parts: ${parts.join(", ")}`);
    if (parts.length === 0) throw new Error("Invalid YouTube channel URL");
  } catch (e) {
    // Not a URL, treat as direct channelId or username/handle
    parts = [input];
  }

  try {
    // /channel/CHANNEL_ID
    if (parts[0] === "channel") {
      console.log(`[resolveChannelId] Detected /channel/ URL`);
      return parts[1];
    }

    // /user/USERNAME
    if (parts[0] === "user") {
      const username = parts[1];
      console.log(`[resolveChannelId] Detected /user/ URL, resolving username: ${username}`);
      // Try forUsername
      let res = await youtube.channels.list({
        part: "id",
        forUsername: username,
      });
      console.log("[resolveChannelId] API response for forUsername:", JSON.stringify(res.data, null, 2));
      if (res.data.items && res.data.items.length > 0) {
        console.log(`[resolveChannelId] Resolved channel ID: ${res.data.items[0].id}`);
        return res.data.items[0].id;
      }
      // Fallback to search
      console.log(`[resolveChannelId] Username not found via forUsername, falling back to search...`);
      res = await youtube.search.list({
        part: "snippet",
        q: username,
        type: "channel",
        maxResults: 1,
      });
      if (!res.data.items || res.data.items.length === 0) {
        throw new Error("Channel not found for username (even by search)");
      }
      console.log(`[resolveChannelId] Resolved channel ID from search: ${res.data.items[0].snippet.channelId}`);
      return res.data.items[0].snippet.channelId;
    }

    // /c/CUSTOM_NAME
    if (parts[0] === "c") {
      const customName = parts[1];
      console.log(`[resolveChannelId] Detected /c/ custom URL, searching for channel named: ${customName}`);
      const res = await youtube.search.list({
        part: "snippet",
        q: customName,
        type: "channel",
        maxResults: 1,
      });
      if (!res.data.items || res.data.items.length === 0) {
        throw new Error("Channel not found for custom URL");
      }
      console.log(`[resolveChannelId] Resolved channel ID from search: ${res.data.items[0].snippet.channelId}`);
      return res.data.items[0].snippet.channelId;
    }

    // No prefix: try as username first, then fallback to search
    const candidate = parts[0];
    console.log(`[resolveChannelId] No prefix, trying username resolution for: ${candidate}`);
    let res = await youtube.channels.list({
      part: "id",
      forUsername: candidate,
    });
    if (res.data.items && res.data.items.length > 0) {
      console.log(`[resolveChannelId] Resolved channel ID from username: ${res.data.items[0].id}`);
      return res.data.items[0].id;
    }
    // Fallback to search
    console.log(`[resolveChannelId] Username resolution failed, falling back to search`);
    res = await youtube.search.list({
      part: "snippet",
      q: candidate,
      type: "channel",
      maxResults: 1,
    });
    if (!res.data.items || res.data.items.length === 0) {
      throw new Error("Channel not found by fallback search");
    }
    console.log(`[resolveChannelId] Resolved channel ID from fallback search: ${res.data.items[0].snippet.channelId}`);
    return res.data.items[0].snippet.channelId;

  } catch (e) {
    console.error(`[resolveChannelId] Error resolving channel ID: ${e.message}`);
    throw e;
  }
}

export { resolveChannelId };
