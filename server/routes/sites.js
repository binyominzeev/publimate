import express from 'express';
import path from 'path';
import fs from 'fs';
import { readSites, writeSites } from '../utils/fileHelpers.js';

const router = express.Router();

// Get all sites
router.get('/', (req, res) => {
  res.json(readSites());
});

// Create a new site
router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });
  const sites = readSites();
  const siteId = name.trim().toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
  const newSite = { siteId, name: name.trim(), channels: [] };
  sites.push(newSite);
  writeSites(sites);
  res.json(newSite);
});

// Get a single site (with channels)
router.get('/:siteId', (req, res) => {
  const sites = readSites();
  const site = sites.find(s => s.siteId === req.params.siteId);
  if (!site) return res.status(404).json({ error: "Site not found" });
  res.json(site);
});

// Assign (add) a channel to a site
router.post('/:siteId/channels', (req, res) => {
  const { channelId } = req.body;
  if (!channelId) return res.status(400).json({ error: "channelId required" });
  const sites = readSites();
  const site = sites.find(s => s.siteId === req.params.siteId);
  if (!site) return res.status(404).json({ error: "Site not found" });
  if (!site.channels.includes(channelId)) {
    site.channels.push(channelId);
    writeSites(sites);
  }
  res.json(site);
});

// Remove a channel from a site
router.delete('/:siteId/channels/:channelId', (req, res) => {
  const { siteId, channelId } = req.params;
  const sites = readSites();
  const site = sites.find(s => s.siteId === siteId);
  if (!site) return res.status(404).json({ error: "Site not found" });
  site.channels = site.channels.filter(id => id !== channelId);
  writeSites(sites);
  res.json(site);
});

export default router;