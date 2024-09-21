import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_DB_URI || 'mongodb://mongo:27017/categorizer');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
