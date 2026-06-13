import { useState, useEffect } from 'react';
import { orderApi } from '../api';
import { Order, STATUS_LABELS, STATUS_TAG_CLASS, CATEGORY_LABELS, CATEGORY_ICONS, OrderStatus } from '../types';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    orderApi.myOrders().then(setOrders).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleReturn = async (id: number) => {
    if (!confirm('确认归还此装备？')) return;
    try {
      await orderApi.returnEquip(id);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('确认取消此订单？')) return;
    try {
      await orderApi.cancel(id);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>我的租赁</h1>
        <p>查看和管理您的租赁订单</p>
      </div>

      {loading ? (
        <div className="empty-state"><p>加载中...</p></div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>暂无租赁订单</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map(order => (
            <div className="card" key={order.id}>
              <div className="flex-between mb-8">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{order.category ? (CATEGORY_ICONS[order.category] || '🎒') : '🎒'}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{order.equipment_name}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>订单号: #{order.id}</div>
                  </div>
                </div>
                <span className={`tag ${STATUS_TAG_CLASS[order.status]}`}>{STATUS_LABELS[order.status]}</span>
              </div>
              <div className="detail-info" style={{ marginBottom: 12 }}>
                <div className="detail-info-item">
                  <div className="label">租期</div>
                  <div className="value">{order.start_date} 至 {order.end_date}（{order.days}天）</div>
                </div>
                <div className="detail-info-item">
                  <div className="label">租金</div>
                  <div className="value">¥{order.total_rent}</div>
                </div>
                <div className="detail-info-item">
                  <div className="label">押金</div>
                  <div className="value">¥{order.total_deposit}</div>
                </div>
                <div className="detail-info-item">
                  <div className="label">合计</div>
                  <div className="value" style={{ color: '#f5222d', fontWeight: 700 }}>¥{order.total_amount}</div>
                </div>
              </div>
              {order.damage_desc && (
                <div style={{ background: '#fff1f0', padding: 12, borderRadius: 6, marginBottom: 12, fontSize: 13, color: '#f5222d' }}>
                  损坏说明：{order.damage_desc}（扣款 ¥{order.damage_deduct}）
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                {order.status === 'pending' && (
                  <button className="btn btn-default btn-sm" onClick={() => handleCancel(order.id)}>取消订单</button>
                )}
                {order.status === 'renting' && (
                  <button className="btn btn-success btn-sm" onClick={() => handleReturn(order.id)}>确认归还</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
