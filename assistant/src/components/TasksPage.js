import React from 'react';
import './TasksPage.css';

function TasksPage({ tasks, onCompleteTask }) {
  const handleCompleteTask = (index) => {
    // Call the onCompleteTask function passed from the parent
    onCompleteTask(index);
  };

  // Calculate if a task is expired (older than 1 day)
  const isTaskExpired = (task) => {
    if (!task.createdAt) return false;
    const oneDayInMs = 24 * 60 * 60 * 1000; // 1 day in milliseconds
    const taskAge = Date.now() - new Date(task.createdAt).getTime();
    return taskAge > oneDayInMs;
  };

  return (
    <div className="tasks-page">
      <h2>My Tasks</h2>
      <p className="task-info">Tasks automatically expire after 24 hours</p>
      
      <div className="tasks-container">
        <div className="tasks-group">
          <h3>Active Tasks</h3>
          <div className="tasks-list">
            {tasks.filter(task => !task.completed && !isTaskExpired(task)).map((task, index) => {
              // Find the actual index in the original array
              const originalIndex = tasks.findIndex(t => t.text === task.text && !t.completed);
              // Calculate time remaining
              const timeRemaining = task.createdAt ? 
                Math.max(0, 24 - Math.floor((Date.now() - new Date(task.createdAt).getTime()) / (60 * 60 * 1000))) : 
                "Unknown";
              
              return (
                <div key={originalIndex} className="task-item">
                  <span className="task-number">{originalIndex + 1}</span>
                  <span className="task-text">{task.text}</span>
                  <span className="task-time-remaining">{timeRemaining}h remaining</span>
                  <button 
                    className="complete-button"
                    onClick={() => handleCompleteTask(originalIndex)}
                  >
                    Complete
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="tasks-group">
          <h3>Completed Tasks</h3>
          <div className="tasks-list">
            {tasks.filter(task => task.completed && !isTaskExpired(task)).map((task, index) => (
              <div key={index} className="task-item completed">
                <span className="task-number">✓</span>
                <span className="task-text">{task.text}</span>
                <span className="task-completed-at">
                  {task.completedAt ? new Date(task.completedAt).toLocaleTimeString() : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TasksPage;