// src/components/Layout.js
import { NavLink, Outlet } from 'react-router-dom';
import './Layout.css';

function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1 className="sidebar-logo">ScheduleDawg</h1>
        <nav className="sidebar-nav">
          <NavLink to="/" end className="nav-link">Weekly</NavLink>
          <NavLink to="/daily" className="nav-link">Daily</NavLink>
          <NavLink to="/assignments" className="nav-link">Assignments</NavLink>
          <NavLink to="/events" className="nav-link">Events</NavLink>
          <NavLink to="/courses" className="nav-link">Courses</NavLink>
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;