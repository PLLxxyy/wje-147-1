const BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${url}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '请求失败');
  }
  return data as T;
}

// Auth
export const authApi = {
  login: (username: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  register: (username: string, password: string, nickname: string, phone?: string) =>
    request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, nickname, phone }),
    }),
  getMe: () => request<any>('/auth/me'),
  updateProfile: (data: { nickname: string; phone: string }) =>
    request<{ success: boolean }>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Equipment
export const equipApi = {
  list: (category?: string, search?: string) => {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.set('category', category);
    if (search) params.set('search', search);
    return request<any[]>(`/equipment?${params.toString()}`);
  },
  get: (id: number) => request<any>(`/equipment/${id}`),
  create: (data: any) => request<any>('/equipment', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => request<any>(`/equipment/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => request<any>(`/equipment/${id}`, { method: 'DELETE' }),
};

// Orders
export const orderApi = {
  create: (data: { equipment_id: number; start_date: string; end_date: string }) =>
    request<any>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  myOrders: () => request<any[]>('/orders/my'),
  allOrders: (status?: string) => {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
    return request<any[]>(`/orders/all?${params.toString()}`);
  },
  confirm: (id: number) => request<any>(`/orders/${id}/confirm`, { method: 'PUT' }),
  returnEquip: (id: number) => request<any>(`/orders/${id}/return`, { method: 'PUT' }),
  complete: (id: number) => request<any>(`/orders/${id}/complete`, { method: 'PUT' }),
  damage: (id: number, damage_desc: string, damage_deduct: number) =>
    request<any>(`/orders/${id}/damage`, {
      method: 'PUT',
      body: JSON.stringify({ damage_desc, damage_deduct }),
    }),
  cancel: (id: number) => request<any>(`/orders/${id}/cancel`, { method: 'PUT' }),
};

// Reviews
export const reviewApi = {
  create: (data: { order_id: number; rating: number; content?: string }) =>
    request<any>('/reviews', { method: 'POST', body: JSON.stringify(data) }),
  getByEquipment: (equipmentId: number) =>
    request<any>(`/reviews/equipment/${equipmentId}`),
  allReviews: (params?: { equipment_id?: number; user_id?: number }) => {
    const search = new URLSearchParams();
    if (params?.equipment_id) search.set('equipment_id', String(params.equipment_id));
    if (params?.user_id) search.set('user_id', String(params.user_id));
    return request<any[]>(`/reviews/all?${search.toString()}`);
  },
  myReviews: () => request<any[]>('/reviews/my'),
};

// Stats
export const statsApi = {
  overview: () => request<any>('/stats/overview'),
  usage: () => request<any[]>('/stats/usage'),
  revenue: () => request<any[]>('/stats/revenue'),
  recentOrders: () => request<any[]>('/stats/recent-orders'),
};
