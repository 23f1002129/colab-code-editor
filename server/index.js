const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { YSocketIO } = require('y-socket.io/dist/server');
const pool = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // <-- Import jsonwebtoken

const app = express();
app.use(express.json());
const server = http.createServer(app);

// Add this new function in server/index.js

function authenticateToken(req, res, next) {
    // Get the token from the Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format is "Bearer TOKEN"

    // If there's no token, deny access
    if (token == null) {
        return res.sendStatus(401); // Unauthorized
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403); // Forbidden (token is no longer valid)
        }
        
        // If the token is valid, save the user payload to the request object
        req.user = user;
        
        // Proceed to the next step (the actual route handler)
        next();
    });
}


// --- API ROUTES ---

app.post('/register', async (req, res) => {
    // Your existing registration code...
});

// --- ADD THIS NEW LOGIN ENDPOINT ---
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Check if user exists
        const userResult = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = userResult.rows[0];

        // 2. Compare the provided password with the stored hash
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // 3. If password is valid, generate a JWT
        const token = jwt.sign(
            { userId: user.id, username: user.username }, // This is the JWT payload
            process.env.JWT_SECRET,                      // The secret key from your .env file
            { expiresIn: '1h' }                          // The token will expire in 1 hour
        );

        res.json({ message: "Login successful", token });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// ... after your /login route ...

// A protected route that only authenticated users can access
app.get('/profile', authenticateToken, (req, res) => {
    // Because of the middleware, req.user is now available
    res.json({ message: `Welcome ${req.user.username}!`, user: req.user });
});

// ... your real-time setup ...

// --- REAL-TIME SETUP ---
// Your existing real-time setup code...
const io = new Server(server, { /* ... */ });
const ysocketio = new YSocketIO(io);
ysocketio.initialize();
console.log("✅ Y-Socket.IO server initialized");

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});