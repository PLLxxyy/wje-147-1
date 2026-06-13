import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register(username, password, nickname, phone);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>🏕️ 户外露营装备租赁</h1>
        <p className="sub">探索自然，轻松出行</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input
              className="form-input"
              type="text"
              placeholder="请输入用户名"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input
              className="form-input"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label>昵称 <span className="required">*</span></label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="请输入昵称"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>手机号</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="选填"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            </>
          )}
          {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}
          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={loading}>
            {loading ? '请稍候...' : mode === 'login' ? '登 录' : '注 册'}
          </button>
        </form>
        <div className="toggle">
          {mode === 'login' ? (
            <>还没有账号？<a onClick={() => { setMode('register'); setError(''); }}>立即注册</a></>
          ) : (
            <>已有账号？<a onClick={() => { setMode('login'); setError(''); }}>返回登录</a></>
          )}
        </div>
      </div>
    </div>
  );
}
