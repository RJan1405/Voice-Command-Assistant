import React from 'react';
import './Settings.css';

function Settings({ voiceSettings, setVoiceSettings, theme, setTheme }) {
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
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
        <div className="setting-item">
          <label>Pitch:</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={voiceSettings.pitch}
            onChange={(e) => setVoiceSettings(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
          />
          <span>{voiceSettings.pitch}x</span>
        </div>
        <div className="setting-item">
          <label>Volume:</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={voiceSettings.volume}
            onChange={(e) => setVoiceSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
          />
          <span>{Math.round(voiceSettings.volume * 100)}%</span>
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
            Midnight
          </button>
          <button 
            className={`theme-btn ${theme === 'cyberpunk' ? 'active' : ''}`}
            onClick={() => handleThemeChange('cyberpunk')}
          >
            Cyberpunk
          </button>
          <button 
            className={`theme-btn ${theme === 'emerald' ? 'active' : ''}`}
            onClick={() => handleThemeChange('emerald')}
          >
            Emerald
          </button>
        </div>
      </section>
    </div>
  );
}

export default Settings;