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

const CategoryManagement = () => {
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoryName, setCategoryName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Load categories from API when component loads
  useEffect(() => {
    loadCategories()
  }, [searchTerm])

  // Function to load categories from API
  async function loadCategories() {
    try {
      setIsLoading(true)
      
      // Build URL with search parameter
      let url = `${API_URL}/categories?page=1&limit=100`
      if (searchTerm) {
        url += `&search=${searchTerm}`
      }
      
      const response = await axios.get(url, { headers: getHeaders() })
      
      if (response.data.success) {
        setCategories(response.data.data.categories)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      alert('Failed to load categories')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingCategory(null)
    setCategoryName('')
    setIsModalOpen(true)
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setCategoryName(category.name)
    setIsModalOpen(true)
  }

  // Save category - create or update
  async function handleSave() {
    if (!categoryName.trim()) {
      alert('Please enter a category name')
      return
    }

    try {
      if (editingCategory) {
        // Update existing category - call API
        const response = await axios.put(
          `${API_URL}/categories/${editingCategory._id}`,
          { name: categoryName },
          { headers: getHeaders() }
        )
        
        if (response.data.success) {
          // Reload categories from API
          loadCategories()
          setIsModalOpen(false)
          setCategoryName('')
          setEditingCategory(null)
        } else {
          alert(response.data.message || 'Failed to update category')
        }
      } else {
        // Create new category - call API
        const response = await axios.post(
          `${API_URL}/categories`,
          { name: categoryName },
          { headers: getHeaders() }
        )
        
        if (response.data.success) {
          // Reload categories from API
          loadCategories()
          setIsModalOpen(false)
          setCategoryName('')
        } else {
          alert(response.data.message || 'Failed to create category')
        }
      }
    } catch (error) {
      console.error('Error saving category:', error)
      const message = error.response?.data?.message || 'Failed to save category'
      alert(message)
    }
  }

  // Delete category - call API
  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return
    }

    try {
      const response = await axios.delete(`${API_URL}/categories/${id}`, {
        headers: getHeaders(),
      })
      
      if (response.data.success) {
        // Reload categories from API
        loadCategories()
      } else {
        alert(response.data.message || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      const message = error.response?.data?.message || 'Failed to delete category'
      alert(message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleAdd}
          className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          + Add Category
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category Name
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                  Loading categories...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                  No categories found
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {category._id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {category.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category._id)}
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

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h2>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Category name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setCategoryName('')
                  setEditingCategory(null)
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

export default CategoryManagement


