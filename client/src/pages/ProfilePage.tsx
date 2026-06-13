import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../components/AuthContext';
import { authApi } from '../api';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (user) {
      setNickname(user.nickname);
      setPhone(user.phone);
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      await authApi.updateProfile({ nickname, phone });
      await refreshUser();
      setMsg('更新成功');
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container" style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="page-header">
        <h1>个人中心</h1>
        <p>管理您的个人信息</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #f0f0f0' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: user.role === 'admin' ? 'linear-gradient(135deg, #faad14, #fa8c16)' : 'linear-gradient(135deg, #1890ff, #096dd9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, color: '#fff', fontWeight: 700,
          }}>
            {user.nickname.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{user.nickname}</div>
            <div style={{ fontSize: 13, color: '#999' }}>@{user.username}</div>
            <div style={{ marginTop: 4 }}>
              <span className={`user-tag ${user.role === 'admin' ? 'admin' : ''}`} style={{ display: 'inline-block' }}>
                {user.role === 'admin' ? '管理员' : '用户'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input className="form-input" value={user.username} disabled style={{ background: '#f5f5f5' }} />
          </div>
          <div className="form-group">
            <label>昵称</label>
            <input className="form-input" value={nickname} onChange={e => setNickname(e.target.value)} />
          </div>
          <div className="form-group">
            <label>手机号</label>
            <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="选填" />
          </div>
          {msg && <p style={{ color: msg === '更新成功' ? '#52c41a' : '#f5222d', marginBottom: 12, fontSize: 13 }}>{msg}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? '保存中...' : '保存修改'}
          </button>
        </form>
      </div>
    </div>
  );
}
