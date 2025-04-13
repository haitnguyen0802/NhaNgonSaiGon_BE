const express = require('express');
const router = express.Router();
const { Product, Collaborator, Post } = require('../models/index');
const { Op } = require('sequelize');

// Dashboard homepage
router.get('/', async (req, res) => {
  try {
    // Mock statistics data
    const stats = {
      totalProducts: await Product.count(),
      discountedProducts: await Product.count({
        where: {
          status: 'discounted'
        }
      }),
      flashSaleProducts: 12, // Example value
      favoriteProducts: 25 // Example value
    };

    // Get some discounted products for display
    const discountProducts = await Product.findAll({
      where: { status: 'discounted' },
      limit: 5,
      include: [
        { model: Collaborator, as: 'collaborator' }
      ],
      order: [['updated_at', 'DESC']]
    });

    // Add a virtual discount_price field (80% of original price) for demo purposes
    discountProducts.forEach(product => {
      if (product.price) {
        // Add a 20% discount
        product.discount_price = product.price * 0.8;
      }
    });

    // Get some flash sale products for display
    const flashSaleProducts = await Product.findAll({
      where: { 
        price: { 
          [Op.gt]: 0 
        } 
      },
      limit: 5,
      include: [
        { model: Collaborator, as: 'collaborator' }
      ],
      order: [['updated_at', 'DESC']]
    });

    // Add a virtual discount_price field (50% of original price) for demo purposes
    flashSaleProducts.forEach(product => {
      if (product.price) {
        // Add a 50% discount
        product.discount_price = product.price * 0.5;
      }
    });

    res.render('dashboard/index', {
      title: 'Tổng quan',
      active: 'dashboard',
      stats,
      discountProducts,
      flashSaleProducts
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).render('error', {
      message: 'Không thể tải trang tổng quan',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
});

// API routes for dashboard stats
router.get('/api/stats', async (req, res) => {
  try {
    const stats = {
      totalProducts: await Product.count(),
      discountedProducts: await Product.count({
        where: {
          status: 'discounted'
        }
      }),
      totalPosts: await Post.count(),
      totalCollaborators: await Collaborator.count()
    };
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router; 