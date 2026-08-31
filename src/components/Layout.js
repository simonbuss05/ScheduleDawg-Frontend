// src/components/Layout.js
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SemesterSwitcher from './SemesterSwitcher';
import './Layout.css';

function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close the mobile drawer automatically whenever the route changes, so
  // tapping a nav link doesn't leave it open over the new page.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <button
        type="button"
        className="mobile-menu-toggle"
        onClick={() => setMenuOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}

      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <h1 className="sidebar-logo">ScheduleDawg</h1>
          <button
            type="button"
            className="sidebar-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <SemesterSwitcher />

        <nav className="sidebar-nav">
          <NavLink to="/" end className="nav-link">Home</NavLink>
          <NavLink to="/weekly" className="nav-link">Weekly</NavLink>
          <NavLink to="/coursework" className="nav-link">Coursework</NavLink>

          <div className="nav-divider" />

          <NavLink to="/courses" className="nav-link">Courses</NavLink>
          <NavLink to="/grades" className="nav-link">Grades</NavLink>
          <NavLink to="/syllabus" className="nav-link">Syllabus</NavLink>

          <div className="nav-divider" />

          <NavLink to="/plan-ahead" className="nav-link">Plan Ahead</NavLink>

          <div className="nav-divider" />

          <NavLink to="/settings" className="nav-link">Settings</NavLink>
        </nav>

        <div className="sidebar-footer">
          {user && <span className="sidebar-user-email">{user.email}</span>}
          <button type="button" className="sidebar-logout" onClick={handleLogout}>
            <LogOut size={15} />
            Log out
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
