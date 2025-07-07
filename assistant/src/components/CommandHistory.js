import React from 'react';
import './CommandHistory.css';

function CommandHistory({ commandHistory }) {
  // Function to format the relative time (e.g., "2 days ago")
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    
    const now = Date.now();
    const diff = now - new Date(timestamp).getTime();
    
    // Convert to appropriate time unit
    const minutes = Math.floor(diff / (60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div className="command-history-container">
      <h2>Command History</h2>
      <p className="history-info">Command history is kept for 7 days</p>
      <div className="command-list">
        {commandHistory.map((command, index) => (
          <div key={index} className="command-item">
            <span className="command-number">{commandHistory.length - index}</span>
            <span className="command-text">
              {typeof command === 'string' ? command : command.text || 'Unknown command'}
            </span>
            {typeof command !== 'string' && command.timestamp && (
              <span className="command-time">{getRelativeTime(command.timestamp)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CommandHistory;