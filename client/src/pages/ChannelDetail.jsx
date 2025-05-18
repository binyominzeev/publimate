import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function ChannelDetail() {
  const { channelId } = useParams();
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    axios.get(`/api/channels/${channelId}/videos`).then((res) => setVideos(res.data));
  }, [channelId]);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Videos for {channelId}</h1>
      <table className="w-full border table-auto text-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 text-left">Title</th>
            <th className="p-2 text-left">Published</th>
            <th className="p-2 text-left">Views</th>
            <th className="p-2 text-left">Comments</th>
          </tr>
        </thead>
        <tbody>
          {videos.map((v) => (
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
