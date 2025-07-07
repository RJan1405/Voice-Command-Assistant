import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import CommandHistory from './CommandHistory';
import './Navigation.css';

function Navigation({ commandHistory }) {
  const location = useLocation();

  return (
    <div>
      <nav className="main-nav">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          Voice Assistant
        </Link>
        <Link to="/command-history" className={location.pathname === '/command-history' ? 'active' : ''}>
          History
        </Link>
        <Link to="/tasks" className={location.pathname === '/tasks' ? 'active' : ''}>
          Tasks
        </Link>
        <Link to="/schedule" className={location.pathname === '/schedule' ? 'active' : ''}>
          Schedule
        </Link>
        <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>
          Settings
        </Link>
        <Link to="/resources" className={location.pathname === '/resources' ? 'active' : ''}>
          Resources
        </Link>
        <Link to="/feedback" className={location.pathname === '/feedback' ? 'active' : ''}>
          Feedback
        </Link>
        <Link to="/help" className={location.pathname === '/help' ? 'active' : ''}>
          Help
        </Link>
        <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>
          Profile
        </Link>
      </nav>
      {location.pathname === '/command-history' && (
        <CommandHistory commandHistory={commandHistory} />
      )}
    </div>
  );
}

export default Navigation;