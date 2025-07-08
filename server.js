require('dotenv').config();

const express = require('express');
const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');

const session = require('express-session');
const bcrypt = require('bcrypt');

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

// Define User schema & model
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String
});
const User = mongoose.model('User', userSchema);

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Middleware: sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key', // set the environment variable for safety
  resave: false,
  saveUninitialized: false
}));


// Redirects to /login if not authenticated
function ensureAuthenticated(req, res, next) {
  // console.log(`#%# in ensureAuthenticated: ${req.session.user}, orig: ${req.originalUrl}`)
  if (req.session.user) {
    const nxtendpt = next();
    // console.log(`#%# authentication succeeded - ${nxtendpt}`)
    return nxtendpt;
  }
  // Save desired URL
  req.session.redirectTo = req.originalUrl;
  res.redirect('/login');
}

// Show login form
app.get('/login', (req, res) => {
  // console.log(`#%# get /login - ${__dirname}`)
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', async (req, res) => { // process login
  const { email, password } = req.body;
  // console.log(`#%# post /login - ${email},  ${password}`)
  const user = await User.findOne({ email });
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.user = { id: user._id, email: user.email };
    // Redirect back or to /index.html
    const dest = req.session.redirectTo || '/index.html';
    delete req.session.redirectTo;
    // console.log(`#%# post /login redirect dest:  ${dest}`)
    return res.redirect(dest);
  }

  // login did not succeed - redirect to login page again with error message
  res.redirect('/login?error=Invalid%20username%20or%20password');
});

app.get('/rentals.html', ensureAuthenticated, (req, res) => {
  // console.log(`#%# in get /rentals.html`)
  res.sendFile(path.join(__dirname, 'public', 'rentals-authenticated.html'));
});

app.get('/home', (req, res) => {
  // console.log(`#%# get /home - ${__dirname}`)
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      // console.error('Logout error:', err);
      return res.status(500).send('Could not log out.');
    }
    // console.log('logged out - session destroyed')
    res.redirect('/home');
  });
});

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
