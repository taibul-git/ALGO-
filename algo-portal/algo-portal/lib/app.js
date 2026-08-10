import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import issueRoutes from './routes/issues.js';
import setupRoutes from './routes/setups.js';
import runningRoutes from './routes/running.js';
import vpsRoutes from './routes/vps.js';
import notesRoutes from './routes/notes.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/setups', setupRoutes);
app.use('/api/running-accounts', runningRoutes);
app.use('/api/vps', vpsRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
