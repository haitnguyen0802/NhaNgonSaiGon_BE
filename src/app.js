const express = require('express');
const cors = require('cors');
const path = require('path');
const layouts = require('express-ejs-layouts');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const postRoutes = require('./routes/postRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const collaboratorRoutes = require('./routes/collaboratorRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { sequelize } = require('./config/database');

// Initialize express app
const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(layouts);
app.set('layout', 'layouts/main');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Initialize models
require('./models/index');

// Mock user for development
app.use((req, res, next) => {
  res.locals.user = {
    id: 1,
    name: 'Admin',
    email: 'admin@example.com',
    role: 'admin',
    avatar: null
  };
  res.locals.active = '';
  res.locals.title = 'Admin Dashboard';
  next();
});

// Web routes
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

app.use('/dashboard', dashboardRoutes);
app.use('/products', productRoutes);
app.use('/posts', postRoutes);
app.use('/categories', categoryRoutes);
app.use('/collaborators', collaboratorRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/collaborators', collaboratorRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);
  
  if (req.xhr || req.path.startsWith('/api')) {
    res.status(statusCode).json({ 
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? '' : err.stack
    });
  } else {
    res.status(statusCode).render('error', {
      message: err.message,
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
});

module.exports = app;
