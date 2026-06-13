import { useState, useEffect } from 'react';
import { orderApi, reviewApi } from '../api';
import { Order, STATUS_LABELS, STATUS_TAG_CLASS, CATEGORY_LABELS, CATEGORY_ICONS, OrderStatus } from '../types';

const renderStars = (rating: number, size = 14) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} style={{ color: i <= rating ? '#faad14' : '#d9d9d9', fontSize: size }}>★</span>
    );
  }
  return <span style={{ display: 'inline-flex', gap: 2 }}>{stars}</span>;
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState<Order | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

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

  const openReviewModal = (order: Order) => {
    setReviewModal(order);
    setReviewRating(5);
    setReviewContent('');
  };

  const handleReviewSubmit = async () => {
    if (!reviewModal) return;
    if (reviewRating < 1 || reviewRating > 5) {
      alert('请选择评分');
      return;
    }
    setReviewSubmitting(true);
    try {
      await reviewApi.create({
        order_id: reviewModal.id,
        rating: reviewRating,
        content: reviewContent,
      });
      setReviewModal(null);
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const canReview = (order: Order) => {
    return (order.status === 'completed' || order.status === 'damaged') && !order.review_id;
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
              {order.review_id && order.review_rating && (
                <div style={{ background: '#fffbe6', padding: 12, borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: '#666' }}>我的评价：</span>
                    {renderStars(order.review_rating)}
                    <span style={{ color: '#faad14', fontWeight: 600 }}>{order.review_rating}分</span>
                  </div>
                  {order.review_content && (
                    <div style={{ color: '#666', marginTop: 4 }}>{order.review_content}</div>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                {order.status === 'pending' && (
                  <button className="btn btn-default btn-sm" onClick={() => handleCancel(order.id)}>取消订单</button>
                )}
                {order.status === 'renting' && (
                  <button className="btn btn-success btn-sm" onClick={() => handleReturn(order.id)}>确认归还</button>
                )}
                {canReview(order) && (
                  <button className="btn btn-warning btn-sm" onClick={() => openReviewModal(order)}>去评价</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewModal && (
        <div className="modal-overlay" onClick={() => setReviewModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>评价装备 - {reviewModal.equipment_name}</h2>
            <p style={{ color: '#666', marginBottom: 20 }}>
              订单号: #{reviewModal.id} | 租期: {reviewModal.days}天
            </p>
            <div className="form-group">
              <label>评分 <span className="required">*</span></label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <span
                    key={n}
                    onClick={() => setReviewRating(n)}
                    style={{
                      fontSize: 32,
                      cursor: 'pointer',
                      color: n <= reviewRating ? '#faad14' : '#d9d9d9',
                      transition: 'color .2s',
                    }}
                  >
                    ★
                  </span>
                ))}
                <span style={{ marginLeft: 12, color: '#faad14', fontWeight: 600, fontSize: 18 }}>
                  {reviewRating} 分
                </span>
              </div>
            </div>
            <div className="form-group">
              <label>评价内容</label>
              <textarea
                className="form-input"
                value={reviewContent}
                onChange={e => setReviewContent(e.target.value)}
                placeholder="分享您的使用体验（选填）"
                rows={4}
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setReviewModal(null)}>取消</button>
              <button className="btn btn-primary" onClick={handleReviewSubmit} disabled={reviewSubmitting}>
                {reviewSubmitting ? '提交中...' : '提交评价'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
