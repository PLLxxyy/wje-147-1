import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { equipApi } from '../api';
import { Equipment, CATEGORY_LABELS, CATEGORY_ICONS } from '../types';

export default function AdminEquipmentsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    equipApi.list().then(setItems).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定删除装备「${name}」吗？`)) return;
    try {
      await equipApi.delete(id);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="container">
      <div className="flex-between mb-24">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>装备管理</h1>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/equipments/new')}>
          + 发布新装备
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>名称</th>
                <th>分类</th>
                <th>品牌</th>
                <th>日租金</th>
                <th>押金</th>
                <th>库存</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center text-muted" style={{ padding: 40 }}>加载中...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-muted" style={{ padding: 40 }}>暂无装备</td></tr>
              ) : (
                items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{CATEGORY_ICONS[item.category]}</span>
                        <span style={{ fontWeight: 600 }}>{item.name}</span>
                      </div>
                    </td>
                    <td>{CATEGORY_LABELS[item.category]}</td>
                    <td>{item.brand}</td>
                    <td style={{ color: '#f5222d', fontWeight: 600 }}>¥{item.daily_rate}</td>
                    <td>¥{item.deposit}</td>
                    <td>
                      <span style={{ color: item.stock > 0 ? '#52c41a' : '#f5222d', fontWeight: 600 }}>
                        {item.stock}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-default btn-sm" onClick={() => navigate(`/admin/equipments/edit/${item.id}`)}>编辑</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id, item.name)}>删除</button>
                      </div>
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
