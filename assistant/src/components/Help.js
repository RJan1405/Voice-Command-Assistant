import React from 'react';

function Help() {
  return (
    <div className="help-page">
      <h1>Help & Documentation</h1>
      
      <div className="help-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-item">
          <div className="faq-question">How do I use voice commands?</div>
          <div className="faq-answer">
            Click the "Start Listening" button and speak your command clearly. 
            You can ask for time, weather, set reminders, and more.
          </div>
        </div>
        <div className="faq-item">
          <div className="faq-question">What commands are available?</div>
          <div className="faq-answer">For help say:"Help"-</div>
          <div className="faq-answer">To add task say:"Add task to [Your task], eg:"Add task to write"-</div>
          <div className="faq-answer">To ask about your Schedule say:"Whats todays schedule"-</div>
          <div className="faq-answer">To Set a reminder of 1 minute say:"Set a reminder of 1 minute"-</div>
          <div className="faq-answer">Search Queries:"Search for(your Query),  eg: "Search for what is Artificial Intelligence"-</div>
          <div className="faq-answer">To ask about todays Weather say:"What's today's weather?"-</div>
          
          
        </div>
      </div>
    </div>
  );
}

export default Help;