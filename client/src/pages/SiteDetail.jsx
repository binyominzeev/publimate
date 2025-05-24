import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function SiteDetail() {
  const { siteId } = useParams();
  const [site, setSite] = useState(null);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState("");

  // Fetch site and channels
  useEffect(() => {
    axios.get(`/api/sites/${siteId}`).then((res) => setSite(res.data));
    axios
      .get("/api/channels/meta")
      .then((res) => setChannels(Object.values(res.data)));
  }, [siteId]);

  // Assign channel to site
  const handleAssignChannel = async () => {
    if (!selectedChannel) return;
    await axios.post(`/api/sites/${siteId}/channels`, {
      channelId: selectedChannel,
    });
    // Refresh site data
    const res = await axios.get(`/api/sites/${siteId}`);
    setSite(res.data);
    setSelectedChannel("");
  };

  if (!site) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{site.name}</h1>
      <div className="mb-4">
        <label className="mr-2">Assign channel:</label>
        <select
          value={selectedChannel}
          onChange={(e) => setSelectedChannel(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">Select a channel</option>
          {channels
            .filter((ch) => !site.channels.includes(ch.channelId))
            .map((ch) => (
              <option key={ch.channelId} value={ch.channelId}>
                {ch.title}
              </option>
            ))}
        </select>
        <button
          onClick={handleAssignChannel}
          className="ml-2 px-3 py-1 !bg-blue-600 text-white rounded"
          disabled={!selectedChannel}
        >
          Add
        </button>
      </div>
      <div>
        <h2 className="font-semibold mb-2">Assigned Channels:</h2>
        <ul className="list-disc ml-6">
          {site.channels.map((cid) => {
            const ch = channels.find((c) => c.channelId === cid);
            return (
              <li key={cid} className="flex items-center">
                <span>{ch ? ch.title : cid}</span>
                <button
                  onClick={async () => {
                    await axios.delete(`/api/sites/${siteId}/channels/${cid}`);
                    const res = await axios.get(`/api/sites/${siteId}`);
                    setSite(res.data);
                  }}
                  className="ml-2 px-2 py-0.5 !bg-red-500 hover:!bg-red-700 text-white rounded text-xs transition-colors"
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}