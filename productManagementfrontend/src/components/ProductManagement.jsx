import { useState, useEffect } from 'react'
import axios from 'axios'

// Backend API URL
const API_URL = 'http://localhost:8000/api'

// Helper function to get headers with token
function getHeaders() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

const ProductManagement = () => {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    stock: '',
  })
  const [selectedImages, setSelectedImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 5

  // Load categories from API
  useEffect(() => {
    loadCategories()
  }, [])

  // Load products from API when filters change
  useEffect(() => {
    loadProducts()
  }, [searchTerm, selectedCategory, sortBy, sortOrder, currentPage])

  // Function to load categories from API
  async function loadCategories() {
    try {
      const response = await axios.get(`${API_URL}/categories?page=1&limit=100`, {
        headers: getHeaders(),
      })
      
      if (response.data.success) {
        setCategories(response.data.data.categories)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  // Function to load products from API
  async function loadProducts() {
    try {
      setIsLoading(true)
      
      // Build URL with filters
      let url = `${API_URL}/products?page=${currentPage}&limit=${itemsPerPage}&sortBy=${sortBy}&sortOrder=${sortOrder}`
      
      if (searchTerm) {
        url += `&search=${searchTerm}`
      }
      
      if (selectedCategory && selectedCategory !== 'all') {
        url += `&category=${selectedCategory}`
      }
      
      const response = await axios.get(url, {
        headers: getHeaders(),
      })
      
      if (response.data.success) {
        setProducts(response.data.data.products)
        setTotalPages(response.data.data.pagination.totalPages)
        setTotalItems(response.data.data.pagination.totalItems)
      }
    } catch (error) {
      console.error('Error loading products:', error)
      alert('Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategory, sortBy, sortOrder])

  const handleAdd = () => {
    setEditingProduct(null)
    setFormData({ name: '', price: '', category: '', stock: '' })
    setSelectedImages([])
    setImagePreviews([])
    setIsModalOpen(true)
  }

  function handleEdit(product) {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
    })
    // Set existing images as previews (URLs from Cloudinary)
    const productImages = product.images && product.images.length > 0 ? product.images : []
    setSelectedImages([]) // No new files selected
    // Format existing images for preview
    setImagePreviews(productImages.map(url => ({ type: 'url', data: url })))
    setIsModalOpen(true)
  }

  // Handle image file selection
  function handleImageChange(e) {
    const files = Array.from(e.target.files)
    
    // Validate file types
    const validFiles = files.filter(file => file.type.startsWith('image/'))
    if (validFiles.length !== files.length) {
      alert('Please select only image files')
    }
    
    // Add new files to selected images
    setSelectedImages(prev => [...prev, ...validFiles])
    
    // Create previews for new files
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, { type: 'file', data: e.target.result }])
      }
      reader.readAsDataURL(file)
    })
    
    // Reset input to allow selecting same file again
    e.target.value = ''
  }

  // Remove image (both file and preview)
  function handleRemoveImage(index) {
    // Check if it's a file or existing URL
    const preview = imagePreviews[index]
    if (preview && preview.type === 'file') {
      // It's a file - remove from both arrays
      const fileIndex = imagePreviews.slice(0, index).filter(p => p.type === 'file').length
      setSelectedImages(prev => prev.filter((_, i) => i !== fileIndex))
    }
    // Remove from previews (works for both files and URLs)
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  // Save product - create or update
  async function handleSave() {
    if (!formData.name.trim() || !formData.price || !formData.category || !formData.stock) {
      alert('Please fill in all fields')
      return
    }

    // Validate price
    const price = parseFloat(formData.price)
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price (greater than 0)')
      return
    }

    // Validate stock
    const stock = parseInt(formData.stock)
    if (isNaN(stock) || stock < 0) {
      alert('Please enter a valid stock quantity (0 or greater)')
      return
    }

    // Check if at least one image is selected (for new products)
    if (!editingProduct && selectedImages.length === 0) {
      alert('Please select at least one product image')
      return
    }

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('price', price.toString())
      formDataToSend.append('category', formData.category)
      formDataToSend.append('stock', stock.toString())
      
      // Append image files
      selectedImages.forEach((file) => {
        formDataToSend.append('images', file)
      })
      
      // If editing and keeping existing images, send them as URLs in body
      if (editingProduct) {
        const existingImageUrls = imagePreviews
          .filter(preview => preview.type === 'url')
          .map(preview => preview.data)
        
        if (existingImageUrls.length > 0) {
          // Send existing URLs as JSON array (backend will handle both files and URLs)
          formDataToSend.append('existingImages', JSON.stringify(existingImageUrls))
        }
      }

      // Get headers with token
      const token = localStorage.getItem('token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type - axios will set it automatically for FormData with boundary
      }

      if (editingProduct) {
        // Update existing product - call API
        const response = await axios.put(
          `${API_URL}/products/${editingProduct._id}`,
          formDataToSend,
          { headers }
        )
        
        if (response.data.success) {
          // Reload products from API
          loadProducts()
          setIsModalOpen(false)
          setFormData({ name: '', price: '', category: '', stock: '' })
          setSelectedImages([])
          setImagePreviews([])
          setEditingProduct(null)
        } else {
          alert(response.data.message || 'Failed to update product')
        }
      } else {
        // Create new product - call API
        const response = await axios.post(
          `${API_URL}/products`,
          formDataToSend,
          { headers }
        )
        
        if (response.data.success) {
          // Reload products from API
          loadProducts()
          setIsModalOpen(false)
          setFormData({ name: '', price: '', category: '', stock: '' })
          setSelectedImages([])
          setImagePreviews([])
        } else {
          alert(response.data.message || 'Failed to create product')
        }
      }
    } catch (error) {
      console.error('Error saving product:', error)
      const message = error.response?.data?.message || 'Failed to save product'
      alert(message)
    }
  }

  // Delete product - call API
  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      const response = await axios.delete(`${API_URL}/products/${id}`, {
        headers: getHeaders(),
      })
      
      if (response.data.success) {
        // Reload products from API
        loadProducts()
      } else {
        alert(response.data.message || 'Failed to delete product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      const message = error.response?.data?.message || 'Failed to delete product'
      alert(message)
    }
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="space-y-6">
      {/* Header with Search, Filter, Sort, and Add Button */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1 flex flex-col md:flex-row gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-')
              setSortBy(field)
              setSortOrder(order)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name-asc">Sort by Name (A-Z)</option>
            <option value="name-desc">Sort by Name (Z-A)</option>
            <option value="price-asc">Sort by Price (Low-High)</option>
            <option value="price-desc">Sort by Price (High-Low)</option>
            <option value="stock-asc">Sort by Stock (Low-High)</option>
            <option value="stock-desc">Sort by Stock (High-Low)</option>
          </select>
        </div>

        <button
          onClick={handleAdd}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          + Add Product
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort('id')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  ID {getSortIcon('id')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Name {getSortIcon('name')}
                </th>
                <th
                  onClick={() => handleSort('price')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Price {getSortIcon('price')}
                </th>
                <th
                  onClick={() => handleSort('category')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Category {getSortIcon('category')}
                </th>
                <th
                  onClick={() => handleSort('stock')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Stock {getSortIcon('stock')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product._id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        {product.images && product.images.length > 0 ? (
                          product.images.slice(0, 3).map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`${product.name} ${idx + 1}`}
                              className="w-16 h-16 object-cover rounded border border-gray-200"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/64?text=No+Image'
                              }}
                            />
                          ))
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-400">
                            No Image
                          </div>
                        )}
                        {product.images && product.images.length > 3 && (
                          <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-600">
                            +{product.images.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Rs {product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-4 py-3 rounded-lg shadow">
          <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of{' '}
            {totalItems} products
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 border rounded-lg ${
                        currentPage === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-2">...</span>
                }
                return null
              })}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Enter price"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="Enter stock quantity"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Images
                </label>
                <div className="space-y-4">
                  {/* File Input */}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Select one or more image files (JPG, PNG, etc.)
                    </p>
                  </div>
                  
                  {/* Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Selected Images:</p>
                      <div className="flex flex-wrap gap-2">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview.data}
                              alt={`Preview ${index + 1}`}
                              className="w-20 h-20 object-cover rounded border border-gray-300"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setFormData({ name: '', price: '', category: '', stock: '' })
                  setSelectedImages([])
                  setImagePreviews([])
                  setEditingProduct(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductManagement


