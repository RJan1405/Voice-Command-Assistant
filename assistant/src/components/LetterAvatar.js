import React from 'react';

const LetterAvatar = ({ username, backgroundColor }) => {
  const styles = {
    avatar: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      backgroundColor: backgroundColor || '#1976d2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '2.5rem',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
      margin: '0 auto 20px auto'
    }
  };

  return (
    <div style={styles.avatar}>
      {username ? username.charAt(0) : 'U'}
    </div>
  );
};

export default LetterAvatar;