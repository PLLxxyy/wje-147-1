import { useState, useEffect } from 'react';
import { reviewApi } from '../api';
import { Review, CATEGORY_LABELS } from '../types';

const renderStars = (rating: number, size = 14) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} style={{ color: i <= rating ? '#faad14' : '#d9d9d9', fontSize: size }}>★</span>
    );
  }
  return <span style={{ display: 'inline-flex', gap: 2 }}>{stars}</span>;
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

  const load = () => {
    setLoading(true);
    reviewApi.allReviews().then(setReviews).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filteredReviews = reviews.filter(r => {
    if (!keyword) return true;
    const kw = keyword.toLowerCase();
    return (
      r.equipment_name?.toLowerCase().includes(kw) ||
      r.user_nickname?.toLowerCase().includes(kw) ||
      r.username?.toLowerCase().includes(kw) ||
      r.content?.toLowerCase().includes(kw)
    );
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="container">
      <div className="page-header">
        <h1>评价管理</h1>
        <p>查看和管理所有用户评价记录</p>
      </div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card orange">
          <div className="stat-label">总评价数</div>
          <div className="stat-value">{reviews.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">平均评分</div>
          <div className="stat-value" style={{ color: '#faad14' }}>
            {avgRating} <span style={{ fontSize: 16, fontWeight: 400 }}>分</span>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">5星好评</div>
          <div className="stat-value">
            {reviews.filter(r => r.rating === 5).length}
            <span style={{ fontSize: 16, fontWeight: 400 }}> 条</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="search-bar">
          <input
            className="search-input"
            placeholder="搜索装备名称、用户昵称或评价内容..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>用户</th>
                <th>装备</th>
                <th>分类</th>
                <th>评分</th>
                <th>评价内容</th>
                <th>评价时间</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center text-muted" style={{ padding: 40 }}>加载中...</td></tr>
              ) : filteredReviews.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-muted" style={{ padding: 40 }}>暂无评价记录</td></tr>
              ) : (
                filteredReviews.map(review => (
                  <tr key={review.id}>
                    <td>#{review.id}</td>
                    <td>{review.user_nickname || review.username}</td>
                    <td style={{ fontWeight: 600 }}>{review.equipment_name}</td>
                    <td>{review.category ? CATEGORY_LABELS[review.category] : '-'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {renderStars(review.rating)}
                        <span style={{ color: '#faad14', fontWeight: 600 }}>{review.rating}</span>
                      </div>
                    </td>
                    <td style={{ maxWidth: 300 }}>
                      <div style={{ 
                        color: '#666', 
                        fontSize: 13, 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {review.content || <span style={{ color: '#bbb' }}>无文字评价</span>}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: '#999' }}>
                      {new Date(review.created_at).toLocaleString('zh-CN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
