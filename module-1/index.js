import express from 'express';
import { connectToDatabase } from './database/db.js';
import cors from 'cors';
import apiRouter from './routes/api.js';
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection using helper
await connectToDatabase();

// Routes
app.get('/healthz', (req, res) => {
    res.send('HR System API is running!');
});

// Debug middleware
app.use((req, res, next) => {
    console.log(`🔍 ${req.method} ${req.path}`);
    next();
});

app.use('/api', apiRouter);

// Basic error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    console.log(`❌ 404 - ${req.method} ${req.path}`);
    res.status(404).json({ message: 'Route not found', path: req.path });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});