import { useState, useEffect } from 'react';
import { statsApi } from '../api';
import { StatsOverview, CategoryUsage, CategoryRevenue, CATEGORY_LABELS, STATUS_LABELS, STATUS_TAG_CLASS, Order } from '../types';

export default function AdminStatsPage() {
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [usage, setUsage] = useState<CategoryUsage[]>([]);
  const [revenue, setRevenue] = useState<CategoryRevenue[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      statsApi.overview(),
      statsApi.usage(),
      statsApi.revenue(),
      statsApi.recentOrders(),
    ]).then(([ov, us, rev, recent]) => {
      setOverview(ov);
      setUsage(us);
      setRevenue(rev);
      setRecentOrders(recent);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container"><div className="empty-state"><p>加载中...</p></div></div>;

  return (
    <div className="container">
      <div className="page-header">
        <h1>数据统计</h1>
        <p>装备使用率与收入报表</p>
      </div>

      {overview && (
        <div className="stat-grid">
          <div className="stat-card blue">
            <div className="stat-label">装备种类</div>
            <div className="stat-value">{overview.totalEquipment}</div>
            <div className="stat-sub">总库存 {overview.totalStock} 件</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label">总订单</div>
            <div className="stat-value">{overview.totalOrders}</div>
            <div className="stat-sub">进行中 {overview.activeOrders} 笔</div>
          </div>
          <div className="stat-card orange">
            <div className="stat-label">租赁收入</div>
            <div className="stat-value">¥{overview.totalRevenue.toLocaleString()}</div>
            <div className="stat-sub">押金池 ¥{overview.totalDeposit.toLocaleString()}</div>
          </div>
          <div className="stat-card red">
            <div className="stat-label">损坏订单</div>
            <div className="stat-value">{overview.damageCount}</div>
            <div className="stat-sub">注册用户 {overview.totalUsers} 人</div>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <h2 style={{ marginBottom: 16, fontSize: 16 }}>装备使用率（按分类）</h2>
          <table>
            <thead>
              <tr>
                <th>分类</th>
                <th>在租数量</th>
                <th>总装备数</th>
                <th>使用率</th>
              </tr>
            </thead>
            <tbody>
              {usage.map(u => {
                const rate = u.total_count > 0 ? Math.round((u.active_count / u.total_count) * 100) : 0;
                return (
                  <tr key={u.category}>
                    <td>{CATEGORY_LABELS[u.category]}</td>
                    <td>{u.active_count}</td>
                    <td>{u.total_count}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4 }}>
                          <div style={{
                            width: `${rate}%`, height: '100%', borderRadius: 4,
                            background: rate > 80 ? '#ff4d4f' : rate > 50 ? '#faad14' : '#52c41a',
                          }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, minWidth: 36 }}>{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: 16, fontSize: 16 }}>收入报表（按分类）</h2>
          <table>
            <thead>
              <tr>
                <th>分类</th>
                <th>订单数</th>
                <th>租金收入</th>
                <th>押金收入</th>
                <th>扣款</th>
              </tr>
            </thead>
            <tbody>
              {revenue.map(r => (
                <tr key={r.category}>
                  <td>{CATEGORY_LABELS[r.category]}</td>
                  <td>{r.order_count}</td>
                  <td style={{ color: '#52c41a', fontWeight: 600 }}>¥{r.total_rent.toLocaleString()}</td>
                  <td>¥{r.total_deposit.toLocaleString()}</td>
                  <td style={{ color: r.total_damage_deduct > 0 ? '#f5222d' : '#999' }}>
                    ¥{r.total_damage_deduct.toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr style={{ fontWeight: 700 }}>
                <td>合计</td>
                <td>{revenue.reduce((s, r) => s + r.order_count, 0)}</td>
                <td style={{ color: '#52c41a' }}>¥{revenue.reduce((s, r) => s + r.total_rent, 0).toLocaleString()}</td>
                <td>¥{revenue.reduce((s, r) => s + r.total_deposit, 0).toLocaleString()}</td>
                <td style={{ color: '#f5222d' }}>¥{revenue.reduce((s, r) => s + r.total_damage_deduct, 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginBottom: 16, fontSize: 16 }}>最近订单</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>订单号</th>
                <th>用户</th>
                <th>装备</th>
                <th>租期</th>
                <th>金额</th>
                <th>状态</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(o => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>{o.user_nickname}</td>
                  <td>{o.equipment_name}</td>
                  <td style={{ fontSize: 12 }}>{o.start_date} ~ {o.end_date}</td>
                  <td style={{ fontWeight: 600 }}>¥{o.total_amount}</td>
                  <td><span className={`tag ${STATUS_TAG_CLASS[o.status]}`}>{STATUS_LABELS[o.status]}</span></td>
                  <td style={{ fontSize: 12, color: '#999' }}>{o.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
