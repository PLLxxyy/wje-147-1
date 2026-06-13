import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, (req: Request, res: Response) => {
  const { order_id, rating, content } = req.body;
  if (!order_id || !rating) {
    res.status(400).json({ error: '请填写完整评价信息' });
    return;
  }
  const ratingNum = Number(rating);
  if (ratingNum < 1 || ratingNum > 5) {
    res.status(400).json({ error: '评分必须在 1-5 之间' });
    return;
  }
  const db = getDb();
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id) as any;
    if (!order) {
      res.status(404).json({ error: '订单不存在' });
      return;
    }
    if (order.user_id !== req.auth!.id) {
      res.status(403).json({ error: '无权评价此订单' });
      return;
    }
    if (order.status !== 'completed' && order.status !== 'damaged') {
      res.status(400).json({ error: '只能评价已完成的订单' });
      return;
    }
    const existing = db.prepare('SELECT id FROM reviews WHERE order_id = ?').get(order_id);
    if (existing) {
      res.status(400).json({ error: '此订单已评价过' });
      return;
    }
    const result = db.prepare(
      'INSERT INTO reviews (order_id, user_id, equipment_id, rating, content) VALUES (?, ?, ?, ?, ?)'
    ).run(order_id, req.auth!.id, order.equipment_id, ratingNum, content || '');
    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid);
    res.json(review);
  } finally {
    db.close();
  }
});

router.get('/equipment/:equipmentId', (req: Request, res: Response) => {
  const { equipmentId } = req.params;
  const db = getDb();
  try {
    const summary = db.prepare(`
      SELECT 
        COUNT(*) as review_count,
        AVG(rating) as avg_rating
      FROM reviews 
      WHERE equipment_id = ?
    `).get(equipmentId) as any;

    const reviews = db.prepare(`
      SELECT r.*, u.nickname as user_nickname, u.username
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.equipment_id = ?
      ORDER BY r.created_at DESC
    `).all(equipmentId);

    res.json({
      review_count: summary.review_count || 0,
      avg_rating: summary.avg_rating ? Number(summary.avg_rating.toFixed(1)) : 0,
      list: reviews,
    });
  } finally {
    db.close();
  }
});

router.get('/all', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const { equipment_id, user_id } = req.query;
  const db = getDb();
  try {
    let sql = `
      SELECT r.*, u.nickname as user_nickname, u.username, e.name as equipment_name, e.category
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN equipment e ON r.equipment_id = e.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (equipment_id) {
      sql += ' AND r.equipment_id = ?';
      params.push(equipment_id);
    }
    if (user_id) {
      sql += ' AND r.user_id = ?';
      params.push(user_id);
    }
    sql += ' ORDER BY r.created_at DESC';
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } finally {
    db.close();
  }
});

router.get('/my', authMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT r.*, e.name as equipment_name, e.category, e.image_url
      FROM reviews r
      JOIN equipment e ON r.equipment_id = e.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `).all(req.auth!.id);
    res.json(rows);
  } finally {
    db.close();
  }
});

export default router;
