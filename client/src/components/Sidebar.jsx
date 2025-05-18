import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";

export default function Sidebar() {
  const location = useLocation();
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    axios.get("/api/channels/meta").then((res) => setChannels(Object.values(res.data)));
  }, []);

  return (
    <aside className="w-64 h-screen bg-gray-900 text-white p-4">
      <h2 className="text-xl font-bold mb-6">PubliMate</h2>
      <nav className="space-y-2">
        <Link to="/" className="block hover:text-blue-400">➕ Add New Site</Link>
        <div>
          <Link to="/channels" className="block hover:text-blue-400 font-semibold">
            📺 Channels
          </Link>
          <ul className="ml-4 mt-2 space-y-1 text-sm">
            {channels.map((ch) => (
              <li key={ch.channelId}>
                <Link
                  to={`/channels/${ch.channelId}`}
                  className={`hover:text-blue-300 ${location.pathname.includes(ch.channelId) ? "text-blue-400" : ""}`}
                >
                  {ch.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
  );
}
