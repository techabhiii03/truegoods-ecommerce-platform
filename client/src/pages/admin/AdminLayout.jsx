import { NavLink, Outlet } from 'react-router-dom';
import './AdminLayout.css';

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <span className="admin-sidebar-title">Admin</span>
        <nav className="admin-sidebar-nav">
          <NavLink to="/admin/products" className={({ isActive }) => (isActive ? 'active' : '')}>
            Products
          </NavLink>
          <NavLink to="/admin/orders" className={({ isActive }) => (isActive ? 'active' : '')}>
            Orders
          </NavLink>
        </nav>
      </aside>

      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
