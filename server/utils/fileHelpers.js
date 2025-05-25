import fs from 'fs';
import path from 'path';

const __dirname = path.resolve();
const sitesPath = path.join(__dirname, 'data', 'sites.json');

export function readSites() {
  if (!fs.existsSync(sitesPath)) return [];
  return JSON.parse(fs.readFileSync(sitesPath, 'utf-8'));
}

export function writeSites(sites) {
  fs.writeFileSync(sitesPath, JSON.stringify(sites, null, 2));
}