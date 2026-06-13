import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// Create order (user)
router.post('/', authMiddleware, (req: Request, res: Response) => {
  const { equipment_id, start_date, end_date } = req.body;
  if (!equipment_id || !start_date || !end_date) {
    res.status(400).json({ error: '请填写完整租赁信息' });
    return;
  }
  const db = getDb();
  try {
    const equip = db.prepare('SELECT * FROM equipment WHERE id = ?').get(equipment_id) as any;
    if (!equip) {
      res.status(404).json({ error: '装备不存在' });
      return;
    }
    if (equip.stock <= 0) {
      res.status(400).json({ error: '该装备已无库存' });
      return;
    }
    const start = new Date(start_date);
    const end = new Date(end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) {
      res.status(400).json({ error: '租期至少为1天' });
      return;
    }
    const totalRent = equip.daily_rate * days;
    const totalDeposit = equip.deposit;
    const totalAmount = totalRent + totalDeposit;

    // Decrease stock atomically
    const stockUpdate = db.prepare('UPDATE equipment SET stock = stock - 1 WHERE id = ? AND stock > 0').run(equipment_id);
    if (stockUpdate.changes === 0) {
      res.status(400).json({ error: '该装备已无库存' });
      return;
    }

    const result = db.prepare(
      `INSERT INTO orders (user_id, equipment_id, start_date, end_date, days, total_rent, total_deposit, total_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
    ).run(req.auth!.id, equipment_id, start_date, end_date, days, totalRent, totalDeposit, totalAmount);

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
    res.json(order);
  } finally {
    db.close();
  }
});

// Get user's orders
router.get('/my', authMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT o.*, e.name as equipment_name, e.category, e.brand, e.image_url
      FROM orders o
      JOIN equipment e ON o.equipment_id = e.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `).all(req.auth!.id);
    res.json(rows);
  } finally {
    db.close();
  }
});

// Get all orders (admin)
router.get('/all', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const { status } = req.query;
  const db = getDb();
  try {
    let sql = `
      SELECT o.*, e.name as equipment_name, e.category, e.brand, u.nickname as user_nickname, u.username
      FROM orders o
      JOIN equipment e ON o.equipment_id = e.id
      JOIN users u ON o.user_id = u.id
    `;
    const params: any[] = [];
    if (status && status !== 'all') {
      sql += ' WHERE o.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY o.created_at DESC';
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } finally {
    db.close();
  }
});

// Admin: confirm order (出库) -> directly to renting
router.put('/:id/confirm', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
    if (!order) {
      res.status(404).json({ error: '订单不存在' });
      return;
    }
    if (order.status !== 'pending') {
      res.status(400).json({ error: '只能确认待处理的订单' });
      return;
    }
    db.prepare("UPDATE orders SET status = 'renting', confirmed_at = datetime('now') WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } finally {
    db.close();
  }
});

// User: return equipment
router.put('/:id/return', authMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
    if (!order) {
      res.status(404).json({ error: '订单不存在' });
      return;
    }
    if (order.status !== 'renting') {
      res.status(400).json({ error: '只能归还租赁中的装备' });
      return;
    }
    if (order.user_id !== req.auth!.id && req.auth!.role !== 'admin') {
      res.status(403).json({ error: '无权操作此订单' });
      return;
    }
    db.prepare("UPDATE orders SET status = 'returned', returned_at = datetime('now') WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } finally {
    db.close();
  }
});

// Admin: complete inspection (no damage)
router.put('/:id/complete', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
    if (!order) {
      res.status(404).json({ error: '订单不存在' });
      return;
    }
    if (order.status !== 'returned') {
      res.status(400).json({ error: '只能检查已归还的订单' });
      return;
    }
    db.prepare("UPDATE orders SET status = 'completed', completed_at = datetime('now') WHERE id = ?").run(req.params.id);
    // Restore stock
    db.prepare('UPDATE equipment SET stock = stock + 1 WHERE id = ?').run(order.equipment_id);
    res.json({ success: true });
  } finally {
    db.close();
  }
});

// Admin: mark as damaged
router.put('/:id/damage', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const { damage_desc, damage_deduct } = req.body;
  const db = getDb();
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
    if (!order) {
      res.status(404).json({ error: '订单不存在' });
      return;
    }
    if (order.status !== 'returned') {
      res.status(400).json({ error: '只能检查已归还的订单' });
      return;
    }
    const deduct = Number(damage_deduct) || 0;
    db.prepare(
      "UPDATE orders SET status = 'damaged', damage_desc = ?, damage_deduct = ?, completed_at = datetime('now') WHERE id = ?"
    ).run(damage_desc || '', deduct, req.params.id);
    // Restore stock
    db.prepare('UPDATE equipment SET stock = stock + 1 WHERE id = ?').run(order.equipment_id);
    res.json({ success: true });
  } finally {
    db.close();
  }
});

// Cancel order
router.put('/:id/cancel', authMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
    if (!order) {
      res.status(404).json({ error: '订单不存在' });
      return;
    }
    if (order.user_id !== req.auth!.id && req.auth!.role !== 'admin') {
      res.status(403).json({ error: '无权操作此订单' });
      return;
    }
    if (!['pending'].includes(order.status)) {
      res.status(400).json({ error: '只能取消待处理的订单' });
      return;
    }
    db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(req.params.id);
    db.prepare('UPDATE equipment SET stock = stock + 1 WHERE id = ?').run(order.equipment_id);
    res.json({ success: true });
  } finally {
    db.close();
  }
});

export default router;
