import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { equipApi } from '../api';
import { EquipmentCategory, CATEGORY_LABELS, Equipment } from '../types';

const CATS: EquipmentCategory[] = ['tent', 'sleeping_bag', 'cookware', 'lighting', 'furniture'];

interface GearFormProps {
  editId?: number;
}

export default function GearFormPage({ editId }: GearFormProps) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<EquipmentCategory>('tent');
  const [brand, setBrand] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [deposit, setDeposit] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editId) {
      equipApi.get(editId).then((item: Equipment) => {
        setName(item.name);
        setCategory(item.category);
        setBrand(item.brand);
        setDailyRate(String(item.daily_rate));
        setDeposit(String(item.deposit));
        setStock(String(item.stock));
        setDescription(item.description);
        setImageUrl(item.image_url);
      });
    }
  }, [editId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !brand || !dailyRate || !deposit) {
      setError('请填写必填项');
      return;
    }
    setLoading(true);
    try {
      const data = {
        name, category, brand,
        daily_rate: Number(dailyRate),
        deposit: Number(deposit),
        stock: Number(stock) || 0,
        description, image_url: imageUrl,
      };
      if (editId) {
        await equipApi.update(editId, data);
      } else {
        await equipApi.create(data);
      }
      navigate('/admin/equipments');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="page-header">
        <h1>{editId ? '编辑装备' : '发布新装备'}</h1>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>装备名称 <span className="required">*</span></label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="如：Mountain Pro 4人帐" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>分类 <span className="required">*</span></label>
              <select className="form-input" value={category} onChange={e => setCategory(e.target.value as EquipmentCategory)}>
                {CATS.map(c => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>品牌 <span className="required">*</span></label>
              <input className="form-input" value={brand} onChange={e => setBrand(e.target.value)} placeholder="如：牧高笛" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>日租金 (元) <span className="required">*</span></label>
              <input className="form-input" type="number" min="0" step="0.01" value={dailyRate} onChange={e => setDailyRate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>押金 (元) <span className="required">*</span></label>
              <input className="form-input" type="number" min="0" step="0.01" value={deposit} onChange={e => setDeposit(e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>库存数量</label>
              <input className="form-input" type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} />
            </div>
            <div className="form-group">
              <label>图片URL</label>
              <input className="form-input" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="选填" />
            </div>
          </div>
          <div className="form-group">
            <label>装备描述</label>
            <textarea className="form-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="选填，描述装备的详细信息" />
          </div>
          {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button className="btn btn-default" type="button" onClick={() => navigate(-1)}>取消</button>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
