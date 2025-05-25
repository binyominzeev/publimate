import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Import routes
import channelsRouter from './routes/channels.js';
import sitesRouter from './routes/sites.js';
import queueRouter from './routes/queue.js';
import resolveRouter from './routes/resolve.js';

app.use('/api/channels', channelsRouter);
app.use('/api/sites', sitesRouter);
app.use('/api/queue', queueRouter);
app.use('/api/resolve-channel-id', resolveRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
