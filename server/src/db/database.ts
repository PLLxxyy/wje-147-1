import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(__dirname, '..', '..', 'camp-gear.db');

export function getDb(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function initDb(db: Database.Database): void {
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
  `);

  // Seed data
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const hash = bcrypt.hashSync('123456', 10);

    const insertUser = db.prepare('INSERT INTO users (username, password, role, nickname) VALUES (?, ?, ?, ?)');
    insertUser.run('admin', hash, 'admin', '管理员');
    insertUser.run('user', hash, 'user', '露营达人');

    const insertEquip = db.prepare(`
      INSERT INTO equipment (name, category, brand, daily_rate, deposit, stock, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Seed equipment
    insertEquip.run('Mountain Pro 4人帐', 'tent', '牧高笛', 89, 500, 5, '双层防水结构，抗风8级，适合家庭露营');
    insertEquip.run('轻量化2人帐', 'tent', 'MSR', 120, 800, 3, '超轻2kg，专业徒步露营');
    insertEquip.run('冬季保暖睡袋', 'sleeping_bag', '黑冰', 45, 300, 8, '极限温标-15°C，鹅绒填充');
    insertEquip.run('夏季薄款睡袋', 'sleeping_bag', '迪卡侬', 20, 150, 12, '适温15°C以上，棉质面料');
    insertEquip.run('便携气炉套装', 'cookware', '火枫', 30, 200, 6, '含锅具3件套，防风炉头');
    insertEquip.run('野营炊具6件套', 'cookware', '爱路客', 25, 180, 4, '铝合金材质，含折叠刀叉');
    insertEquip.run('LED营地灯', 'lighting', '山力士', 15, 100, 10, '5000mAh充电款，IPX6防水');
    insertEquip.run('头灯夜行款', 'lighting', '山泽', 10, 80, 8, '红白双光源，300流明');
    insertEquip.run('折叠月亮椅', 'furniture', '挪客', 35, 250, 6, '承重120kg，铝合金支架');
    insertEquip.run('户外折叠桌', 'furniture', '黑鹿', 40, 300, 4, '120cm可调高度，车载露营适用');
    insertEquip.run('车载冰箱25L', 'cookware', '英得尔', 60, 600, 2, '12V/220V双用，冷藏冷冻');
    insertEquip.run('充气床垫双人', 'sleeping_bag', 'Intex', 25, 200, 5, '自动充气，含充气泵');

    console.log('Seeded default users and equipment.');
  }
}
