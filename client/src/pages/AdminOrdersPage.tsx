import { useState, useEffect } from 'react';
import { orderApi } from '../api';
import { Order, STATUS_LABELS, STATUS_TAG_CLASS, CATEGORY_LABELS, OrderStatus } from '../types';

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待确认' },
  { value: 'renting', label: '租赁中' },
  { value: 'returned', label: '待检查' },
  { value: 'completed', label: '已完成' },
  { value: 'damaged', label: '损坏处理' },
  { value: 'cancelled', label: '已取消' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [damageModal, setDamageModal] = useState<Order | null>(null);
  const [damageDesc, setDamageDesc] = useState('');
  const [damageDeduct, setDamageDeduct] = useState('');

  const load = () => {
    setLoading(true);
    orderApi.allOrders(filter).then(setOrders).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [filter]);

  const handleConfirm = async (id: number) => {
    if (!confirm('确认出库此订单？出库后状态将变为"租赁中"')) return;
    try { await orderApi.confirm(id); load(); } catch (err: any) { alert(err.message); }
  };

  const handleComplete = async (id: number) => {
    if (!confirm('确认装备无损坏，退还全部押金？')) return;
    try { await orderApi.complete(id); load(); } catch (err: any) { alert(err.message); }
  };

  const handleDamageSubmit = async () => {
    if (!damageModal) return;
    try {
      await orderApi.damage(damageModal.id, damageDesc, Number(damageDeduct) || 0);
      setDamageModal(null);
      setDamageDesc('');
      setDamageDeduct('');
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>订单管理</h1>
        <p>管理所有租赁订单，确认出库和归还检查</p>
      </div>

      <div className="category-tabs mb-24">
        {FILTER_OPTIONS.map(opt => (
          <span
            key={opt.value}
            className={`category-tab ${filter === opt.value ? 'active' : ''}`}
            onClick={() => setFilter(opt.value)}
          >
            {opt.label}
          </span>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>订单号</th>
                <th>用户</th>
                <th>装备</th>
                <th>分类</th>
                <th>租期</th>
                <th>租金</th>
                <th>押金</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center text-muted" style={{ padding: 40 }}>加载中...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={9} className="text-center text-muted" style={{ padding: 40 }}>暂无订单</td></tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.user_nickname || order.username}</td>
                    <td style={{ fontWeight: 600 }}>{order.equipment_name}</td>
                    <td>{order.category ? CATEGORY_LABELS[order.category] : '-'}</td>
                    <td style={{ fontSize: 12 }}>{order.start_date} ~ {order.end_date}<br/>({order.days}天)</td>
                    <td>¥{order.total_rent}</td>
                    <td>¥{order.total_deposit}</td>
                    <td><span className={`tag ${STATUS_TAG_CLASS[order.status]}`}>{STATUS_LABELS[order.status]}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {order.status === 'pending' && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleConfirm(order.id)}>确认出库</button>
                        )}
                        {order.status === 'returned' && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => handleComplete(order.id)}>检查无损</button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDamageModal(order)}>损坏处理</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {damageModal && (
        <div className="modal-overlay" onClick={() => setDamageModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>损坏处理 - 订单 #{damageModal.id}</h2>
            <p style={{ color: '#666', marginBottom: 16 }}>
              装备：{damageModal.equipment_name} | 押金：¥{damageModal.total_deposit}
            </p>
            <div className="form-group">
              <label>损坏说明</label>
              <textarea
                className="form-input"
                value={damageDesc}
                onChange={e => setDamageDesc(e.target.value)}
                placeholder="请描述装备的损坏情况"
              />
            </div>
            <div className="form-group">
              <label>扣款金额 (元)</label>
              <input
                className="form-input"
                type="number"
                min="0"
                max={damageModal.total_deposit}
                value={damageDeduct}
                onChange={e => setDamageDeduct(e.target.value)}
                placeholder="从押金中扣除的金额"
              />
              <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                最大可扣 ¥{damageModal.total_deposit}（押金全额），剩余押金将退还给用户
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setDamageModal(null)}>取消</button>
              <button className="btn btn-danger" onClick={handleDamageSubmit}>确认处理</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
