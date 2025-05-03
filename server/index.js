const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const Message = require('./models/Message');
const os = require('os');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Track connected users
const connectedUsers = new Map();

// Debug function to log connected users
const logConnectedUsers = () => {
  console.log('\n=== Connected Users Status ===');
  console.log('Total connected users:', connectedUsers.size);
  for (const [userId, socketId] of connectedUsers.entries()) {
    console.log(`User ${userId} -> Socket ${socketId}`);
  }
  console.log('============================\n');
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('\n[Socket Connect] New client connected:', socket.id);

  socket.on('join', async (userId) => {
    if (userId) {
      try {
        console.log(`\n[Join Event] User ${userId} joining with socket ${socket.id}`);
        
        // Store socket ID for this user
        connectedUsers.set(userId, socket.id);
        socket.userId = userId; // Store userId in socket object
        socket.join(userId);
        
        console.log('[Join Event] Room joined:', userId);
        logConnectedUsers();

        // Deliver any pending messages
        const pendingMessages = await Message.find({
          receiver: userId,
          status: { $ne: 'delivered' }
        }).populate('sender', 'username')
          .populate('receiver', 'username')
          .sort({ timestamp: 1 });

        console.log(`[Pending Messages] Found ${pendingMessages.length} pending messages for user ${userId}`);

        for (const message of pendingMessages) {
          const messageToSend = {
            _id: message._id,
            content: message.content,
            sender: {
              _id: message.sender._id,
              username: message.sender.username
            },
            receiver: {
              _id: message.receiver._id,
              username: message.receiver.username
            },
            timestamp: message.timestamp,
            status: 'delivered'
          };

          console.log(`[Pending Delivery] Sending message to user ${userId}:`, JSON.stringify(messageToSend, null, 2));
          socket.emit('message', messageToSend);
          
          // Update message status to delivered
          await Message.findByIdAndUpdate(message._id, { status: 'delivered' });
          console.log(`[Pending Delivery] Updated message ${message._id} status to delivered`);
        }
      } catch (error) {
        console.error('[Join Event Error]:', error);
      }
    } else {
      console.error('[Join Event Error] Received without userId');
    }
  });

  socket.on('typing', ({ roomId, isTyping }) => {
    if (roomId) {
      const receiverSocketId = connectedUsers.get(roomId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('userTyping', { userId: socket.userId, isTyping });
        console.log(`Typing status sent to ${roomId}:`, isTyping);
      }
    }
  });

  socket.on('message', async (messageData) => {
    console.log('\n=================== NEW MESSAGE EVENT ===================');
    console.log('[Message Event] 1. Received message data:', JSON.stringify(messageData, null, 2));
    console.log('[Message Event] Current socket ID:', socket.id);
    console.log('[Message Event] Current user ID:', socket.userId);
    
    try {
      // Validate message data
      if (!messageData.senderId || !messageData.receiverId || !messageData.content) {
        console.error('[Message Event] 2. Missing required fields:', {
          hasSenderId: !!messageData.senderId,
          hasReceiverId: !!messageData.receiverId,
          hasContent: !!messageData.content
        });
        throw new Error('Missing required message fields');
      }

      // Verify sender matches socket user
      if (socket.userId !== messageData.senderId) {
        console.error('[Message Event] Sender ID mismatch:', {
          socketUserId: socket.userId,
          messageSenderId: messageData.senderId
        });
        throw new Error('Sender ID mismatch');
      }

      console.log('[Message Event] 2. Message data validation passed');

      // Create new message document
      const newMessage = new Message({
        sender: messageData.senderId,
        receiver: messageData.receiverId,
        content: messageData.content,
        timestamp: new Date(),
        status: 'sent'
      });
      
      // Save to database
      console.log('[Message Event] 3. Saving message to database...');
      const savedMessage = await newMessage.save();
      console.log('[Message Event] 4. Message saved successfully:', savedMessage._id);
      
      // Populate sender and receiver information
      await savedMessage.populate('sender', 'username');
      await savedMessage.populate('receiver', 'username');
      
      const messageToSend = {
        _id: savedMessage._id,
        content: savedMessage.content,
        sender: {
          _id: savedMessage.sender._id,
          username: savedMessage.sender.username
        },
        receiver: {
          _id: savedMessage.receiver._id,
          username: savedMessage.receiver.username
        },
        timestamp: savedMessage.timestamp,
        status: 'sent'
      };

      // Get receiver's socket ID
      const receiverSocketId = connectedUsers.get(messageData.receiverId);
      console.log('[Message Event] 5. Receiver details:', {
        receiverId: messageData.receiverId,
        receiverSocketId: receiverSocketId,
        isReceiverConnected: !!receiverSocketId
      });

      // Send to receiver if they're connected
      if (receiverSocketId) {
        console.log('[Message Event] 6. Attempting to deliver message to receiver socket:', receiverSocketId);
        io.to(receiverSocketId).emit('message', {
          ...messageToSend,
          status: 'delivered'
        });
        
        // Verify the socket exists in the server
        const receiverSocket = io.sockets.sockets.get(receiverSocketId);
        if (receiverSocket) {
          console.log('[Message Event] 7. Receiver socket verified and active');
          await Message.findByIdAndUpdate(savedMessage._id, { status: 'delivered' });
          console.log('[Message Event] 8. Message marked as delivered');
        } else {
          console.log('[Message Event] 7. Warning: Receiver socket not found in server');
          connectedUsers.delete(messageData.receiverId);
          logConnectedUsers();
        }
      } else {
        console.log('[Message Event] 6. Receiver not connected, message saved for later delivery');
      }

      // Send confirmation back to sender
      socket.emit('message', {
        ...messageToSend,
        status: receiverSocketId ? 'delivered' : 'sent'
      });
      console.log('[Message Event] 9. Message confirmation sent to sender');

      console.log('=================================================\n');
    } catch (error) {
      console.error('[Message Event Error]:', {
        errorMessage: error.message,
        errorStack: error.stack,
        messageData: messageData
      });
      socket.emit('messageError', { 
        error: 'Failed to process message', 
        details: error.message 
      });
    }
  });

  socket.on('video-call-request', async (data) => {
    const { senderId, senderName, receiverId, meetingId } = data;
    console.log('Video call request:', data);

    const receiverSocket = connectedUsers.get(receiverId);
    if (receiverSocket) {
      receiverSocket.emit('video-call-request', {
        senderId,
        senderName,
        receiverId,
        meetingId
      });
    } else {
      socket.emit('video-call-response', { accepted: false });
    }
  });

  socket.on('video-call-response', ({ senderId, accepted, meetingId }) => {
    console.log('Video call response:', { senderId, accepted, meetingId });

    const senderSocket = connectedUsers.get(senderId);
    if (senderSocket) {
      senderSocket.emit('video-call-response', { accepted, meetingId });
    }
  });

  socket.on('disconnect', () => {
    console.log('\n[Socket Disconnect] Client disconnected:', socket.id);
    
    // Remove user from connected users
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log('[Socket Disconnect] User removed:', socket.userId);
    }
    
    logConnectedUsers();
  });
});

// Enhanced CORS configuration
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Requested-With', 'Authorization']
}));

// Additional security headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  
  // Log incoming requests
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Handle preflight requests
  if ('OPTIONS' === req.method) {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// Test route to verify server is working
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

const PORT = process.env.PORT || 5000;
const WIFI_IP = '192.168.35.229';

// Listen on all network interfaces using the HTTP server instead of app
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Server is accessible at:');
  console.log(` - http://localhost:${PORT}`);
  console.log(` - http://${WIFI_IP}:${PORT}`);
}); 