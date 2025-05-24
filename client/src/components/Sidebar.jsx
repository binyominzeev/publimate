import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";

export default function Sidebar() {
  const location = useLocation();
  const [channels, setChannels] = useState([]);
  const [sites, setSites] = useState([]);

  useEffect(() => {
    axios.get("/api/channels/meta").then((res) => setChannels(Object.values(res.data)));
    axios.get("/api/sites").then((res) => setSites(res.data));
  }, []);

  const handleAddSite = async () => {
    const name = prompt("Enter new site name:");
    if (name && name.trim()) {
      try {
        const res = await axios.post("/api/sites", { name: name.trim() });
        setSites((prev) => [...prev, res.data]);
      } catch (err) {
        alert("Failed to add site.");
      }
    }
  };

  return (
    <aside className="w-64 h-screen bg-gray-900 text-white p-4">
      <h2 className="text-xl font-bold mb-6">PubliMate</h2>
      <nav className="space-y-2">
        <Link to="/" className="block hover:text-blue-400">➕ Add New Channel</Link>
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
        <div className="mt-4">
          <button
            onClick={handleAddSite}
            className="block w-full text-left hover:text-blue-400 mb-1"
          >
            ➕ Add New Site
          </button>
          <Link to="/sites" className="block hover:text-blue-400 font-semibold">
            🏠 Sites
          </Link>
          <ul className="ml-4 mt-2 space-y-1 text-sm">
            {sites.map((site) => (
              <li key={site.siteId}>
                <Link
                  to={`/sites/${site.siteId}`}
                  className={`hover:text-blue-300 ${location.pathname.includes(site.siteId) ? "text-blue-400" : ""}`}
                >
                  {site.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
  );
}
