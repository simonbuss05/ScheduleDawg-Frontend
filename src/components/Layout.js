// src/components/Layout.js
import { NavLink, Outlet } from 'react-router-dom';
import './Layout.css';

function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1 className="sidebar-logo">ScheduleDawg</h1>
        <nav className="sidebar-nav">
          <NavLink to="/" end className="nav-link">Courses</NavLink>
          <NavLink to="/weekly" className="nav-link">Weekly</NavLink>
          <NavLink to="/daily" className="nav-link">Daily & Map</NavLink>
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;