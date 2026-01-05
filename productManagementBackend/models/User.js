import mongoose from 'mongoose';

// Define User schema - this is like a blueprint for user data
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
}, {
  timestamps: true, // This adds createdAt and updatedAt automatically
});

// Create User model from schema
const User = mongoose.model('User', userSchema);

export default User;


