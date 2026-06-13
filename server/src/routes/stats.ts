import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// Overview stats
router.get('/overview', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  try {
    const totalEquip = db.prepare('SELECT COUNT(*) as count FROM equipment').get() as any;
    const totalStock = db.prepare('SELECT COALESCE(SUM(stock), 0) as count FROM equipment').get() as any;
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get() as any;
    const activeOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'renting'").get() as any;
    const totalRevenue = db.prepare("SELECT COALESCE(SUM(total_rent), 0) as total FROM orders WHERE status IN ('renting', 'returned', 'completed', 'damaged')").get() as any;
    const totalDeposit = db.prepare("SELECT COALESCE(SUM(total_deposit), 0) as total FROM orders WHERE status IN ('renting', 'returned', 'completed', 'damaged')").get() as any;
    const damageCount = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'damaged'").get() as any;
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get() as any;

    res.json({
      totalEquipment: totalEquip.count,
      totalStock: totalStock.count,
      totalOrders: totalOrders.count,
      activeOrders: activeOrders.count,
      totalRevenue: totalRevenue.total,
      totalDeposit: totalDeposit.total,
      damageCount: damageCount.count,
      totalUsers: totalUsers.count,
    });
  } finally {
    db.close();
  }
});

// Equipment usage rate per category
router.get('/usage', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT
        e.category,
        COUNT(CASE WHEN o.status = 'renting' THEN 1 END) as active_count,
        COUNT(e.id) as total_count
      FROM equipment e
      LEFT JOIN orders o ON o.equipment_id = e.id
      GROUP BY e.category
    `).all();
    res.json(rows);
  } finally {
    db.close();
  }
});

// Revenue by equipment category
router.get('/revenue', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT
        e.category,
        COUNT(o.id) as order_count,
        COALESCE(SUM(o.total_rent), 0) as total_rent,
        COALESCE(SUM(o.total_deposit), 0) as total_deposit,
        COALESCE(SUM(o.damage_deduct), 0) as total_damage_deduct
      FROM equipment e
      LEFT JOIN orders o ON o.equipment_id = e.id AND o.status IN ('renting','returned','completed','damaged')
      GROUP BY e.category
    `).all();
    res.json(rows);
  } finally {
    db.close();
  }
});

// Recent orders for admin dashboard
router.get('/recent-orders', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT o.*, e.name as equipment_name, e.category, u.nickname as user_nickname
      FROM orders o
      JOIN equipment e ON o.equipment_id = e.id
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `).all();
    res.json(rows);
  } finally {
    db.close();
  }
});

export default router;
