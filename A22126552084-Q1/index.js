const express = require('express');
const axios = require('axios');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const PORT = 9876;
const WINDOW_SIZE = 10;
const API_BASE_URL = 'http://20.244.56.144/test';

// const AUTH_HEADER = {
//     headers: {
//         Authorization: Bearer ${process.env.TOKEN} // Use environment variable for security
//     }
// };

const numberWindows = {
    p: [], 
    f: [], 
    e: [], 
    r: []  
};
const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQzMTUwMDE5LCJpYXQiOjE3NDMxNDk3MTksImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjU5OGZlNzBmLThjMzktNGFjNi04YWRiLTk2YTQ4MmVhOTc3OSIsInN1YiI6ImthcnJpc2Fpa3Jpc2huYW5hZ2FzYXRpc2hyZWRkeS4yMi5jc21AYW5pdHMuZWR1LmluIn0sImNvbXBhbnlOYW1lIjoiQW5pbCBOZWVydWtvbmRhIEluc3RpdHV0ZSBPZiBUZWNobm9sb2d5IEFuZCBTY2llbmNlcyIsImNsaWVudElEIjoiNTk4ZmU3MGYtOGMzOS00YWM2LThhZGItOTZhNDgyZWE5Nzc5IiwiY2xpZW50U2VjcmV0IjoiVkVic0JzbnJSVG1YcUNsaSIsIm93bmVyTmFtZSI6IkthcnJpIFNhaSBLcmlzaG5hIE5hZ2EgU2F0aXNoIFJlZGR5Iiwib3duZXJFbWFpbCI6ImthcnJpc2Fpa3Jpc2huYW5hZ2FzYXRpc2hyZWRkeS4yMi5jc21AYW5pdHMuZWR1LmluIiwicm9sbE5vIjoiQTIyMTI2NTUyMDg0In0.cODSAXBGOQiaI6lpl-_quiOJTIF3vyekpqoDJuC9yWU";


const AUTH_HEADER = {
    headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`
    }
};

// Function to fetch numbers
const fetchNumbers = async (type) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/${type}`, AUTH_HEADER);
        return response.data.numbers || [];
    } catch (error) {
        console.error(`Error fetching ${type} numbers:`, error.response?.data || error.message);
        return [];
    }
};

// Test the API
fetchNumbers('rand').then(data => console.log('Fetched Numbers:', data));



const updateWindow = (type, numbers) => {
    const window = numberWindows[type];
    const uniqueNumbers = numbers.filter(num => !window.includes(num));
    
    window.push(...uniqueNumbers);
    
    while (window.length > WINDOW_SIZE) {
        window.shift();
    }
};

const calculateAverage = (numbers) => {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((acc, num) => acc + num, 0);
    return parseFloat((sum / numbers.length).toFixed(2));
};

app.get('/numbers/:numberid', async (req, res) => {
    const { numberid } = req.params;
    if (!['p', 'f', 'e', 'r'].includes(numberid)) {
        return res.status(400).json({ error: 'Invalid number type' });
    }

    const prevState = [...numberWindows[numberid]];
    const numbers = await fetchNumbers(numberid);
    updateWindow(numberid, numbers);
    const currState = [...numberWindows[numberid]];
    const avg = calculateAverage(currState);

    res.json({
        windowPrevState: prevState,
        windowCurrState: currState,
        numbers: numbers,
        avg: avg
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});