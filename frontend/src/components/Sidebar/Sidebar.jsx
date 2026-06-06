import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Activity, 
  Settings, 
  FolderGit2, 
  Flame, 
  History, 
  BarChart3, 
  Layers 
} from 'lucide-react';
import './Sidebar.css';

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo-container">
        <Activity className="logo-icon" size={28} />
        <span className="logo-text">IntelliLoad</span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <ul className="nav-menu">
          <li>
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
              <BarChart3 className="nav-icon" />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/configure" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Settings className="nav-icon" />
              <span>Configure Test</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/collections" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <FolderGit2 className="nav-icon" />
              <span>API Collections</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/autonomous" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Flame className="nav-icon" />
              <span>Autonomous Stress</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/compare" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Layers className="nav-icon" />
              <span>Compare Runs</span>
            </NavLink>
          </li>
        </ul>

        <div className="sidebar-footer">
          <div className="system-status">
            <span className="status-label">Engine Status</span>
            <div className="status-value">
              <span className="status-dot animate-pulse-glow"></span>
              <span>Online</span>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar;
