import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory (.env file should be in productManagementBackend folder)
dotenv.config({ path: join(__dirname, '..', '.env') });

// Helper function to hash password
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

async function createDemoUser() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/productmanagement';
    
    if (!process.env.MONGODB_URI) {
      console.log('⚠️  MONGODB_URI not found in .env, using default: mongodb://localhost:27017/productmanagement');
    }
    
    if (!mongoUri) {
      console.error('❌ Error: MONGODB_URI is required in .env file');
      console.error('   Please create a .env file in productManagementBackend folder with:');
      console.error('   MONGODB_URI=mongodb://localhost:27017/productmanagement');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if admin user already exists
    const existingUser = await User.findOne({ username: 'admin' });
    if (existingUser) {
      console.log('⚠️  Admin user already exists!');
      process.exit(0);
    }

    // Hash the password before saving
    const hashedPassword = await hashPassword('admin123');

    // Create demo user
    const user = await User.create({
      username: 'admin',
      password: hashedPassword, // Save hashed password
      name: 'Admin User',
      email: 'admin@example.com',
    });

    console.log('✅ Demo user created successfully!');
    console.log('📝 Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   User ID:', user._id);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating demo user:', error);
    process.exit(1);
  }
}

createDemoUser();

