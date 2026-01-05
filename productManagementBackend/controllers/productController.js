import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { v2 as cloudinary } from 'cloudinary';
import formidable from 'formidable';

// Helper function to parse form data with files
async function parseFormData(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ fields, files });
    });
  });
}

// Helper function to upload file to Cloudinary
async function uploadFileToCloudinary(filePath) {
  try {
    const uploadOptions = {
      folder: 'product-management',
      transformation: [{ width: 800, height: 800, crop: 'limit' }],
    };
    
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading file to Cloudinary:', error);
    console.error('Error details:', {
      message: error.message,
      http_code: error.http_code,
      name: error.name
    });
    
    // More helpful error message
    if (error.http_code === 401) {
      throw new Error('Cloudinary authentication failed. Please check your CLOUDINARY_URL or credentials in .env file');
    }
    
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

// Helper function to upload image from URL to Cloudinary (for backward compatibility)
async function uploadImageFromUrl(imageUrl) {
  try {
    const uploadOptions = {
      folder: 'product-management',
      transformation: [{ width: 800, height: 800, crop: 'limit' }],
    };
    const result = await cloudinary.uploader.upload(imageUrl, uploadOptions);
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading image from URL:', error);
    throw new Error('Failed to upload image');
  }
}

// Helper function to delete image from Cloudinary
async function deleteImage(imageUrl) {
  try {
    // Extract public_id from URL
    const urlParts = imageUrl.split('/');
    const lastTwoParts = urlParts.slice(-2).join('/');
    const publicId = lastTwoParts.split('.')[0];
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image:', error);
  }
}

// Get all products
// GET /api/products
export async function getProducts(req, res) {
  try {
    const { search, category, sortBy = 'name', sortOrder = 'asc', page = 1, limit = 5 } = req.query;
    
    // Build query
    const query = {};
    
    if (search) {
      query.name = { $regex: search, $options: 'i' }; // Case-insensitive search
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get products
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const totalItems = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum);

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems,
          itemsPerPage: limitNum,
        },
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: 'SERVER_ERROR',
    });
  }
};

// Get single product
// GET /api/products/:id
export async function getProduct(req, res) {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: 'NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: 'SERVER_ERROR',
    });
  }
};

// Create product
// POST /api/products
export async function createProduct(req, res) {
  try {
    // Parse form data (handles both JSON and multipart/form-data)
    let fields = req.body;
    let files = {};
    
    // If it's multipart/form-data, parse it
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      const parsed = await parseFormData(req);
      fields = parsed.fields;
      files = parsed.files;
    }

    const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
    const price = Array.isArray(fields.price) ? fields.price[0] : fields.price;
    const category = Array.isArray(fields.category) ? fields.category[0] : fields.category;
    const stock = Array.isArray(fields.stock) ? fields.stock[0] : fields.stock;

    // Validation
    const errors = {};
    if (!name || name.trim().length < 2) {
      errors.name = 'Product name is required and must be at least 2 characters';
    }
    if (!price || price <= 0) {
      errors.price = 'Price must be greater than 0';
    }
    if (!category || category.trim().length === 0) {
      errors.category = 'Category is required';
    }
    if (stock === undefined || stock < 0) {
      errors.stock = 'Stock must be 0 or greater';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    // Check if category exists
    const categoryExists = await Category.findOne({ name: category.trim() });
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Category does not exist',
        errors: {
          category: 'Invalid category',
        },
      });
    }

    // Process uploaded files - upload to Cloudinary
    let processedImages = [];
    
    // Handle file uploads
    if (files.images) {
      const fileArray = Array.isArray(files.images) ? files.images : [files.images];
      
      for (const file of fileArray) {
        try {
          // Check if it's an image
          if (file.mimetype && file.mimetype.startsWith('image/')) {
            const cloudinaryUrl = await uploadFileToCloudinary(file.filepath);
            processedImages.push(cloudinaryUrl);
          }
        } catch (error) {
          console.error('Error uploading file:', error);
          // Continue with other files even if one fails
        }
      }
    }
    
    // Also handle existing image URLs (from existingImages field)
    const existingImages = Array.isArray(fields.existingImages) ? fields.existingImages[0] : fields.existingImages;
    if (existingImages) {
      try {
        const existingUrls = JSON.parse(existingImages);
        if (Array.isArray(existingUrls)) {
          existingUrls.forEach(url => {
            if (url && url.includes('cloudinary.com')) {
              processedImages.push(url);
            }
          });
        }
      } catch (error) {
        console.error('Error parsing existing images:', error);
      }
    }

    // Create product
    const product = await Product.create({
      name: name.trim(),
      price: parseFloat(price),
      category: category.trim(),
      stock: parseInt(stock),
      images: processedImages,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: 'SERVER_ERROR',
    });
  }
};

// Update product
// PUT /api/products/:id
export async function updateProduct(req, res) {
  try {
    // Check if product exists
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: 'NOT_FOUND',
      });
    }

    // Parse form data (handles both JSON and multipart/form-data)
    let fields = req.body;
    let files = {};
    
    // If it's multipart/form-data, parse it
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      const parsed = await parseFormData(req);
      fields = parsed.fields;
      files = parsed.files;
    }

    const name = fields.name ? (Array.isArray(fields.name) ? fields.name[0] : fields.name) : undefined;
    const price = fields.price ? (Array.isArray(fields.price) ? fields.price[0] : fields.price) : undefined;
    const category = fields.category ? (Array.isArray(fields.category) ? fields.category[0] : fields.category) : undefined;
    const stock = fields.stock ? (Array.isArray(fields.stock) ? fields.stock[0] : fields.stock) : undefined;

    // Validation
    const errors = {};
    if (name !== undefined && name.trim().length < 2) {
      errors.name = 'Product name must be at least 2 characters';
    }
    if (price !== undefined && price <= 0) {
      errors.price = 'Price must be greater than 0';
    }
    if (category !== undefined && category.trim().length === 0) {
      errors.category = 'Category is required';
    }
    if (stock !== undefined && stock < 0) {
      errors.stock = 'Stock must be 0 or greater';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    // Check if category exists (if category is being updated)
    if (category) {
      const categoryExists = await Category.findOne({ name: category.trim() });
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Category does not exist',
          errors: {
            category: 'Invalid category',
          },
        });
      }
    }

    // Process images - handle file uploads first, then existing URLs
    let processedImages = [];
    
    // Handle new file uploads
    if (files.images) {
      console.log('📤 New files detected:', files.images);
      const fileArray = Array.isArray(files.images) ? files.images : [files.images];
      
      for (const file of fileArray) {
        try {
          // Check if it's an image
          if (file.mimetype && file.mimetype.startsWith('image/')) {
            console.log('⬆️  Uploading file to Cloudinary:', file.originalFilename);
            const cloudinaryUrl = await uploadFileToCloudinary(file.filepath);
            console.log('✅ Uploaded successfully:', cloudinaryUrl);
            processedImages.push(cloudinaryUrl);
          }
        } catch (error) {
          console.error('❌ Error uploading file:', error);
          // Continue with other files even if one fails
        }
      }
    }
    
    // Handle existing image URLs (when editing and keeping old images)
    const existingImages = fields.existingImages ? (Array.isArray(fields.existingImages) ? fields.existingImages[0] : fields.existingImages) : undefined;
    if (existingImages) {
      console.log('🖼️  Existing images detected:', existingImages);
      try {
        const existingUrls = JSON.parse(existingImages);
        if (Array.isArray(existingUrls)) {
          existingUrls.forEach(url => {
            if (url && url.includes('cloudinary.com')) {
              processedImages.push(url);
            }
          });
        }
        console.log('✅ Added existing images:', existingUrls.length);
      } catch (error) {
        console.error('❌ Error parsing existing images:', error);
      }
    }
    
    // If no new files and no existing images specified, keep old images
    if (processedImages.length === 0 && !files.images && !existingImages) {
      console.log('📋 No new images, keeping existing:', product.images.length, 'images');
      processedImages = product.images;
    }
    
    console.log('📦 Final processed images count:', processedImages.length);
    
    // Also handle images array from JSON body (for backward compatibility)
    // Only process if not using FormData (multipart/form-data)
    if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
      if (req.body.images && Array.isArray(req.body.images) && req.body.images.length > 0) {
        processedImages = [];
        
        for (const imageUrl of req.body.images) {
          if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
            try {
              // If it's already a Cloudinary URL, use it directly
              if (imageUrl.includes('cloudinary.com')) {
                processedImages.push(imageUrl);
              } else if (imageUrl.includes('http')) {
                // If it's a regular URL, upload it to Cloudinary
                const cloudinaryUrl = await uploadImageFromUrl(imageUrl);
                processedImages.push(cloudinaryUrl);
              }
            } catch (error) {
              console.error('Error processing image URL:', error);
              // Continue with other images even if one fails
            }
          }
        }
      }
    }

    // Update product
    if (name !== undefined) product.name = name.trim();
    if (price !== undefined) product.price = parseFloat(price);
    if (category !== undefined) product.category = category.trim();
    if (stock !== undefined) product.stock = parseInt(stock);
    
    // Update images if:
    // 1. New files were uploaded, OR
    // 2. Existing images were sent, OR  
    // 3. Images array was provided in JSON body, OR
    // 4. No images sent but we kept old ones (processedImages = product.images)
    if (files.images || existingImages || (req.body.images && Array.isArray(req.body.images)) || processedImages.length > 0) {
      product.images = processedImages;
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: 'SERVER_ERROR',
    });
  }
};

// Delete product
// DELETE /api/products/:id
export async function deleteProduct(req, res) {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: 'NOT_FOUND',
      });
    }

    // Delete images from Cloudinary
    for (const imageUrl of product.images) {
      try {
        await deleteImage(imageUrl);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    // Delete product
    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: 'SERVER_ERROR',
    });
  }
};


