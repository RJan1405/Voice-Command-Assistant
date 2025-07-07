import React, { useState, useEffect } from 'react';
import './Profile.css';
import LetterAvatar from './LetterAvatar';

function Profile({ user, onLogout, onClearHistory, onClearTasks }) {
  const [profileImage, setProfileImage] = useState(null);
  
  // Load profile image from localStorage on component mount
  useEffect(() => {
    const savedImage = localStorage.getItem(`profileImage_${user.id}`);
    if (savedImage) {
      setProfileImage(savedImage);
    }
  }, [user.id]);
  
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result;
        setProfileImage(imageData);
        localStorage.setItem(`profileImage_${user.id}`, imageData);
      };
      reader.readAsDataURL(file);
    }
  };
  
  return (
    <div className="profile-container">
      <h1>User Profile</h1>
      
      <div className="profile-card">
        <div className="profile-avatar-section">
          {profileImage ? (
            <div className="profile-image-container">
              <img src={profileImage} alt="Profile" className="profile-image" />
              <div className="image-upload-overlay">
                <label htmlFor="profile-upload" className="upload-label">
                  Change
                </label>
              </div>
            </div>
          ) : (
            <div className="profile-image-container">
              <LetterAvatar 
                username={user.username} 
                backgroundColor={user.avatarColor} 
              />
              <div className="image-upload-overlay">
                <label htmlFor="profile-upload" className="upload-label">
                  Upload
                </label>
              </div>
            </div>
          )}
          <input 
            type="file" 
            id="profile-upload" 
            accept="image/*" 
            onChange={handleImageUpload} 
            style={{ display: 'none' }}
          />
        </div>
        
        <div className="user-info">
          <h2>{user.username}</h2>
          <p>{user.email}</p>
          <p>Member since: {new Date(user.joinDate).toLocaleDateString()}</p>
        </div>
        
        <div className="profile-section">
          <h3>Account Settings</h3>
          <p>Manage your account settings and preferences</p>
        </div>
        
        <div className="profile-actions">
          <button onClick={onLogout} className="action-button">Logout</button>
          <button onClick={onClearHistory} className="action-button clear-button">
            Clear Command History
          </button>
          <button onClick={onClearTasks} className="action-button clear-button">
            Clear All Tasks
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;