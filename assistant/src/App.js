import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Auth from './components/Auth';
import VoiceAssistant from './components/VoiceAssistant';
import TasksPage from './components/TasksPage';
import Settings from './components/Settings';
import Help from './components/Help';
import Profile from './components/Profile';
import Navigation from './components/Navigation';
import './App.css';
import Schedule from './components/Schedule';

function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [voiceSettings, setVoiceSettings] = useState(() => {
    const saved = localStorage.getItem('voiceSettings');
    return saved ? JSON.parse(saved) : { rate: 1, pitch: 1, volume: 1 };
  });
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', saved);
    return saved;
  });
  const [schedules, setSchedules] = useState([]);
  const [assistantMessages, setAssistantMessages] = useState([]);
  const [countdowns, setCountdowns] = useState({});

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = voiceSettings.rate;
      utterance.pitch = voiceSettings.pitch;
      utterance.volume = voiceSettings.volume;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startCountdown = (reminderText, minutes) => {
    const endTime = Date.now() + (minutes * 60 * 1000);

    setCountdowns(prev => ({
      ...prev,
      [reminderText]: `${minutes}:00`
    }));

    const timerId = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      const minutesLeft = Math.floor(remaining / 60000);
      const secondsLeft = Math.floor((remaining % 60000) / 1000);

      if (remaining === 0) {
        clearInterval(timerId);
        speak(`Reminder: ${reminderText}`);
        setCountdowns(prev => {
          const newCountdowns = { ...prev };
          delete newCountdowns[reminderText];
          return newCountdowns;
        });
      } else {
        setCountdowns(prev => ({
          ...prev,
          [reminderText]: `${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}`
        }));
      }
    }, 1000);

    return () => clearInterval(timerId);
  };

  useEffect(() => {
    // Load user data from localStorage on startup
    const savedUser = localStorage.getItem('user');
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      // Ensure avatar persists
      userData.avatar = savedAvatar || userData.avatar || 'https://via.placeholder.com/150';
      setUser(userData);
      // Load user-specific data
      setTasks(JSON.parse(localStorage.getItem(`tasks_${userData.id}`) || '[]'));
      setCommandHistory(JSON.parse(localStorage.getItem(`history_${userData.id}`) || '[]'));
      setSchedules(JSON.parse(localStorage.getItem(`schedules_${userData.id}`) || '[]'));
      setFavorites(JSON.parse(localStorage.getItem(`favorites_${userData.id}`) || '[]'));
    }
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(`tasks_${user.id}`, JSON.stringify(tasks));
      localStorage.setItem(`history_${user.id}`, JSON.stringify(commandHistory));
      localStorage.setItem(`schedules_${user.id}`, JSON.stringify(schedules));
      localStorage.setItem(`favorites_${user.id}`, JSON.stringify(favorites));
    }
  }, [tasks, commandHistory, schedules, favorites, user]);

  // Persist voice settings and theme when they change
  useEffect(() => {
    localStorage.setItem('voiceSettings', JSON.stringify(voiceSettings));
  }, [voiceSettings]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const handleCompleteTask = (index) => {
    setTasks(prev => prev.map((task, i) =>
      i === index ? { ...task, completed: true } : task
    ));
  };

  const handleLogin = (credentials) => {
    // Fixed user authentication
    if (credentials.username === 'Ritesh' && credentials.password === '123456') {
      const fixedUser = {
        id: 1,
        username: 'Ritesh',
        email: '23amtics153@gmail.com',
        joinDate: new Date().toISOString(),
        // Remove avatar URL and use first letter instead
        avatarColor: `#${Math.floor(Math.random() * 16777215).toString(16)}` // Random color
      };
      setUser(fixedUser);
      localStorage.setItem('user', JSON.stringify(fixedUser));
    } else {
      alert('Invalid credentials. Please use the correct username and password.');
    }
  };

  // Remove handleUpdateAvatar and related code since we won't need it anymore

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'userAvatar' && user) {
        setUser(prev => ({
          ...prev,
          avatar: e.newValue
        }));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  const handleRegister = (userData) => {
    alert('New registrations are not allowed. Please use the provided login credentials.');
  };

  const handleLogout = () => {
    const savedAvatar = localStorage.getItem('userAvatar');
    setUser(null);
    localStorage.removeItem('user');
    if (savedAvatar) {
      localStorage.setItem('userAvatar', savedAvatar);
    }
  };

  // Add these functions to clear history and tasks
  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your command history?")) {
      setCommandHistory([]);
      if (user) {
        localStorage.setItem(`history_${user.id}`, JSON.stringify([]));
      }
    }
  };

  const handleClearTasks = () => {
    if (window.confirm("Are you sure you want to clear all your tasks?")) {
      setTasks([]);
      if (user) {
        localStorage.setItem(`tasks_${user.id}`, JSON.stringify([]));
      }
    }
  };

  return (
    <BrowserRouter>
      <div className="app">
        {user ? (
          <>
            <Navigation
              commandHistory={commandHistory}
              favorites={favorites}
              voiceSettings={voiceSettings}
              setVoiceSettings={setVoiceSettings}
              onLogout={handleLogout}
              username={user.username}
            />
            <Routes>
              <Route path="/" element={
                <VoiceAssistant
                  tasks={tasks}
                  setTasks={setTasks}
                  setCommandHistory={setCommandHistory}
                  setFavorites={setFavorites}
                  voiceSettings={voiceSettings}
                  schedules={schedules}
                  messages={assistantMessages}
                  setMessages={setAssistantMessages}
                  countdowns={countdowns}
                  startCountdown={startCountdown}
                />
              } />
              <Route path="/tasks" element={<TasksPage tasks={tasks} onCompleteTask={handleCompleteTask} />} />
              <Route path="/settings" element={
                <Settings
                  voiceSettings={voiceSettings}
                  setVoiceSettings={setVoiceSettings}
                  theme={theme}
                  setTheme={setTheme}
                />
              } />
              <Route path="/help" element={<Help />} />
              <Route path="/profile" element={
                <Profile
                  user={user}
                  onLogout={handleLogout}
                  onClearHistory={handleClearHistory}
                  onClearTasks={handleClearTasks}
                />
              } />
              <Route path="/schedule" element={
                <Schedule
                  schedules={schedules}
                  setSchedules={setSchedules}
                />
              } />
            </Routes>
            {Object.keys(countdowns).length > 0 && (
              <div className="countdowns-fixed-corner">
                {Object.entries(countdowns).map(([text, time]) => (
                  <div key={text} className="countdown-timer-corner">
                    <span className="countdown-text">{text}</span>
                    <span className="countdown-time">{time}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <Auth onLogin={handleLogin} onRegister={handleRegister} />
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
