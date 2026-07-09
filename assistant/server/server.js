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
app.get('/api/weather', async (req, res) => {
    let city = req.query.city || '';
    let lat = 21.1702; // Default to Surat, Gujarat
    let lon = 72.8311;
    let locationName = 'Surat, Gujarat';

    try {
        if (city) {
            console.log('Resolving location for city:', city);
            
            let searchCity = city;
            // Semantic mapping for state names/regions to their main geocodable cities
            const cityMappings = {
                'goa': 'Panjim',
                'kerala': 'Kochi',
                'kashmir': 'Srinagar',
                'assam': 'Guwahati',
                'sikkim': 'Gangtok',
                'ladakh': 'Leh'
            };
            const mappedCity = cityMappings[city.toLowerCase().trim()];
            if (mappedCity) {
                searchCity = mappedCity;
                console.log(`Mapping state/region "${city}" to city: "${searchCity}"`);
            }

            // 1. Geocode city name to lat/lon using Open-Meteo Geocoding API
            const geoRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchCity)}&count=1&language=en&format=json`, {
                timeout: 5000,
                headers: { 'User-Agent': 'assistant-app/1.0 (local development)' }
            });

            if (geoRes.data && geoRes.data.results && geoRes.data.results.length > 0) {
                const geoData = geoRes.data.results[0];
                lat = geoData.latitude;
                lon = geoData.longitude;
                const state = geoData.admin1 ? `, ${geoData.admin1}` : '';
                const country = geoData.country ? `, ${geoData.country}` : '';
                locationName = `${geoData.name}${state}${country}`;
                console.log(`Resolved "${city}" to: ${locationName} (${lat}, ${lon})`);
            } else {
                console.log(`Could not geocode "${city}", falling back to Surat`);
            }
        }

        // 2. Fetch live weather from Open-Meteo for resolved coordinates
        const weatherRes = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code`, {
            timeout: 5000,
            headers: { 'User-Agent': 'assistant-app/1.0 (local development)' }
        });
        
        const current = weatherRes.data.current;
        
        // Map WMO Weather Codes to descriptions
        const getCondition = (code) => {
            if (code === 0) return 'Clear Sky';
            if (code >= 1 && code <= 3) return 'Partly Cloudy';
            if (code === 45 || code === 48) return 'Foggy';
            if (code >= 51 && code <= 55) return 'Drizzling';
            if (code >= 61 && code <= 65) return 'Rainy';
            if (code >= 80 && code <= 82) return 'Rain Showers';
            if (code >= 95 && code <= 99) return 'Thunderstorm';
            return 'Sunny';
        };

        const weatherData = {
            temperature: Math.round(current.temperature_2m).toString(), // Just return numeric string so client adds °C
            condition: getCondition(current.weather_code),
            location: locationName,
            humidity: current.relative_humidity_2m,
            feelsLike: Math.round(current.apparent_temperature)
        };
        
        console.log('Sending live weather:', weatherData);
        res.json(weatherData);
    } catch (error) {
        console.error('Error fetching live weather, using fallback:', error.message);
        // Fallback data
        const weatherData = {
            temperature: '22',
            condition: 'Sunny',
            location: city ? `${city}` : 'Surat, Gujarat',
            humidity: 55,
            feelsLike: 23
        };
        res.json(weatherData);
    }
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

const publicApiHeaders = {
    'User-Agent': 'assistant-app/1.0 (local development)'
};

async function getWikipediaSummary(query) {
    const searchResponse = await axios.get('https://en.wikipedia.org/w/api.php', {
        headers: publicApiHeaders,
        params: {
            action: 'opensearch',
            search: query,
            limit: 1,
            namespace: 0,
            format: 'json'
        }
    });

    const title = searchResponse.data?.[1]?.[0];
    if (!title) {
        return null;
    }

    const summaryResponse = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
        headers: publicApiHeaders
    });
    return summaryResponse.data?.extract || null;
}

async function getDuckDuckGoAnswer(query) {
    const response = await axios.get('https://api.duckduckgo.com/', {
        params: {
            q: query,
            format: 'json',
            no_html: 1,
            skip_disambig: 1
        }
    });

    if (response.data?.AbstractText) {
        return response.data.AbstractText;
    }

    const relatedTopics = response.data?.RelatedTopics || [];
    for (const topic of relatedTopics) {
        if (topic?.Text) {
            return topic.Text;
        }
        if (Array.isArray(topic?.Topics)) {
            const nestedTopic = topic.Topics.find((item) => item?.Text);
            if (nestedTopic?.Text) {
                return nestedTopic.Text;
            }
        }
    }

    return null;
}

// Search endpoint
app.post('/api/search', async (req, res) => {
    const { query } = req.body;
    console.log('Received search query:', query);

    if (!query || !query.trim()) {
        return res.status(400).json({
            result: 'Please provide a search query.'
        });
    }

    const trimmedQuery = query.trim();

    // 1. Try Google Custom Search API first
    try {
        const API_KEY = process.env.SERP_API_KEY;
        const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID;

        if (API_KEY && SEARCH_ENGINE_ID) {
            const customsearch = google.customsearch('v1');
            const searchResponse = await customsearch.cse.list({
                auth: API_KEY,
                cx: SEARCH_ENGINE_ID,
                q: trimmedQuery,
                num: 1
            });

            if (searchResponse.data.items && searchResponse.data.items.length > 0) {
                console.log('Google Search successful');
                const searchResult = searchResponse.data.items[0].snippet || searchResponse.data.items[0].title;
                return res.json({ result: searchResult });
            }
        }
    } catch (googleError) {
        console.warn('Google Search API error, attempting fallbacks:', googleError.message);
    }

    // 2. Fallback to Wikipedia
    try {
        console.log('Attempting Wikipedia search for:', trimmedQuery);
        const wikipediaSummary = await getWikipediaSummary(trimmedQuery);
        if (wikipediaSummary) {
            console.log('Wikipedia Search successful');
            return res.json({ result: wikipediaSummary });
        }
    } catch (wikipediaError) {
        console.warn('Wikipedia fallback unavailable:', wikipediaError.message);
    }

    // 3. Fallback to DuckDuckGo
    try {
        console.log('Attempting DuckDuckGo search for:', trimmedQuery);
        const duckDuckGoAnswer = await getDuckDuckGoAnswer(trimmedQuery);
        if (duckDuckGoAnswer) {
            console.log('DuckDuckGo Search successful');
            return res.json({ result: duckDuckGoAnswer });
        }
    } catch (duckDuckGoError) {
        console.warn('DuckDuckGo fallback unavailable:', duckDuckGoError.message);
    }

    // 4. Default if all fail
    console.log('No search results found from any source');
    res.json({ result: `Sorry, I couldn't find specific information about "${trimmedQuery}"` });
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