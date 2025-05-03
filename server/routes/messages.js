const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Get chat history between two users
router.get('/chat', auth, async (req, res) => {
  try {
    const { userId, receiverId } = req.query;
    
    console.log('Fetching chat messages:', {
      userId,
      receiverId,
      authenticatedUser: req.user.userId
    });

    // Verify that the authenticated user matches the userId
    if (userId !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized access to chat messages' });
    }

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: receiverId },
        { sender: receiverId, receiver: userId }
      ]
    })
    .sort({ timestamp: 1 })
    .populate('sender', 'username')
    .populate('receiver', 'username');

    console.log(`Fetched ${messages.length} messages for chat between users ${userId} and ${receiverId}`);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

// Save a new message
router.post('/', auth, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    
    const message = new Message({
      sender: req.user.userId,
      receiver: receiverId,
      content,
      timestamp: new Date()
    });

    await message.save();
    
    // Populate sender and receiver information
    await message.populate('sender', 'username');
    await message.populate('receiver', 'username');

    console.log('New message saved:', message);
    res.status(201).json(message);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ message: 'Error saving message', error: error.message });
  }
});

// Mark messages as read
router.put('/read/:senderId', auth, async (req, res) => {
  try {
    await Message.updateMany(
      {
        sender: req.params.senderId,
        receiver: req.user.userId,
        read: false
      },
      { read: true }
    );

    console.log(`Marked messages as read from sender ${req.params.senderId}`);
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Error marking messages as read', error: error.message });
  }
});

module.exports = router; 