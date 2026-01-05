import Category from '../models/Category.js';

// Get all categories
// GET /api/categories
export async function getCategories(req, res) {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' }; // Case-insensitive search
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get categories
    const categories = await Category.find(query)
      .sort({ name: 1 }) // Sort by name ascending
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const totalItems = await Category.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum);

    res.status(200).json({
      success: true,
      data: {
        categories,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems,
          itemsPerPage: limitNum,
        },
      },
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: 'SERVER_ERROR',
    });
  }
};

// Get single category
// GET /api/categories/:id
export async function getCategory(req, res) {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        error: 'NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: 'SERVER_ERROR',
    });
  }
};

// Create category
// POST /api/categories
export async function createCategory(req, res) {
  try {
    const { name } = req.body;

    // Validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required and must be at least 2 characters',
        errors: {
          name: 'Category name is required',
        },
      });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name already exists',
        error: 'DUPLICATE_CATEGORY',
      });
    }

    // Create category
    const category = await Category.create({ name: name.trim() });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    console.error('Create category error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name already exists',
        error: 'DUPLICATE_CATEGORY',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: 'SERVER_ERROR',
    });
  }
};

// Update category
// PUT /api/categories/:id
export async function updateCategory(req, res) {
  try {
    const { name } = req.body;

    // Validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required and must be at least 2 characters',
        errors: {
          name: 'Category name is required',
        },
      });
    }

    // Check if category exists
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        error: 'NOT_FOUND',
      });
    }

    // Check if new name already exists (excluding current category)
    const existingCategory = await Category.findOne({ 
      name: name.trim(),
      _id: { $ne: req.params.id }
    });
    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name already exists',
        error: 'DUPLICATE_CATEGORY',
      });
    }

    // Update category
    category.name = name.trim();
    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: 'SERVER_ERROR',
    });
  }
};

// Delete category
// DELETE /api/categories/:id
export async function deleteCategory(req, res) {
  try {
    // Check if category exists
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        error: 'NOT_FOUND',
      });
    }

    // Check if any products use this category
    const Product = (await import('../models/Product.js')).default;
    const productsWithCategory = await Product.findOne({ category: category.name });
    
    if (productsWithCategory) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category. Products are associated with this category',
        error: 'CATEGORY_IN_USE',
      });
    }

    // Delete category
    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: 'SERVER_ERROR',
    });
  }
};


