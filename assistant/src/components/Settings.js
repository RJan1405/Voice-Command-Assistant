import React from 'react';
import './Settings.css';

function Settings({ voiceSettings, setVoiceSettings, theme, setTheme }) {
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <div className="settings-container">
      <section className="settings-section">
        <h2>Voice Settings</h2>
        <div className="setting-item">
          <label>Rate:</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={voiceSettings.rate}
            onChange={(e) => setVoiceSettings(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
          />
          <span>{voiceSettings.rate}x</span>
        </div>
      </section>

      <section className="settings-section">
        <h2>Theme Settings</h2>
        <div className="theme-options">
          <button 
            className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => handleThemeChange('light')}
          >
            Light
          </button>
          <button 
            className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => handleThemeChange('dark')}
          >
            Dark
          </button>
        </div>
      </section>
    </div>
  );
}

export default Settings;