# Product Management Dashboard

A beginner-friendly React application for managing products and categories with a clean, modern UI built with Tailwind CSS.

## Features

### Category Management
- ✅ Create new categories
- ✅ View all categories in a table
- ✅ Edit existing categories
- ✅ Delete categories
- ✅ Search categories

### Product Management
- ✅ Create new products with name, price, category, and stock
- ✅ View all products in a table
- ✅ Edit existing products
- ✅ Delete products
- ✅ Search products by name
- ✅ Filter products by category
- ✅ Sort products by name, price, or stock (ascending/descending)
- ✅ Pagination (5 products per page)

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd "product managementfrontend"
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit `http://localhost:5173`

## Project Structure

```
productManagementfrontend/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx              # Navigation sidebar
│   │   ├── CategoryManagement.jsx   # Category CRUD operations
│   │   └── ProductManagement.jsx    # Product CRUD with filters, sort, pagination
│   ├── App.jsx                      # Main app component
│   ├── main.jsx                     # Entry point
│   └── index.css                    # Tailwind CSS imports
├── package.json
├── tailwind.config.js               # Tailwind configuration
└── postcss.config.js                # PostCSS configuration
```

## How to Use

### Category Management
1. Click on "Category Management" in the sidebar
2. Click "+ Add Category" to create a new category
3. Click "Edit" to modify an existing category
4. Click "Delete" to remove a category

### Product Management
1. Click on "Product Management" in the sidebar
2. Use the search bar to find products by name
3. Use the category dropdown to filter by category
4. Use the sort dropdown to sort products
5. Click column headers to sort by that column
6. Use pagination controls at the bottom to navigate through pages
7. Click "+ Add Product" to create a new product
8. Click "Edit" to modify an existing product
9. Click "Delete" to remove a product

## Technologies Used

- **React** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **JavaScript** - Programming language

## Learning Resources

This project is designed to be beginner-friendly. Here are some concepts you'll learn:

- React Hooks (useState, useEffect)
- Component composition
- Event handling
- Form management
- Array methods (map, filter, sort)
- Conditional rendering
- Modal dialogs
- Pagination logic
- Filtering and sorting

## Customization

You can easily customize:
- Colors: Modify Tailwind classes (e.g., `bg-blue-600` to `bg-green-600`)
- Items per page: Change `itemsPerPage` in `ProductManagement.jsx`
- Table columns: Add or remove columns in the table headers and rows
- Styling: All styles use Tailwind CSS utility classes

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## License

This project is open source and available for learning purposes.
