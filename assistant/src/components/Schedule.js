import React, { useState } from 'react';
import './Schedule.css';

function Schedule({ schedules, setSchedules }) {
  const [newSchedule, setNewSchedule] = useState({ task: '', time: '', days: [] });
  const [editingIndex, setEditingIndex] = useState(null);
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newSchedule.task && newSchedule.time && newSchedule.days.length > 0) {
      setSchedules(prev => [...prev, newSchedule]);
      setNewSchedule({ task: '', time: '', days: [] });
    }
  };

  const handleDayToggle = (day) => {
    setNewSchedule(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const handleEdit = (schedule, index) => {
    setEditingIndex(index);
    setNewSchedule(schedule);
  };

  const handleUpdate = () => {
    if (newSchedule.task && newSchedule.time && newSchedule.days.length > 0) {
      setSchedules(prev => prev.map((item, idx) => 
        idx === editingIndex ? newSchedule : item
      ));
      setNewSchedule({ task: '', time: '', days: [] });
      setEditingIndex(null);
    }
  };

  const handleDelete = (index) => {
    setSchedules(prev => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="schedule-container">
      <h2>Regular Schedule</h2>
      
      <form onSubmit={editingIndex !== null ? (e) => { e.preventDefault(); handleUpdate(); } : handleSubmit} className="schedule-form">
        <div className="form-group">
          <label>Task:</label>
          <input
            type="text"
            value={newSchedule.task}
            onChange={(e) => setNewSchedule(prev => ({ ...prev, task: e.target.value }))}
            placeholder="Enter task"
          />
        </div>
        
        <div className="form-group">
          <label>Time:</label>
          <input
            type="time"
            value={newSchedule.time}
            onChange={(e) => setNewSchedule(prev => ({ ...prev, time: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label>Days:</label>
          <div className="days-selector">
            {daysOfWeek.map(day => (
              <button
                key={day}
                type="button"
                className={`day-btn ${newSchedule.days.includes(day) ? 'selected' : ''}`}
                onClick={() => handleDayToggle(day)}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="add-btn">
          {editingIndex !== null ? 'Update Schedule' : 'Add Schedule'}
        </button>
        {editingIndex !== null && (
          <button type="button" className="cancel-btn" onClick={() => {
            setEditingIndex(null);
            setNewSchedule({ task: '', time: '', days: [] });
          }}>
            Cancel
          </button>
        )}
      </form>

      <div className="schedules-list">
        <h3>Your Regular Schedules</h3>
        {schedules.map((schedule, index) => (
          <div key={index} className="schedule-item">
            <div className="schedule-time">{schedule.time}</div>
            <div className="schedule-task">{schedule.task}</div>
            <div className="schedule-days">
              {schedule.days.map(day => day.slice(0, 3)).join(', ')}
            </div>
            <div className="schedule-actions">
              <button className="edit-btn" onClick={() => handleEdit(schedule, index)}>
                Edit
              </button>
              <button className="delete-btn" onClick={() => handleDelete(index)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Schedule;