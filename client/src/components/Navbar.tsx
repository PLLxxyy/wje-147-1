import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">🏕️ <span>营地租赁</span></Link>
      <div className="navbar-nav">
        <Link to="/" className={isActive('/')}>装备库</Link>
        {user.role === 'admin' && (
          <>
            <Link to="/admin/equipments" className={isActive('/admin/equipments')}>装备管理</Link>
            <Link to="/admin/orders" className={isActive('/admin/orders')}>订单管理</Link>
            <Link to="/admin/stats" className={isActive('/admin/stats')}>数据统计</Link>
          </>
        )}
        {user.role === 'user' && (
          <>
            <Link to="/my-orders" className={isActive('/my-orders')}>我的租赁</Link>
          </>
        )}
        <Link to="/profile" className={isActive('/profile')}>个人中心</Link>
      </div>
      <div className="navbar-right">
        <span className={`user-tag ${user.role === 'admin' ? 'admin' : ''}`}>
          {user.role === 'admin' ? '管理员' : '用户'} {user.nickname}
        </span>
        <button style={{ padding: '6px 14px', background: 'rgba(255,255,255,.15)', borderRadius: 6, color: '#fff', fontSize: 13, cursor: 'pointer', border: 'none' }} onClick={logout}>退出</button>
      </div>
    </nav>
  );
}
