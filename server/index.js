const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { YSocketIO } = require('y-socket.io/dist/server');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

// Create and initialize the YSocketIO instance
const ysocketio = new YSocketIO(io);
ysocketio.initialize();

console.log("✅ Y-Socket.IO server initialized");

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});