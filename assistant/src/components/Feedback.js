import React, { useState } from 'react';

function Feedback() {
  const [feedback, setFeedback] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle feedback submission
    console.log('Feedback submitted:', feedback);
    setFeedback('');
  };

  return (
    <div className="feedback-page">
      <h1>Feedback</h1>
      <form className="feedback-form" onSubmit={handleSubmit}>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Share your thoughts or report issues..."
        />
        <button type="submit">Submit Feedback</button>
      </form>
    </div>
  );
}

export default Feedback;