import fs from 'fs';
import path from 'path';
import * as stopwords from 'stopword';
import natural from 'natural';
import { franc } from 'franc';

function hungarianTokenizer(text) {
  return text.match(/[a-záéíóöőúüű]{2,}/gi) || [];
}

export function extractKeywords(channelId, dataDir) {
  const dataPath = path.join(dataDir, `${channelId}.json`);
  const outputPath = path.join(dataDir, `${channelId}_keywords.json`);

  if (!fs.existsSync(dataPath)) {
    throw new Error('Video data not found for this channel.');
  }

  const raw = fs.readFileSync(dataPath, 'utf-8');
  const videos = JSON.parse(raw);
  const tokenizer = new natural.WordTokenizer();
  const freq = {};

  const huStopwords = stopwords.hu;
  const enStopwords = stopwords.en;

  videos.forEach(video => {
    const text = `${video.title} ${video.description || ''}`.toLowerCase();
    const lang = franc(text);
    let filtered = [];

    if (lang === 'hun') {
      const tokens = hungarianTokenizer(text);
      filtered = stopwords.removeStopwords(tokens, huStopwords);
    } else {
      const tokens = tokenizer.tokenize(text);
      filtered = stopwords.removeStopwords(tokens, enStopwords);
    }

    filtered.forEach(word => {
      if (!/^[a-záéíóöőúüű]{4,}$/i.test(word)) return;
      freq[word] = (freq[word] || 0) + 1;
    });
  });

  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word, count]) => ({ word, count }));

  fs.writeFileSync(outputPath, JSON.stringify(sorted, null, 2));
  return sorted;
}