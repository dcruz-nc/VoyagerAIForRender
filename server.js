require('dotenv').config();

const express = require('express');
const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');  

const app = express();
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();  // <-- Call the connection function here

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// POST endpoint to receive contact form submissions
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  const discordPayload = {
    content: `📬 **New Contact Form Submission**\n\n**Name:** ${name}\n**Email:** ${email}\n**Subject:** ${subject}\n**Message:**\n${message}`
  };

  try {
    await axios.post(DISCORD_WEBHOOK_URL, discordPayload);
    res.status(200).json({ success: true, message: 'Message sent to Discord!' });
  } catch (error) {
    console.error('Error sending to Discord:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
