import app from './src/app.js';
import connectDB from './src/config/database.js';
import { redis } from './src/config/cache.js';
import http from 'http';
import "dotenv/config";
import { initSocketServer } from './src/sockets/server.socket.js';
const PORT = process.env.PORT || 3000;


const httpServer = http.createServer(app);

initSocketServer(httpServer);
// database connection
connectDB()


// server setup
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});