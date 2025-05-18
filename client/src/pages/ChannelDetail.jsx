import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import ChannelName from '../components/ChannelName';

axios.defaults.baseURL = "http://localhost:5000";

export default function ChannelDetail() {
  const { channelId } = useParams();
  const [videos, setVideos] = useState([]);
  
  const [sortConfig, setSortConfig] = useState({ key: "publishedAt", direction: "desc" });
  
  const sortedVideos = React.useMemo(() => {
    if (!videos) return [];

    const sorted = [...videos];
    if (sortConfig !== null) {
      sorted.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Convert numeric strings to numbers
        if (!isNaN(aVal)) aVal = Number(aVal);
        if (!isNaN(bVal)) bVal = Number(bVal);

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return sorted;
  }, [videos, sortConfig]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    axios.get(`/api/channels/${channelId}/videos`).then((res) => setVideos(res.data));
  }, [channelId]);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Videos for <ChannelName channelId={channelId} /></h1>
      <table className="w-full border table-auto text-sm">
        <thead>
          <tr>
            <th className="border p-2 text-left cursor-pointer" onClick={() => requestSort("title")}>
              Title {sortConfig.key === "title" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
            </th>
            <th className="border p-2 cursor-pointer text-center" onClick={() => requestSort("publishedAt")}>
              Published {sortConfig.key === "publishedAt" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
            </th>
            <th className="border p-2 cursor-pointer text-center" onClick={() => requestSort("viewCount")}>
              Views {sortConfig.key === "viewCount" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
            </th>
            <th className="border p-2 cursor-pointer text-center" onClick={() => requestSort("commentCount")}>
              Comments {sortConfig.key === "commentCount" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedVideos.map((v) => (
            <tr key={v.id} className="border-t hover:bg-gray-50">
              <td className="p-2">{v.title}</td>
              <td className="p-2">{new Date(v.publishedAt).toLocaleDateString()}</td>
              <td className="p-2">{v.viewCount}</td>
              <td className="p-2">{v.commentCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
