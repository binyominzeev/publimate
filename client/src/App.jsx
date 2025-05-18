import React, { useState, useEffect } from "react";
import axios from "axios";

axios.defaults.baseURL = "http://localhost:5000";

export default function App() {
  const [channelId, setChannelId] = useState("");
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);

	const fetchQueue = async () => {
	  try {
		const res = await axios.get("/api/queue");
		console.log("Queue data:", res.data);
		setQueue(res.data);
	  } catch (error) {
		console.error("Failed to fetch queue:", error);
		setQueue([]);
	  }
	};


	const enqueueChannel = async () => {
	  if (!channelId) return;  // no empty input allowed
	  setLoading(true);
	  try {
      const res = await axios.post("/api/resolve-channel-id", { input: channelId });
      const resolvedId = res.data.channelId;
      
      await axios.post("/api/queue", { channelId: resolvedId });
      setChannelId("");
      await fetchQueue(); // refresh list
	  } catch (error) {
		  console.error("Failed to enqueue:", error);
	  } finally {
		  setLoading(false);  // always reset loading
	  }
	};

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 3000); // Poll every 3 seconds
    return () => clearInterval(interval); // Cleanup
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">PubliMate Admin Dashboard</h1>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          className="border p-2 rounded w-full"
          placeholder="Enter YouTube Channel ID"
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
        />
        <button
          onClick={enqueueChannel}
          className={`!bg-blue-300 !hover:bg-blue-600"`}
          disabled={loading}
        >
          {loading ? "Adding..." : "Enqueue"}
        </button>
      </div>
      <h2 className="text-lg font-semibold mb-2">Scraping Queue</h2>
<ul className="space-y-2">
  {Array.isArray(queue) && queue.length > 0 ? (
    queue.map((item, index) => {
      const progressPercent = item.totalVideos
        ? Math.round((item.processedVideos / item.totalVideos) * 100)
        : 0;

      return (
        <li key={index} className="p-3 bg-gray-100 rounded border">
          <div className="flex justify-between items-center mb-1">
            <span>{item.channelId}</span>
            <span className="text-sm text-gray-500">{item.status}</span>
          </div>
          {item.status === "processing" && item.totalVideos ? (
            <>
              <div className="text-xs mb-1">
                Processing {item.processedVideos}/{item.totalVideos} videos
              </div>
              <div className="w-full bg-gray-300 rounded h-2">
                <div
                  className="bg-blue-500 h-2 rounded"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </>
          ) : null}
        </li>
      );
    })
  ) : (
    <li className="p-3 text-gray-400">No items in queue</li>
  )}
</ul>
    </div>
  );
}
