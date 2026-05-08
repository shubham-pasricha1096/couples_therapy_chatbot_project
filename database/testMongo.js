const mongoose = require('mongoose');

async function connectDB() {
  try {
    // Your full connection string here:
    const uri = "mongodb+srv://shubhampasricha1096_db_user:BtSu8q9iWNvcCXSG@cluster0.txlysp7.mongodb.net/couples-chat?retryWrites=true&w=majority";

    await mongoose.connect(uri); // no options needed
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

connectDB();