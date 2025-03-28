require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const TEST_SERVER_API = 'http://20.244.56.144/test';
const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQzMTUwMDE5LCJpYXQiOjE3NDMxNDk3MTksImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjU5OGZlNzBmLThjMzktNGFjNi04YWRiLTk2YTQ4MmVhOTc3OSIsInN1YiI6ImthcnJpc2Fpa3Jpc2huYW5hZ2FzYXRpc2hyZWRkeS4yMi5jc21AYW5pdHMuZWR1LmluIn0sImNvbXBhbnlOYW1lIjoiQW5pbCBOZWVydWtvbmRhIEluc3RpdHV0ZSBPZiBUZWNobm9sb2d5IEFuZCBTY2llbmNlcyIsImNsaWVudElEIjoiNTk4ZmU3MGYtOGMzOS00YWM2LThhZGItOTZhNDgyZWE5Nzc5IiwiY2xpZW50U2VjcmV0IjoiVkVic0JzbnJSVG1YcUNsaSIsIm93bmVyTmFtZSI6IkthcnJpIFNhaSBLcmlzaG5hIE5hZ2EgU2F0aXNoIFJlZGR5Iiwib3duZXJFbWFpbCI6ImthcnJpc2Fpa3Jpc2huYW5hZ2FzYXRpc2hyZWRkeS4yMi5jc21AYW5pdHMuZWR1LmluIiwicm9sbE5vIjoiQTIyMTI2NTUyMDg0In0.cODSAXBGOQiaI6lpl-_quiOJTIF3vyekpqoDJuC9yWU";

const axiosConfig = {
    headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`
    }
};

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err));

app.use(express.json());

// Route to get top 5 users with highest posts
app.get('/users', async (req, res) => {
    try {
        console.log('data');
        const response = await axios.get(`${TEST_SERVER_API}/users`, axiosConfig);
        console.log('data');
        const usersData = response.data.users;
        console.log('data');
        
        // Fetch post counts for each user
        const usersArray = await Promise.all(Object.entries(usersData).map(async ([id, username]) => {
            try {
                const postsResponse = await axios.get(`${TEST_SERVER_API}/users/${id}/posts`, axiosConfig);
                return {
                    id,
                    username,
                    postCount: postsResponse.data.posts.length
                };
            } catch (error) {
                return { id, username, postCount: 0 };
            }
        }));
        
        const topUsers = usersArray.sort((a, b) => b.postCount - a.postCount).slice(0, 5);
        res.json(topUsers);
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// Route to get latest or popular posts
app.get('/posts', async (req, res) => {
    const { type } = req.query;
    try {
        const response = await axios.get(`${TEST_SERVER_API}/posts`, axiosConfig);
        const posts = response.data.posts;
        
        if (type === 'popular') {
            const postsWithComments = await Promise.all(posts.map(async (post) => {
                try {
                    const commentsResponse = await axios.get(`${TEST_SERVER_API}/posts/${post.id}/comments`, axiosConfig);
                    return { ...post, commentsCount: commentsResponse.data.comments.length };
                } catch (error) {
                    return { ...post, commentsCount: 0 };
                }
            }));
            
            const popularPosts = postsWithComments.sort((a, b) => b.commentsCount - a.commentsCount);
            res.json(popularPosts);
        } else if (type === 'latest') {
            const latestPosts = posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
            res.json(latestPosts);
        } else {
            res.status(400).json({ error: 'Invalid query parameter' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
