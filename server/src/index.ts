import express from 'express';
import cors from 'cors';
import { getDb, initDb } from './db/database';
import authRouter from './routes/auth';
import equipmentRouter from './routes/equipment';
import ordersRouter from './routes/orders';
import statsRouter from './routes/stats';
import reviewsRouter from './routes/reviews';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Initialize database
const db = getDb();
initDb(db);
db.close();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/equipment', equipmentRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/stats', statsRouter);
app.use('/api/reviews', reviewsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
