import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import axios from "axios";

export default function Sites() {
  const location = useLocation();
  const [sites, setSites] = useState([]);

  useEffect(() => {
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
    <div>
      <ul className="mb-4">
      </ul>
      <Outlet />
    </div>
  );
}