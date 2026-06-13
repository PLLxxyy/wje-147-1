import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { equipApi, orderApi } from '../api';
import { Equipment, CATEGORY_LABELS, CATEGORY_ICONS } from '../types';
import { useAuth } from '../components/AuthContext';

export default function GearDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (id) {
      equipApi.get(Number(id)).then(setItem).catch(() => navigate('/')).finally(() => setLoading(false));
    }
  }, [id, navigate]);

  const calcDays = () => {
    if (!startDate || !endDate) return 0;
    const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const days = calcDays();
  const totalRent = item ? item.daily_rate * days : 0;
  const totalDeposit = item ? item.deposit : 0;
  const totalAmount = totalRent + totalDeposit;

  const handleOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setError('');
    setSuccess('');
    if (days <= 0) {
      setError('请选择正确的租期');
      return;
    }
    setOrderLoading(true);
    try {
      await orderApi.create({
        equipment_id: item.id,
        start_date: startDate,
        end_date: endDate,
      });
      setSuccess('下单成功！可在"我的租赁"中查看订单');
      setItem(prev => prev ? { ...prev, stock: prev.stock - 1 } : prev);
      setStartDate('');
      setEndDate('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setOrderLoading(false);
    }
  };

  if (loading) return <div className="container"><div className="empty-state"><p>加载中...</p></div></div>;
  if (!item) return <div className="container"><div className="empty-state"><p>装备不存在</p></div></div>;

  return (
    <div className="container">
      <div style={{ marginBottom: 12 }}>
        <button className="btn btn-default btn-sm" onClick={() => navigate(-1)}>← 返回</button>
      </div>
      <div className="grid-2" style={{ gap: 24 }}>
        <div>
          <div className="detail-img">
            {CATEGORY_ICONS[item.category] || '🎒'}
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>装备详情</h3>
            <p style={{ color: '#666', lineHeight: 1.8 }}>{item.description || '暂无详细描述'}</p>
          </div>
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{item.name}</h1>
          <p style={{ color: '#999', marginBottom: 16 }}>{item.brand} · {CATEGORY_LABELS[item.category]}</p>
          <div style={{ marginBottom: 20 }}>
            <span className="price-big">¥{item.daily_rate}<small>/天</small></span>
          </div>
          <div className="detail-info" style={{ marginBottom: 20 }}>
            <div className="detail-info-item">
              <div className="label">押金</div>
              <div className="value">¥{item.deposit}</div>
            </div>
            <div className="detail-info-item">
              <div className="label">库存</div>
              <div className="value" style={{ color: item.stock > 0 ? '#52c41a' : '#f5222d' }}>
                {item.stock > 0 ? `${item.stock} 件` : '已借完'}
              </div>
            </div>
            <div className="detail-info-item">
              <div className="label">分类</div>
              <div className="value">{CATEGORY_LABELS[item.category]}</div>
            </div>
            <div className="detail-info-item">
              <div className="label">品牌</div>
              <div className="value">{item.brand}</div>
            </div>
          </div>

          {user?.role === 'user' && item.stock > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>租赁下单</h3>
              <form onSubmit={handleOrder}>
                <div className="form-row">
                  <div className="form-group">
                    <label>开始日期 <span className="required">*</span></label>
                    <input
                      className="form-input"
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>结束日期 <span className="required">*</span></label>
                    <input
                      className="form-input"
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                {days > 0 && (
                  <div style={{ background: '#f6ffed', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                    <div className="flex-between mb-8">
                      <span style={{ color: '#666' }}>租期</span>
                      <span>{days} 天</span>
                    </div>
                    <div className="flex-between mb-8">
                      <span style={{ color: '#666' }}>租金</span>
                      <span>¥{item.daily_rate} × {days} = ¥{totalRent}</span>
                    </div>
                    <div className="flex-between mb-8">
                      <span style={{ color: '#666' }}>押金</span>
                      <span>¥{totalDeposit}</span>
                    </div>
                    <div className="flex-between" style={{ fontWeight: 700, fontSize: 16, borderTop: '1px solid #d9d9d9', paddingTop: 8, marginTop: 4 }}>
                      <span>合计</span>
                      <span style={{ color: '#f5222d' }}>¥{totalAmount}</span>
                    </div>
                  </div>
                )}
                {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}
                {success && <p style={{ color: '#52c41a', marginBottom: 12, fontSize: 13 }}>{success}</p>}
                <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={orderLoading}>
                  {orderLoading ? '提交中...' : '立即下单'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
