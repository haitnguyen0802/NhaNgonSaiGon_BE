const express = require('express');
const cors = require('cors');
const path = require('path');
const layouts = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('express-flash');
const methodOverride = require('method-override');

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

// Set up method override for PUT, DELETE methods in forms
app.use(methodOverride('_method'));

// Session configuration
app.use(session({
  secret: 'nhangonsaigon-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Flash messages
app.use(flash());

// Make flash messages available to all views
app.use((req, res, next) => {
  res.locals.flashMessages = req.flash();
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.info = req.flash('info');
  res.locals.warning = req.flash('warning');
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Initialize models
require('./models/index');

// Authentication routes (no layout for auth pages)
app.use('/auth', (req, res, next) => {
  app.set('layout', false); // Disable layout for auth pages
  next();
}, authRoutes);

// Set default layout back to main for other routes
app.use((req, res, next) => {
  if (req.path.startsWith('/auth')) return next();
  app.set('layout', 'layouts/main');
  next();
});

// Mock user for development - Only enable this when working on protected routes
// Remove or comment this out when implementing actual authentication
app.use((req, res, next) => {
  // Skip for auth routes
  if (req.path.startsWith('/auth')) return next();
  
  // Set mock user for other routes during development
  req.user = {
    id: 1,
    name: 'Admin',
    email: 'admin@example.com',
    role: 'admin',
    avatar: null
  };
  res.locals.user = req.user;
  res.locals.active = '';
  res.locals.title = 'Admin Dashboard';
  next();
});

// Web routes
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

// Public routes (no auth required)
app.use('/products', productRoutes);
app.use('/posts', postRoutes);
app.use('/categories', categoryRoutes);

// Protected routes (auth required - handled in their respective router files)
app.use('/dashboard', dashboardRoutes);
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
      title: 'Error',
      message: err.message,
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
});

module.exports = app;
