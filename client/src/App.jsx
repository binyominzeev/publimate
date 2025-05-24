import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import AddSite from "./pages/AddSite";
import Channels from "./pages/Channels";
import ChannelDetail from "./pages/ChannelDetail";
import Sites from "./pages/Sites";
import SiteDetail from "./pages/SiteDetail";

function App() {
  return (
    <Router>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4">
          <Routes>
            <Route path="/" element={<AddSite />} />
            <Route path="/channels" element={<Channels />} />
            <Route path="/channels/:channelId" element={<ChannelDetail />} />
            <Route path="/sites" element={<Sites />}>
              <Route path=":siteId" element={<SiteDetail />} />
            </Route>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
