require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/database');
const scheduler = require('./src/utils/scheduler');

// Connect to database
connectDB().then(() => {
  console.log('Database connected successfully');
  
  // Initialize scheduler after database connection
  scheduler.init();
}).catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Cloudinary Configuration
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
