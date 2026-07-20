import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';

const links = [
  { to: '/admin', end: true, icon: '⌂', label: 'Overview' },
  { to: '/admin/products', icon: '◇', label: 'Products' },
  { to: '/admin/orders', icon: '▣', label: 'Orders' },
  { to: '/admin/categories', icon: '◫', label: 'Categories' },
  { to: '/admin/users', icon: '◎', label: 'Customers' },
  { to: '/admin/reviews', icon: '★', label: 'Reviews' },
];

const AdminLayout = () => {
  const { user } = useAuth();
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand"><span>TG</span><div><strong>TrueGoods</strong><small>Commerce OS</small></div></div>
        <nav className="admin-sidebar-nav">
          <p>Workspace</p>
          {links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => isActive ? 'active' : ''}><i>{link.icon}</i>{link.label}</NavLink>)}
        </nav>
        <div className="admin-sidebar-footer"><div className="admin-avatar">{user?.name?.[0]?.toUpperCase() || 'A'}</div><div><strong>{user?.name || 'Admin'}</strong><small>{user?.email}</small></div></div>
      </aside>
      <div className="admin-content"><Outlet /></div>
    </div>
  );
};
export default AdminLayout;
