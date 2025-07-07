require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { google } = require('googleapis');

const app = express();
app.use(cors());
app.use(express.json());

// Store reminders in memory
let reminders = [];

// Weather endpoint
app.get('/api/weather', (req, res) => {
    const weatherData = {
        temperature: '22°C',
        condition: 'Sunny',
        location: 'Your City'
    };
    res.json(weatherData);
});

// Reminders endpoints
app.post('/api/reminder', (req, res) => {
    const { reminder } = req.body;
    reminders.push({
        id: Date.now(),
        text: reminder,
        timestamp: new Date()
    });
    res.json({ message: 'Reminder set successfully' });
});

app.get('/api/reminders', (req, res) => {
    res.json(reminders);
});

// Search endpoint
app.post('/api/search', async (req, res) => {
    try {
        const { query } = req.body;
        console.log('Received search query:', query);

        // Get API credentials from environment variables
        const API_KEY = process.env.SERP_API_KEY;
        const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID;

        // Create custom search instance
        const customsearch = google.customsearch('v1');
        const searchResponse = await customsearch.cse.list({
            auth: API_KEY,
            cx: SEARCH_ENGINE_ID,
            q: query,
            num: 1
        });

        if (searchResponse.data.items && searchResponse.data.items.length > 0) {
            console.log('Search successful');
            const searchResult = searchResponse.data.items[0].snippet || searchResponse.data.items[0].title;
            res.json({ result: searchResult });
        } else {
            console.log('No results found');
            res.json({ result: `Sorry, I couldn't find specific information about "${query}"` });
        }
    } catch (error) {
        console.error('Search error details:', error.response?.data?.error || error.message);
        res.status(500).json({
            result: `Sorry, I couldn't find information about "${req.body.query}". Please try again later.`
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});