import express from 'express';
import { connectToDatabase } from './database/db.js';
import cors from 'cors';
import jobPostingRoutes from './routes/Job Posting/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection using helper
await connectToDatabase();

// Routes
app.use('/api/v1', jobPostingRoutes);

// Basic error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Basic Route for testing
app.get('/', (req, res) => {
    res.send('HR System API is running!');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});