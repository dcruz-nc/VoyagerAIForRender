require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String
});

const User = mongoose.model('User', userSchema);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
    const hashed = await bcrypt.hash('testpwd', 10);
    const user1 = 'test1@example.com';
    await User.create({ email: user1, password: hashed });
    console.log(`✅ Sample user created: ${user1}  -  ${hashed}`);
    process.exit(0);

  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

