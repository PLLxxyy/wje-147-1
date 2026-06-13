import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { equipApi } from '../api';
import { Equipment, EquipmentCategory, CATEGORY_LABELS, CATEGORY_ICONS } from '../types';

const ALL_CATS: EquipmentCategory[] = ['tent', 'sleeping_bag', 'cookware', 'lighting', 'furniture'];

export default function GearListPage() {
  const [items, setItems] = useState<Equipment[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    equipApi.list(category, search).then(setItems).finally(() => setLoading(false));
  }, [category, search]);

  const handleSearch = () => {
    setSearch(searchInput);
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>装备库</h1>
        <p>精选户外露营装备，让每一次出行都轻松愉快</p>
      </div>

      <div className="search-bar">
        <input
          className="search-input"
          placeholder="搜索装备名称或品牌..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <button className="btn btn-primary" onClick={handleSearch}>搜索</button>
        {search && (
          <button className="btn btn-default" onClick={() => { setSearch(''); setSearchInput(''); }}>清除</button>
        )}
      </div>

      <div className="category-tabs">
        <span
          className={`category-tab ${category === 'all' ? 'active' : ''}`}
          onClick={() => setCategory('all')}
        >
          全部
        </span>
        {ALL_CATS.map(cat => (
          <span
            key={cat}
            className={`category-tab ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
          </span>
        ))}
      </div>

      {loading ? (
        <div className="empty-state"><p>加载中...</p></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏕️</div>
          <p>暂无符合条件的装备</p>
        </div>
      ) : (
        <div className="grid-3">
          {items.map(item => (
            <Link to={`/gear/${item.id}`} key={item.id} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="gear-card">
                <div className="gear-card-img">
                  {CATEGORY_ICONS[item.category] || '🎒'}
                  {item.stock <= 0 && <span className="sold-out">已借完</span>}
                </div>
                <div className="gear-card-body">
                  <div className="gear-card-title">{item.name}</div>
                  <div className="gear-card-brand">{item.brand} · {CATEGORY_LABELS[item.category]}</div>
                  <div className="gear-card-meta">
                    <span className="gear-card-price">¥{item.daily_rate}<small>/天</small></span>
                    <span className={`gear-card-stock ${item.stock <= 0 ? 'empty' : ''}`}>
                      {item.stock > 0 ? `库存 ${item.stock}` : '已借完'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
