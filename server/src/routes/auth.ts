import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/database';
import { signToken, authMiddleware, AuthPayload } from '../middleware/auth';

const router = Router();

// Register
router.post('/register', (req: Request, res: Response) => {
  const { username, password, nickname, phone } = req.body;
  if (!username || !password || !nickname) {
    res.status(400).json({ error: '用户名、密码和昵称必填' });
    return;
  }
  if (username.length < 3 || password.length < 6) {
    res.status(400).json({ error: '用户名至少3位，密码至少6位' });
    return;
  }
  const db = getDb();
  try {
    const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (exists) {
      res.status(400).json({ error: '用户名已存在' });
      return;
    }
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (username, password, nickname, phone, role) VALUES (?, ?, ?, ?, ?)').run(
      username, hash, nickname, phone || '', 'user'
    );
    const payload: AuthPayload = { id: result.lastInsertRowid as number, username, role: 'user' };
    const token = signToken(payload);
    res.json({ token, user: { ...payload, nickname, phone: phone || '' } });
  } finally {
    db.close();
  }
});

// Login
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: '请输入用户名和密码' });
    return;
  }
  const db = getDb();
  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!user || !bcrypt.compareSync(password, user.password)) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }
    const payload: AuthPayload = { id: user.id, username: user.username, role: user.role };
    const token = signToken(payload);
    res.json({ token, user: { ...payload, nickname: user.nickname, phone: user.phone } });
  } finally {
    db.close();
  }
});

// Get current user profile
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  try {
    const user = db.prepare('SELECT id, username, role, nickname, phone, created_at FROM users WHERE id = ?').get(req.auth!.id) as any;
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    res.json(user);
  } finally {
    db.close();
  }
});

// Update profile
router.put('/me', authMiddleware, (req: Request, res: Response) => {
  const { nickname, phone } = req.body;
  const db = getDb();
  try {
    db.prepare('UPDATE users SET nickname = ?, phone = ? WHERE id = ?').run(
      nickname || '', phone || '', req.auth!.id
    );
    res.json({ success: true });
  } finally {
    db.close();
  }
});

export default router;
