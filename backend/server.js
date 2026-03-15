import app from './src/app.js';
import connectDB from './src/config/database.js';
import { redis } from './src/config/cache.js';

import "dotenv/config";
const PORT = process.env.PORT || 3000;


// database connection
connectDB()


// server setup
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});