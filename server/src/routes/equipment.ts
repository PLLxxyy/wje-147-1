import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// List equipment (public)
router.get('/', (req: Request, res: Response) => {
  const { category, search } = req.query;
  const db = getDb();
  try {
    let sql = 'SELECT * FROM equipment WHERE 1=1';
    const params: any[] = [];

    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      sql += ' AND (name LIKE ? OR brand LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY created_at DESC';

    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } finally {
    db.close();
  }
});

// Get single equipment
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  try {
    const row = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
    if (!row) {
      res.status(404).json({ error: '装备不存在' });
      return;
    }
    res.json(row);
  } finally {
    db.close();
  }
});

// Create equipment (admin)
router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const { name, category, brand, daily_rate, deposit, stock, description, image_url } = req.body;
  if (!name || !category || !brand || daily_rate == null || deposit == null) {
    res.status(400).json({ error: '请填写完整装备信息' });
    return;
  }
  const validCategories = ['tent', 'sleeping_bag', 'cookware', 'lighting', 'furniture'];
  if (!validCategories.includes(category)) {
    res.status(400).json({ error: '装备分类无效' });
    return;
  }
  const db = getDb();
  try {
    const result = db.prepare(
      'INSERT INTO equipment (name, category, brand, daily_rate, deposit, stock, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(name, category, brand, Number(daily_rate), Number(deposit), Number(stock) || 0, description || '', image_url || '');
    const item = db.prepare('SELECT * FROM equipment WHERE id = ?').get(result.lastInsertRowid);
    res.json(item);
  } finally {
    db.close();
  }
});

// Update equipment (admin)
router.put('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const { name, category, brand, daily_rate, deposit, stock, description, image_url } = req.body;
  const db = getDb();
  try {
    const existing = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
    if (!existing) {
      res.status(404).json({ error: '装备不存在' });
      return;
    }
    db.prepare(
      'UPDATE equipment SET name=?, category=?, brand=?, daily_rate=?, deposit=?, stock=?, description=?, image_url=? WHERE id=?'
    ).run(
      name, category, brand, Number(daily_rate), Number(deposit), Number(stock), description || '', image_url || '', req.params.id
    );
    const updated = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
    res.json(updated);
  } finally {
    db.close();
  }
});

// Delete equipment (admin)
router.delete('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  try {
    const existing = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
    if (!existing) {
      res.status(404).json({ error: '装备不存在' });
      return;
    }
    db.prepare('DELETE FROM equipment WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } finally {
    db.close();
  }
});

export default router;
