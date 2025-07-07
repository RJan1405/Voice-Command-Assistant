import React, { useState, useEffect, useRef, useCallback } from 'react';
import './VoiceAssistant.css';  // Add this import at the top

function VoiceAssistant({ tasks, setTasks, setCommandHistory, setFavorites, voiceSettings, schedules,
messages,
setMessages 
}) {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  // Remove the local messages state since we're now using props
  // const [messages, setMessages] = useState([]);
  const [countdowns, setCountdowns] = useState({});

  const speak = useCallback((text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceSettings.rate;
    utterance.pitch = voiceSettings.pitch;
    utterance.volume = voiceSettings.volume;
    window.speechSynthesis.speak(utterance);
  }, [voiceSettings]);

  const toggleListening = useCallback(() => {
    window.speechSynthesis.cancel();
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const startCountdown = useCallback((reminderText, minutes) => {
    const endTime = Date.now() + (minutes * 60 * 1000);
    
    // Set initial countdown display
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

    // Store timer ID for cleanup
    return () => clearInterval(timerId);
  }, [speak]);

  // Add this function to clean up expired tasks and commands
  const cleanupExpiredItems = useCallback(() => {
    // Clean up tasks older than 1 day
    const oneDayInMs = 24 * 60 * 60 * 1000;
    setTasks(prevTasks => 
      prevTasks.filter(task => {
        if (!task.createdAt) return true; // Keep tasks without timestamps
        return (Date.now() - new Date(task.createdAt).getTime()) <= oneDayInMs;
      })
    );
    
    // Clean up command history older than 1 week
    const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
    setCommandHistory(prevHistory => 
      prevHistory.filter(command => {
        if (!command.timestamp) return true; // Keep commands without timestamps
        return (Date.now() - new Date(command.timestamp).getTime()) <= oneWeekInMs;
      })
    );
  }, [setTasks, setCommandHistory]);

  // Run cleanup on component mount and every hour
  useEffect(() => {
    // Run cleanup immediately
    cleanupExpiredItems();
    
    // Set interval to run cleanup every hour
    const cleanupInterval = setInterval(cleanupExpiredItems, 60 * 60 * 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(cleanupInterval);
  }, [cleanupExpiredItems]);

  // Modify the handleCommand function to add timestamps
  const handleCommand = useCallback(async (text) => {
    const lowerText = text.toLowerCase().trim();
    
    // Add timestamp to command history - make sure we're always using the same format
    setCommandHistory(prev => {
      // Filter out any potential duplicates first
      const filteredHistory = prev.filter(item => 
        typeof item === 'string' ? item !== text : item.text !== text
      );
      
      // Add the new command with timestamp
      return [...filteredHistory.slice(-9), { 
        text, 
        timestamp: new Date().toISOString() 
      }];
    });
    
    // Add this new condition for schedule queries
    if (lowerText.includes("today's schedule") || lowerText.includes("my schedule")) {
      // Schedule handling code remains the same
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const todaySchedules = schedules.filter(schedule => schedule.days.includes(today));
      
      if (todaySchedules.length === 0) {
        speak("You don't have any schedules for today.");
        return;
      }

      const scheduleResponse = `Here's your schedule for today: ${todaySchedules
        .sort((a, b) => a.time.localeCompare(b.time))
        .map(schedule => `${schedule.time}: ${schedule.task}`)
        .join(', ')}`;
      
      speak(scheduleResponse);
      setMessages(prev => [...prev, { type: 'assistant', text: scheduleResponse }]);
      return;
    }
    
    setMessages(prev => [...prev, { type: 'user', text }]);
    
    // Rest of the function remains the same

    // Add to favorites if command starts with 'favorite'
    if (lowerText.startsWith('favorite')) {
      const command = text.replace('favorite', '').trim();
      setFavorites(prev => [...prev, command]);
      speak('Command added to favorites');
      return;
    }

    // Remove duplicate speak function definition here
    
    // Time command
    if (lowerText === "what's the current time" || 
        lowerText === "what time is it" ||
        lowerText === "show me the time" ||
        lowerText === "get the time" ||
        lowerText === "tell me the time") {
      const now = new Date();
      const timeOptions = { 
        hour: 'numeric', 
        minute: 'numeric', 
        hour12: true,
        timeZone: 'Asia/Kolkata'
      };
      const time = now.toLocaleTimeString('en-IN', timeOptions);
      const response = `The current time is ${time} IST`;
      speak(response);
      setMessages(prev => [...prev, { type: 'assistant', text: response }]);
      return;
    }

    // Search command
    if (lowerText.includes('search') || lowerText.includes('look up')) {
      try {
        const searchQuery = text
          .replace(/search for|look up|search|who is|what is|tell me about/gi, '')
          .trim();
        
        console.log('Processing search query:', searchQuery);
        
        const res = await fetch('http://localhost:5000/api/search', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            query: searchQuery,
            maxLength: 1000,  // Request longer responses
            fullAnswer: true  // Request complete answers
          })
        });
        
        if (!res.ok) throw new Error('Search request failed');
        
        const data = await res.json();
        console.log('Search response:', data);
        
        if (data.result) {
          // Split long responses into manageable chunks
          const chunks = data.result.match(/.{1,200}(?:\s|$)/g) || [];
          for (const chunk of chunks) {
            speak(chunk.trim());
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between chunks
          }
          setMessages(prev => [...prev, { type: 'assistant', text: data.result }]);
        } else {
          throw new Error('No search results');
        }
      } catch (error) {
        console.error('Error performing search:', error);
        const errorResponse = "Sorry, I couldn't perform the search right now. Please try again.";
        speak(errorResponse);
        setMessages(prev => [...prev, { type: 'assistant', text: errorResponse }]);
      }
      return;
    }

    // Task commands - update to add timestamps
    // Task commands
    if (lowerText.startsWith('add task')) {
      const task = text.replace('add task', '').trim();
      
      // Only add the task if there's actual text content
      if (task) {
        setTasks(prev => [...prev, { 
          text: task, 
          completed: false,
          createdAt: new Date().toISOString()
        }]);
        
        const message = `Task added: ${task}`;
        speak(message);
        setMessages(prev => [...prev, { 
          type: 'assistant', 
          text: message,
          action: 'task-added'
        }]);
      } else {
        // Handle empty task text
        const errorMessage = "Please specify a task to add.";
        speak(errorMessage);
        setMessages(prev => [...prev, { 
          type: 'assistant', 
          text: errorMessage
        }]);
      }
      return;
    }
    
    if (lowerText.startsWith('complete task')) {
      // Extract the task number or description from the command
      const taskIdentifier = text.replace('complete task', '').trim();
      
      // Try to parse as a number first (for "complete task 2" style commands)
      const taskIndex = parseInt(taskIdentifier) - 1;
      
      // Find incomplete tasks
      const incompleteTasks = tasks.filter(task => !task.completed);
      
      // Check if we have a valid index and the task exists
      if (!isNaN(taskIndex) && taskIndex >= 0 && taskIndex < tasks.length) {
        // Get the actual task object
        const taskToComplete = tasks[taskIndex];
        
        // Only proceed if the task is not already completed
        if (!taskToComplete.completed) {
          // Mark the task as complete
          setTasks(prev => prev.map((task, i) => 
            i === taskIndex ? { ...task, completed: true } : task
          ));
          
          const message = `Task ${taskIndex + 1} marked as complete`;
          speak(message);
          setMessages(prev => [...prev, { 
            type: 'assistant', 
            text: message,
            action: 'task-completed'
          }]);
        } else {
          speak("This task is already completed.");
          setMessages(prev => [...prev, { 
            type: 'assistant', 
            text: "This task is already completed."
          }]);
        }
      } 
      // If no specific identifier is provided, complete the first incomplete task
      else if (taskIdentifier.length === 0 && incompleteTasks.length > 0) {
        // Find the index of the first incomplete task in the original array
        const firstIncompleteIndex = tasks.findIndex(task => !task.completed);
        
        setTasks(prev => prev.map((task, i) => 
          i === firstIncompleteIndex ? { ...task, completed: true } : task
        ));
        
        const message = `Task "${tasks[firstIncompleteIndex].text}" marked as complete`;
        speak(message);
        setMessages(prev => [...prev, { 
          type: 'assistant', 
          text: message,
          action: 'task-completed'
        }]);
      }
      // Try to find by description if an identifier was provided
      else if (taskIdentifier.length > 0) {
        // Find the task that matches the description
        const taskToCompleteIndex = tasks.findIndex(task => 
          !task.completed && task.text.toLowerCase().includes(taskIdentifier.toLowerCase())
        );
        
        if (taskToCompleteIndex !== -1) {
          setTasks(prev => prev.map((task, i) => 
            i === taskToCompleteIndex ? { ...task, completed: true } : task
          ));
          
          const message = `Task "${tasks[taskToCompleteIndex].text}" marked as complete`;
          speak(message);
          setMessages(prev => [...prev, { 
            type: 'assistant', 
            text: message,
            action: 'task-completed'
          }]);
        } else {
          speak("I couldn't find an incomplete task matching that description.");
          setMessages(prev => [...prev, { 
            type: 'assistant', 
            text: "I couldn't find an incomplete task matching that description."
          }]);
        }
      } else {
        speak("You don't have any incomplete tasks to complete.");
        setMessages(prev => [...prev, { 
          type: 'assistant', 
          text: "You don't have any incomplete tasks to complete."
        }]);
      }
      return;
    }

    // You might also want to add a command to list tasks
    if (lowerText === 'list tasks' || lowerText === 'show tasks' || lowerText === 'what are my tasks') {
      if (tasks.length === 0) {
        const noTasksMessage = "You don't have any tasks.";
        speak(noTasksMessage);
        setMessages(prev => [...prev, { type: 'assistant', text: noTasksMessage }]);
      } else {
        const incompleteTasks = tasks.filter(task => !task.completed);
        const completedTasks = tasks.filter(task => task.completed);
        
        let taskListMessage = "";
        
        if (incompleteTasks.length > 0) {
          taskListMessage += `You have ${incompleteTasks.length} incomplete task${incompleteTasks.length !== 1 ? 's' : ''}:\n`;
          incompleteTasks.forEach((task, index) => {
            taskListMessage += `${index + 1}. ${task.text}\n`;
          });
        } else {
          taskListMessage += "You don't have any incomplete tasks.\n";
        }
        
        if (completedTasks.length > 0) {
          taskListMessage += `\nCompleted task${completedTasks.length !== 1 ? 's' : ''}:\n`;
          completedTasks.forEach((task, index) => {
            taskListMessage += `${index + 1}. ${task.text}\n`;
          });
        }
        
        speak(taskListMessage);
        setMessages(prev => [...prev, { type: 'assistant', text: taskListMessage }]);
      }
      return;
    }

    // Translation command
    if (lowerText.startsWith('translate')) {
      try {
        const textToTranslate = lowerText.replace('translate', '').trim();
        const response = await fetch(`http://localhost:5000/api/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: `translate "${textToTranslate}" to Spanish` })
        });
        const data = await response.json();
        speak(data.result);
        setMessages(prev => [...prev, { type: 'assistant', text: data.result }]);
      } catch (error) {
        console.error('Translation error:', error);
        const errorMessage = "Sorry, I couldn't translate that text.";
        speak(errorMessage);
        setMessages(prev => [...prev, { type: 'assistant', text: errorMessage }]);
      }
      return;
    }

    // Reminder command
    if (lowerText.includes('reminder')) {
      // Match both numeric and word-based numbers
      const numberWords = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
      };
      
      const minutesMatch = lowerText.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*minutes?/i);
      const reminderText = text.replace(/set a reminder|reminder|to|(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*minutes?/gi, '').trim();
      
      if (minutesMatch) {
        const minuteValue = minutesMatch[1].toLowerCase();
        const minutes = numberWords[minuteValue] || parseInt(minuteValue);
        
        if (minutes > 0) {
          try {
            startCountdown(reminderText, minutes);
            const message = `Reminder set: ${reminderText} for ${minutes} minutes`;
            speak(message);
            setMessages(prev => [...prev, { type: 'assistant', text: message }]);
          } catch (error) {
            const errorMessage = "Sorry, I couldn't set the reminder right now. Please try again later.";
            speak(errorMessage);
            setMessages(prev => [...prev, { type: 'assistant', text: errorMessage }]);
          }
        } else {
          const invalidTimeMessage = `Please specify a valid time greater than 0 minutes`;
          speak(invalidTimeMessage);
          setMessages(prev => [...prev, { type: 'assistant', text: invalidTimeMessage }]);
        }
      } else {
        const noTimeMessage = `Please specify the number of minutes for the reminder`;
        speak(noTimeMessage);
        setMessages(prev => [...prev, { type: 'assistant', text: noTimeMessage }]);
      }
      return;
    }

    // Weather command
    if (lowerText.includes('weather')) {
      try {
        const res = await fetch('http://localhost:5000/api/weather?city=surat&state=gujarat&country=india');
        if (!res.ok) throw new Error('Weather service unavailable');
        const data = await res.json();
        
        const weatherResponse = `The current weather in Surat, Gujarat is ${data.condition} with a temperature of ${data.temperature}°C. ` +
          `The humidity is ${data.humidity}% and feels like ${data.feelsLike}°C.`;
        
        speak(weatherResponse);
        setMessages(prev => [...prev, { type: 'assistant', text: weatherResponse }]);
      } catch (error) {
        console.error('Weather error:', error);
        const errorResponse = "Sorry, I couldn't get the weather information for Surat right now. Please try again later.";
        speak(errorResponse);
        setMessages(prev => [...prev, { type: 'assistant', text: errorResponse }]);
      }
      return;
    }

    // Favorite command
    if (lowerText.startsWith('favorite')) {
      const command = text.replace('favorite', '').trim();
      setFavorites(prev => [...prev, command]);
      speak('Command added to favorites');
      return;
    }

    // Calculator command
    if (lowerText.startsWith('calculate')) {
      try {
        const expression = lowerText.replace('calculate', '').trim();
        
        if (!expression) {
          throw new Error('Empty expression');
        }

        const normalizedExpression = expression
          .replace(/plus/g, '+')
          .replace(/minus/g, '-')
          .replace(/times|multiplied by/g, '*')
          .replace(/divided by/g, '/');
        
        const sanitizedExpression = normalizedExpression
          .replace(/[^0-9+\-*/().\s]/g, '')
          .trim();
        
        if (!sanitizedExpression) {
          throw new Error('Invalid expression');
        }

        // eslint-disable-next-line no-new-func
        const result = Function('return ' + sanitizedExpression)();
        
        if (typeof result !== 'number' || !isFinite(result)) {
          throw new Error('Invalid result');
        }

        const formattedResult = Number.isInteger(result) ? result : result.toFixed(2);
        const response = `The result of ${expression} is ${formattedResult}`;
        speak(response);
        setMessages(prev => [...prev, { type: 'assistant', text: response }]);
      } catch (error) {
        console.error('Calculation error:', error);
        const errorResponse = "Sorry, I couldn't perform that calculation. Please try with a simple arithmetic expression.";
        speak(errorResponse);
        setMessages(prev => [...prev, { type: 'assistant', text: errorResponse }]);
      }
      return;
    }

    // News command
    if (lowerText.includes('news')) {
      try {
        const response = await fetch(`http://localhost:5000/api/news`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error('News service unavailable');
        
        const data = await response.json();
        const newsHeadlines = data.headlines
          .slice(0, 10)
          .map((headline, index) => `${index + 1}. ${headline}`)
          .join('\n');
        
        const newsResponse = `Here are the top 10 news headlines from India:\n${newsHeadlines}`;
        speak(newsResponse);
        setMessages(prev => [...prev, { type: 'assistant', text: newsResponse }]);
      } catch (error) {
        console.error('News error:', error);
        const errorResponse = "Sorry, I couldn't fetch the latest news from India. Please try again later.";
        speak(errorResponse);
        setMessages(prev => [...prev, { type: 'assistant', text: errorResponse }]);
      }
      return;
    }

    // Joke command
    if (lowerText.includes('joke') || lowerText.includes('tell me something funny')) {
      const jokes = [
        "Why don't programmers like nature? It has too many bugs!",
        "Why did the JavaScript developer wear glasses? Because he couldn't C#!",
        "What do you call a computer that sings? A Dell!",
        "Why do Java developers wear glasses? Because they don't C#!",
        "What's a programmer's favorite place? The Cookie Store!",
        "Why did the programmer quit his job? Because he didn't get arrays!",
        "What did the computer do at lunchtime? Had a byte!",
        "Why do programmers always mix up Halloween and Christmas? Because Oct 31 equals Dec 25!",
        "Why was six afraid of seven? Because 7 8 9!",
        "What's a programmer's favorite hangout spot? Foo Bar!"
      ];
      const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
      speak(randomJoke);
      setMessages(prev => [...prev, { type: 'assistant', text: randomJoke }]);
      return;
    }

    // Date command
    if (lowerText.includes('date')) {
      const date = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const response = `Today is ${date}`;
      speak(response);
      setMessages(prev => [...prev, { type: 'assistant', text: response }]);
      return;
    }

    // Currency conversion command
    if (lowerText.includes('convert')) {
      try {
        const query = text.replace(/convert|from|to/gi, '').trim();
        const response = await fetch(`http://localhost:5000/api/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: `currency conversion ${query}` })
        });
        const data = await response.json();
        speak(data.result);
        setMessages(prev => [...prev, { type: 'assistant', text: data.result }]);
      } catch (error) {
        console.error('Currency conversion error:', error);
        const errorResponse = "Sorry, I couldn't perform the currency conversion. Please try again.";
        speak(errorResponse);
        setMessages(prev => [...prev, { type: 'assistant', text: errorResponse }]);
      }
      return;
    }

    // Help command
    if (lowerText.includes('help')) {
      const helpResponse = `I can help you with:
      1. Time - Ask "What time is it?"
      2. Weather - Ask "What's the weather?"
      3. Reminders - Say "Set a reminder to [your task]"
      4. Web Search - Say "Search for [your query]" or "Look up [your query]"
      5. Tasks - Say "Add task [task description]" or "Complete task [number]"
      6. Translation - Say "Translate [text]"
      7. Calculations - Say "Calculate [math expression]"
      8. Definitions - Say "Define [word]"
      9. News - Say "Get the latest news"
      10. Jokes - Say "Tell me a joke"
      11. Date - Ask "What's today's date?"
      12. Currency - Say "Convert [amount] [from currency] to [to currency]"`;
      speak(helpResponse);
      setMessages(prev => [...prev, { type: 'assistant', text: helpResponse }]);
      return;
    }

    // Unknown command
    speak("I'm not sure what you want me to do. Try asking for help to see available commands.");
    setMessages(prev => [...prev, { 
      type: 'assistant', 
      text: "I'm not sure what you want me to do. Try asking for help to see available commands." 
    }]);

  }, [speak, tasks, startCountdown, setCommandHistory, setFavorites, setTasks, schedules, setMessages]); // Added setMessages to dependencies

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setIsRecognizing(false);
        handleCommand(text);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecognizing(false);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecognizing(false);
        setIsListening(false);
      };

      // Add these event handlers
      recognitionRef.current.onspeechstart = () => {
        setIsRecognizing(true);
      };

      recognitionRef.current.onspeechend = () => {
        setIsRecognizing(false);
      };
    }
  }, [handleCommand]);

  return (
    <div className="voice-assistant">
      <h1>Voice Command Assistant</h1>
      
      <button onClick={toggleListening}>
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </button>

      <div className="voice-visualizer">
        {Array(20).fill().map((_, i) => (
          <div
            key={i}
            className={`voice-line ${isRecognizing ? 'active' : ''}`}
          />
        ))}
      </div>

      <div className="conversation-history">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type}`}>
            {message.text}
          </div>
        ))}
      </div>

      {Object.keys(countdowns).length > 0 && (
        <div className="countdowns">
          {Object.entries(countdowns).map(([text, time]) => (
            <div key={text} className="countdown-timer">
              <span>{text}</span>
              <span>{time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VoiceAssistant;