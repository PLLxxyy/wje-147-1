import request from 'supertest';
import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthPayload } from '../src/middleware/auth';

const JWT_SECRET = 'camp-gear-rental-secret-2026';
const TEST_DB_PATH = path.join(__dirname, '..', 'test-reviews.db');

let mockDb: Database.Database | null = null;

jest.mock('../src/db/database', () => ({
  getDb: () => mockDb!,
  initDb: jest.fn(),
}));

import reviewsRouter from '../src/routes/reviews';

function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

function setupTestDb(): Database.Database {
  const db = new Database(TEST_DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
      nickname TEXT NOT NULL,
      phone TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('tent', 'sleeping_bag', 'cookware', 'lighting', 'furniture')),
      brand TEXT NOT NULL,
      daily_rate REAL NOT NULL,
      deposit REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      image_url TEXT DEFAULT '',
      description TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      equipment_id INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      days INTEGER NOT NULL,
      total_rent REAL NOT NULL,
      total_deposit REAL NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'renting', 'returned', 'completed', 'damaged', 'cancelled')),
      damage_desc TEXT DEFAULT '',
      damage_deduct REAL DEFAULT 0,
      confirmed_at DATETIME,
      returned_at DATETIME,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (equipment_id) REFERENCES equipment(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      equipment_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      content TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (equipment_id) REFERENCES equipment(id)
    );
  `);

  return db;
}

function seedTestData(db: Database.Database) {
  const hash = bcrypt.hashSync('123456', 10);

  const insertUser = db.prepare(
    'INSERT INTO users (username, password, role, nickname) VALUES (?, ?, ?, ?)'
  );
  const userId = insertUser.run('testuser', hash, 'user', '测试用户').lastInsertRowid as number;

  const insertEquip = db.prepare(
    'INSERT INTO equipment (name, category, brand, daily_rate, deposit, stock, description) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const equipId = insertEquip.run('测试帐篷', 'tent', '测试品牌', 50, 300, 5, '测试描述').lastInsertRowid as number;

  const insertOrder = db.prepare(
    'INSERT INTO orders (user_id, equipment_id, start_date, end_date, days, total_rent, total_deposit, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const completedOrderId = insertOrder.run(userId, equipId, '2026-06-01', '2026-06-03', 2, 100, 300, 400, 'completed').lastInsertRowid as number;

  const rentingOrderId = insertOrder.run(userId, equipId, '2026-06-05', '2026-06-07', 2, 100, 300, 400, 'renting').lastInsertRowid as number;

  return { userId, equipId, completedOrderId, rentingOrderId };
}

describe('评价接口 POST /api/reviews', () => {
  let app: express.Express;
  let testData: { userId: number; equipId: number; completedOrderId: number; rentingOrderId: number };
  let userToken: string;

  beforeEach(() => {
    try { require('fs').unlinkSync(TEST_DB_PATH); } catch {}
    try { require('fs').unlinkSync(TEST_DB_PATH + '-wal'); } catch {}
    try { require('fs').unlinkSync(TEST_DB_PATH + '-shm'); } catch {}

    mockDb = setupTestDb();
    const originalClose = mockDb.close.bind(mockDb);
    (mockDb as any).close = () => {};
    (mockDb as any)._realClose = originalClose;
    testData = seedTestData(mockDb);
    userToken = signToken({ id: testData.userId, username: 'testuser', role: 'user' });

    app = express();
    app.use(express.json());
    app.use('/api/reviews', reviewsRouter);
  });

  afterEach(() => {
    if (mockDb) {
      (mockDb as any)._realClose?.();
      mockDb = null;
    }
    try { require('fs').unlinkSync(TEST_DB_PATH); } catch {}
    try { require('fs').unlinkSync(TEST_DB_PATH + '-wal'); } catch {}
    try { require('fs').unlinkSync(TEST_DB_PATH + '-shm'); } catch {}
  });

  describe('场景1: 正常评价', () => {
    it('合法的评分5和评价内容应提交成功', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          order_id: testData.completedOrderId,
          rating: 5,
          content: '装备质量很好，使用体验不错！',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body.order_id).toBe(testData.completedOrderId);
      expect(res.body.rating).toBe(5);
      expect(res.body.content).toBe('装备质量很好，使用体验不错！');
      expect(res.body.user_id).toBe(testData.userId);
      expect(res.body.equipment_id).toBe(testData.equipId);
    });

    it('评分为字符串数字 "4" 也应正常提交', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          order_id: testData.completedOrderId,
          rating: '4',
          content: '',
        });

      expect(res.status).toBe(200);
      expect(res.body.rating).toBe(4);
    });

    it('缺少 content 字段也应正常提交', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          order_id: testData.completedOrderId,
          rating: 3,
        });

      expect(res.status).toBe(200);
      expect(res.body.rating).toBe(3);
      expect(res.body.content).toBe('');
    });

    it('评分为 1 分（下限）应提交成功', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          order_id: testData.completedOrderId,
          rating: 1,
        });

      expect(res.status).toBe(200);
      expect(res.body.rating).toBe(1);
    });
  });

  describe('场景2: 重复评价', () => {
    it('同一订单评价后再次评价应返回错误', async () => {
      const first = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          order_id: testData.completedOrderId,
          rating: 5,
          content: '第一次评价',
        });
      expect(first.status).toBe(200);

      const second = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          order_id: testData.completedOrderId,
          rating: 4,
          content: '重复评价',
        });

      expect(second.status).toBe(400);
      expect(second.body.error).toBe('此订单已评价过');
    });
  });

  describe('场景3: 非法评分校验', () => {
    it('rating 为空字符串应返回 "评分不能为空"', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ order_id: testData.completedOrderId, rating: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('评分不能为空');
    });

    it('rating 为 null 应返回 "评分不能为空"', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ order_id: testData.completedOrderId, rating: null });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('评分不能为空');
    });

    it('缺少 rating 字段应返回 "评分不能为空"', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ order_id: testData.completedOrderId });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('评分不能为空');
    });

    it('rating 为非数字字符串 "abc" 应返回 "评分必须是有效数字"', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ order_id: testData.completedOrderId, rating: 'abc' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('评分必须是有效数字');
    });

    it('rating 为布尔值 true 应返回 "评分格式无效"', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ order_id: testData.completedOrderId, rating: true });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('评分格式无效');
    });

    it('rating 为对象 {} 应返回 "评分格式无效"', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ order_id: testData.completedOrderId, rating: {} });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('评分格式无效');
    });

    it('rating 为小数 3.5 应返回 "评分必须是整数"', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ order_id: testData.completedOrderId, rating: 3.5 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('评分必须是整数');
    });

    it('rating 为 0（低于下限）应返回 "评分必须在 1-5 之间"', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ order_id: testData.completedOrderId, rating: 0 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('评分必须在 1-5 之间');
    });

    it('rating 为 -1（负数）应返回 "评分必须在 1-5 之间"', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ order_id: testData.completedOrderId, rating: -1 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('评分必须在 1-5 之间');
    });

    it('rating 为 6（超过上限）应返回 "评分必须在 1-5 之间"', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ order_id: testData.completedOrderId, rating: 6 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('评分必须在 1-5 之间');
    });

    it('rating 为 999（远超过上限）应返回 "评分必须在 1-5 之间"', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ order_id: testData.completedOrderId, rating: 999 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('评分必须在 1-5 之间');
    });
  });

  describe('附加校验: order_id 和 content', () => {
    it('order_id 为空应返回 "订单ID不能为空"', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ order_id: '', rating: 5 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('订单ID不能为空');
    });

    it('order_id 为非数字 "abc" 应返回 "订单ID格式无效"', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ order_id: 'abc', rating: 5 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('订单ID格式无效');
    });

    it('order_id 为小数 1.5 应返回 "订单ID格式无效"', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ order_id: 1.5, rating: 5 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('订单ID格式无效');
    });

    it('content 为数字类型应返回 "评价内容格式无效"', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ order_id: testData.completedOrderId, rating: 5, content: 123 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('评价内容格式无效');
    });

    it('非 completed/damaged 状态的订单不能评价', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ order_id: testData.rentingOrderId, rating: 5 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('只能评价已完成的订单');
    });
  });
});
