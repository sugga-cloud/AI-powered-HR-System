import express from 'express';
import { connectToDatabase } from './database/db.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Database Connection using helper
await connectToDatabase();

// Basic Route
app.get('/', (req, res) => {
    res.send('Express server is running!');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});