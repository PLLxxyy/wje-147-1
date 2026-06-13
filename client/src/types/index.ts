export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
  nickname: string;
  phone: string;
  created_at: string;
}

export interface Equipment {
  id: number;
  name: string;
  category: EquipmentCategory;
  brand: string;
  daily_rate: number;
  deposit: number;
  stock: number;
  image_url: string;
  description: string;
  created_at: string;
}

export type EquipmentCategory = 'tent' | 'sleeping_bag' | 'cookware' | 'lighting' | 'furniture';

export const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  tent: '帐篷',
  sleeping_bag: '睡袋',
  cookware: '炊具',
  lighting: '照明',
  furniture: '桌椅',
};

export const CATEGORY_ICONS: Record<EquipmentCategory, string> = {
  tent: '⛺',
  sleeping_bag: '🛏️',
  cookware: '🍳',
  lighting: '🔦',
  furniture: '🪑',
};

export type OrderStatus = 'pending' | 'confirmed' | 'renting' | 'returned' | 'completed' | 'damaged' | 'cancelled';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  renting: '租赁中',
  returned: '已归还',
  completed: '已完成',
  damaged: '损坏处理',
  cancelled: '已取消',
};

export const STATUS_TAG_CLASS: Record<OrderStatus, string> = {
  pending: 'tag-pending',
  confirmed: 'tag-confirmed',
  renting: 'tag-renting',
  returned: 'tag-returned',
  completed: 'tag-completed',
  damaged: 'tag-damaged',
  cancelled: 'tag-cancelled',
};

export interface Order {
  id: number;
  user_id: number;
  equipment_id: number;
  start_date: string;
  end_date: string;
  days: number;
  total_rent: number;
  total_deposit: number;
  total_amount: number;
  status: OrderStatus;
  damage_desc: string;
  damage_deduct: number;
  confirmed_at: string | null;
  returned_at: string | null;
  completed_at: string | null;
  created_at: string;
  equipment_name?: string;
  category?: EquipmentCategory;
  brand?: string;
  image_url?: string;
  user_nickname?: string;
  username?: string;
}

export interface StatsOverview {
  totalEquipment: number;
  totalStock: number;
  totalOrders: number;
  activeOrders: number;
  totalRevenue: number;
  totalDeposit: number;
  damageCount: number;
  totalUsers: number;
}

export interface CategoryUsage {
  category: EquipmentCategory;
  active_count: number;
  total_count: number;
}

export interface CategoryRevenue {
  category: EquipmentCategory;
  order_count: number;
  total_rent: number;
  total_deposit: number;
  total_damage_deduct: number;
}
