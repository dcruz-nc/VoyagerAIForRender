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



const carData = [
  {
    name: 'Tesla Model 3',
    type: 'Electric',
    seats: 5,
    mpg: '130 MPGe',
    price: '$79/day',
    summary: 'Electric • 2023 • Autopilot — high-tech and eco-friendly for a smooth modern ride.'
  },
  {
    name: 'Toyota RAV4',
    type: 'Hybrid',
    seats: 5,
    mpg: 40,
    price: '$52/day',
    summary: 'Hybrid — practical and fuel-efficient with versatile utility.'
  },
  {
    name: 'Ford Mustang',
    type: 'Sport',
    seats: 4,
    mpg: 25,
    price: '$89/day',
    summary: 'Sport • Iconic performance and bold style — made for fun driving.'
  },
  {
    name: 'Honda Civic Sport',
    type: 'Gas',
    seats: 5,
    mpg: 32,
    price: '$45/day',
    summary: '2021 • Bluetooth • Rear Cam — compact, tech-equipped, and reliable.'
  },
  {
    name: 'Jeep Wrangler',
    type: '4x4',
    seats: 5,
    mpg: 20,
    price: '$72/day',
    summary: '2022 • Off-Road Ready — rugged and built for adventure.'
  }
];

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  const carSummaries = [
  "Tesla Model 3: Electric • 2023 • Autopilot — high-tech and eco-friendly for a smooth modern ride.",
  "Toyota RAV4: Hybrid — practical and fuel-efficient with versatile utility.",
  "Ford Mustang: Sport • Iconic performance and bold style — made for fun driving.",
  "Honda Civic Sport: 2021 • Bluetooth • Rear Cam — compact, tech-equipped, and reliable.",
  "Jeep Wrangler: 2022 • Off-Road Ready — rugged and built for adventure."
];


  const systemMessage = {
    role: 'system',
    content: `
You are a helpful car rental assistant. You know the following 5 cars available for rent:

${carSummaries.join('\n')}

Ask the user questions about their needs and recommend a car accordingly.
If they ask for availability, say: "Please contact our team to confirm availability."
Do not make up cars not listed above.
    `.trim()
  };

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          systemMessage,
          { role: 'user', content: message }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const reply = response.data.choices[0].message.content;
    res.json({ reply });

  } catch (err) {
    console.error('OpenAI error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to get response from OpenAI' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});