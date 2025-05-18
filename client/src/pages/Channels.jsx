import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Channels() {
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    axios.get("/api/channels/meta").then((res) => setChannels(Object.values(res.data)));
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">All Channels</h1>
      <table className="w-full border table-auto">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2">Name</th>
            <th className="p-2">Subscribers</th>
            <th className="p-2">Videos</th>
            <th className="p-2">Views</th>
          </tr>
        </thead>
        <tbody>
          {channels.map((ch) => (
            <tr key={ch.channelId} className="border-t hover:bg-gray-50">
              <td className="p-2">{ch.title}</td>
              <td className="p-2">{ch.subscriberCount}</td>
              <td className="p-2">{ch.videoCount}</td>
              <td className="p-2">{ch.viewCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
