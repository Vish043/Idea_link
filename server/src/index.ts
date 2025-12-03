import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { initializeSocket } from './socket/socketHandler';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import ideaRoutes from './routes/ideas';
import collabRequestRoutes from './routes/collabRequests';
import ndaRoutes from './routes/nda';
import taskRoutes from './routes/tasks';
import messageRoutes from './routes/messages';
import uploadRoutes from './routes/uploads';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(httpServer);

// Connect to MongoDB
connectDatabase();

// Middleware
app.use(cors());
app.use(express.json());
// Serve uploaded files statically (for direct file access)
app.use('/api/uploads', express.static('uploads', {
  setHeaders: (res, filepath) => {
    // Set appropriate content type based on file extension
    if (filepath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    } else if (filepath.endsWith('.doc')) {
      res.setHeader('Content-Type', 'application/msword');
    } else if (filepath.endsWith('.docx')) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    } else if (filepath.match(/\.(jpg|jpeg)$/i)) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filepath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filepath.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (filepath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    }
    res.setHeader('Content-Disposition', 'inline');
  }
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'IdeaConnect API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/collab-requests', collabRequestRoutes);
app.use('/api/nda', ndaRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/uploads', uploadRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO ready for connections`);
});
