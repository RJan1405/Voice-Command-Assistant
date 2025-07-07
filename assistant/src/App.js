import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Auth from './components/Auth';
import VoiceAssistant from './components/VoiceAssistant';
import TasksPage from './components/TasksPage';
import Settings from './components/Settings';
import Resources from './components/Resources';
import Feedback from './components/Feedback';
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
  const [voiceSettings, setVoiceSettings] = useState({
    rate: 1,
    pitch: 1,
    volume: 1
  });
  const [theme, setTheme] = useState('light');
  const [schedules, setSchedules] = useState([]);
  // Add this new state for messages
  // Change this line to initialize with empty array instead of loading from localStorage
  const [assistantMessages, setAssistantMessages] = useState([]);
  
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
      // Remove this line to prevent loading messages from localStorage
      // setAssistantMessages(JSON.parse(localStorage.getItem(`messages_${userData.id}`) || '[]'));
    }
  }, []);
  
  // Save data whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(`tasks_${user.id}`, JSON.stringify(tasks));
      localStorage.setItem(`history_${user.id}`, JSON.stringify(commandHistory));
      localStorage.setItem(`schedules_${user.id}`, JSON.stringify(schedules));
      localStorage.setItem(`favorites_${user.id}`, JSON.stringify(favorites));
      // Remove this line to prevent saving messages to localStorage
      // localStorage.setItem(`messages_${user.id}`, JSON.stringify(assistantMessages));
    }
  }, [tasks, commandHistory, schedules, favorites, user]); // Remove assistantMessages from dependencies

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
        avatarColor: `#${Math.floor(Math.random()*16777215).toString(16)}` // Random color
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
              <Route path="/resources" element={<Resources />} />
              <Route path="/feedback" element={<Feedback />} />
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
          </>
        ) : (
          <Auth onLogin={handleLogin} onRegister={handleRegister} />
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
