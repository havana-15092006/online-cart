/**
 * Products Catalog Controller for SharedCart
 */

// Fallback products database in case of CORS errors when running via file:// protocol
const FALLBACK_PRODUCTS = [
  {
    "id": 1,
    "name": "Organic Jasmine Rice",
    "description": "Premium quality, long-grain fragrant jasmine rice, perfect for standard meals.",
    "category": "Grocery",
    "price": 12.99,
    "stock": 15,
    "image": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    "rating": 4.7
  },
  {
    "id": 2,
    "name": "Fresh Whole Milk",
    "description": "Rich in calcium, pasteurized whole milk from local dairy farms. 1 Gallon.",
    "category": "Grocery",
    "price": 3.49,
    "stock": 25,
    "image": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    "rating": 4.5
  },
  {
    "id": 3,
    "name": "Artisanal Sourdough Bread",
    "description": "Freshly baked sourdough bread with a crispy crust and soft, airy interior.",
    "category": "Grocery",
    "price": 4.99,
    "stock": 10,
    "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    "rating": 4.8
  },
  {
    "id": 4,
    "name": "Free-Range Large Eggs",
    "description": "One dozen farm-fresh, free-range brown eggs rich in protein.",
    "category": "Grocery",
    "price": 3.99,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    "rating": 4.6
  },
  {
    "id": 5,
    "name": "Fresh Organic Bananas",
    "description": "A bunch of sweet, ripe organic bananas, loaded with potassium.",
    "category": "Grocery",
    "price": 1.99,
    "stock": 40,
    "image": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    "rating": 4.9
  },
  {
    "id": 6,
    "name": "Ultra-Slim Pro Laptop",
    "description": "Powerful 14-inch laptop with 16GB RAM, 512GB SSD, and high-res display for professionals.",
    "category": "Electronics",
    "price": 899.99,
    "stock": 5,
    "image": "https://images.unsplash.com/photo-1496181130204-755241524eab?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    "rating": 4.9
  },
  {
    "id": 7,
    "name": "Wireless Noise-Cancelling Headphones",
    "description": "Over-ear active noise-cancelling headphones with 40-hour battery life and deep bass.",
    "category": "Electronics",
    "price": 149.99,
    "stock": 12,
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    "rating": 4.7
  },
  {
    "id": 8,
    "name": "Ergonomic Silent Mouse",
    "description": "Comfortable wireless mouse with silent click buttons and adjustable DPI settings.",
    "category": "Electronics",
    "price": 29.99,
    "stock": 20,
    "image": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    "rating": 4.4
  },
  {
    "id": 9,
    "name": "Mechanical RGB Keyboard",
    "description": "Tactile blue switch mechanical keyboard with customisable RGB backlit profiles.",
    "category": "Electronics",
    "price": 79.99,
    "stock": 8,
    "image": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    "rating": 4.6
  },
  {
    "id": 10,
    "name": "Eco-Friendly Laundry Detergent",
    "description": "Plant-based, biodegradable liquid laundry detergent, tough on stains but gentle on skin.",
    "category": "Home Essentials",
    "price": 14.49,
    "stock": 18,
    "image": "https://images.unsplash.com/photo-1610557892470-76d74ae12289?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    "rating": 4.5
  },
  {
    "id": 11,
    "name": "Multi-Surface Cleaning Spray",
    "description": "All-purpose lavender-scented cleaning spray that cuts through grease and grime.",
    "category": "Home Essentials",
    "price": 5.99,
    "stock": 25,
    "image": "https://images.unsplash.com/photo-1585421514738-ee1a3b2e5fe2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    "rating": 4.3
  },
  {
    "id": 12,
    "name": "Luxury Cotton Bath Towels",
    "description": "Set of 2 ultra-absorbent, quick-dry Egyptian cotton towels in neutral grey.",
    "category": "Home Essentials",
    "price": 24.99,
    "stock": 14,
    "image": "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    "rating": 4.8
  },
  {
    "id": 13,
    "name": "Crispy Sea Salt Potato Chips",
    "description": "Kettle-cooked potato chips seasoned with natural sea salt. Extra crunchy.",
    "category": "Snacks",
    "price": 2.99,
    "stock": 50,
    "image": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    "rating": 4.6
  },
  {
    "id": 14,
    "name": "Dark Chocolate Sea Salt Bar",
    "description": "70% cocoa organic dark chocolate bar with a hint of fleur de sel.",
    "category": "Snacks",
    "price": 3.99,
    "stock": 0,
    "image": "https://images.unsplash.com/photo-1549007994-cb92ca818bc6?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    "rating": 4.9
  },
  {
    "id": 15,
    "name": "Belgian Choco-Chip Biscuits",
    "description": "Crisp cookies loaded with premium Belgian chocolate chips. 200g pack.",
    "category": "Snacks",
    "price": 4.49,
    "stock": 22,
    "image": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    "rating": 4.7
  }
];

let productsDatabase = [];
let activeFilters = {
  category: 'All',
  searchQuery: '',
  maxPrice: 1000,
  inStockOnly: false,
  sortBy: 'rating'
};

document.addEventListener('DOMContentLoaded', () => {
  const productsCatalogGrid = document.getElementById('productsCatalogGrid');
  
  if (productsCatalogGrid) {
    loadProducts();
  }
});

async function loadProducts() {
  try {
    const response = await fetch('data/products.json');
    if (!response.ok) throw new Error('Network response not ok');
    productsDatabase = await response.json();
  } catch (error) {
    console.warn('CORS or file access error, falling back to local dataset.', error);
    productsDatabase = FALLBACK_PRODUCTS;
  }
  
  // Set initial filter actions
  setupFilterListeners();
  
  // Initial render
  filterAndRenderProducts();
}

function setupFilterListeners() {
  // Category tab clicks
  const categoryButtons = document.querySelectorAll('#categoryFilterContainer .btn-category');
  categoryButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      categoryButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      activeFilters.category = e.target.getAttribute('data-category');
      filterAndRenderProducts();
    });
  });

  // Search inputs (Header search & Mobile search)
  const headerSearchInput = document.getElementById('headerSearchInput');
  const mobileSearchInput = document.getElementById('mobileSearchInput');

  const handleSearch = (e) => {
    activeFilters.searchQuery = e.target.value.trim().toLowerCase();
    // Sync both inputs
    if (headerSearchInput && e.target !== headerSearchInput) headerSearchInput.value = e.target.value;
    if (mobileSearchInput && e.target !== mobileSearchInput) mobileSearchInput.value = e.target.value;
    filterAndRenderProducts();
  };

  if (headerSearchInput) headerSearchInput.addEventListener('input', handleSearch);
  if (mobileSearchInput) mobileSearchInput.addEventListener('input', handleSearch);

  // Price range slider
  const priceRangeSlider = document.getElementById('priceRangeSlider');
  const priceRangeLabel = document.getElementById('priceRangeLabel');
  if (priceRangeSlider) {
    priceRangeSlider.addEventListener('input', (e) => {
      if (priceRangeLabel) priceRangeLabel.textContent = `$${e.target.value}`;
      activeFilters.maxPrice = parseFloat(e.target.value);
    });
  }

  // Stock Filter
  const filterInStockCheckbox = document.getElementById('filterInStockCheckbox');
  if (filterInStockCheckbox) {
    filterInStockCheckbox.addEventListener('change', (e) => {
      activeFilters.inStockOnly = e.target.checked;
    });
  }

  // Apply filters button
  const applyFiltersButton = document.getElementById('applyFiltersButton');
  if (applyFiltersButton) {
    applyFiltersButton.addEventListener('click', () => {
      filterAndRenderProducts();
      
      // Close Bootstrap dropdown if possible
      const priceFilterDropdown = document.getElementById('priceFilterDropdown');
      if (priceFilterDropdown) {
        const dropdown = bootstrap.Dropdown.getInstance(priceFilterDropdown);
        if (dropdown) dropdown.hide();
      }
    });
  }

  // Sorting selection
  const catalogSortSelect = document.getElementById('catalogSortSelect');
  if (catalogSortSelect) {
    catalogSortSelect.addEventListener('change', (e) => {
      activeFilters.sortBy = e.target.value;
      filterAndRenderProducts();
    });
  }
}

function filterAndRenderProducts() {
  const productsCatalogGrid = document.getElementById('productsCatalogGrid');
  if (!productsCatalogGrid) return;

  // Filter logic
  let filtered = productsDatabase.filter(product => {
    // Category match
    if (activeFilters.category !== 'All' && product.category !== activeFilters.category) return false;
    
    // Search match
    if (activeFilters.searchQuery) {
      const matchName = product.name.toLowerCase().includes(activeFilters.searchQuery);
      const matchDesc = product.description.toLowerCase().includes(activeFilters.searchQuery);
      const matchCat = product.category.toLowerCase().includes(activeFilters.searchQuery);
      if (!matchName && !matchDesc && !matchCat) return false;
    }

    // Price match
    if (product.price > activeFilters.maxPrice) return false;

    // Availability match
    if (activeFilters.inStockOnly && product.stock <= 0) return false;

    return true;
  });

  // Sorting logic
  filtered.sort((a, b) => {
    switch (activeFilters.sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'rating':
      default:
        return b.rating - a.rating;
    }
  });

  // Render Grid
  productsCatalogGrid.innerHTML = '';

  if (filtered.length === 0) {
    productsCatalogGrid.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-search display-3 text-muted text-opacity-50 mb-3"></i>
        <h5 class="fw-bold text-muted">No products found</h5>
        <p class="text-muted">Try adjusting your filters or search keywords.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(product => {
    const cardCol = document.createElement('div');
    cardCol.className = 'col-sm-6 col-md-4 col-xl-3 animate-fade-in';

    // Stock label class
    let stockClass = 'bg-success bg-opacity-10 text-success';
    let stockText = 'In Stock';
    let isOutOfStock = false;

    if (product.stock === 0) {
      stockClass = 'bg-danger bg-opacity-10 text-danger';
      stockText = 'Out of Stock';
      isOutOfStock = true;
    } else if (product.stock <= 5) {
      stockClass = 'bg-warning bg-opacity-10 text-warning';
      stockText = `Low Stock (${product.stock} left)`;
    }

    // Check if item is already added to cart to render quantity indicator or simple buttons
    cardCol.innerHTML = `
      <div class="card h-100 border-0 shadow-sm rounded-4 product-card bg-white position-relative overflow-hidden">
        <!-- Stock Tag -->
        <span class="badge ${stockClass} position-absolute top-0 end-0 m-3 z-1 px-2.5 py-1.5 rounded-3 fw-semibold">${stockText}</span>
        
        <!-- Product Image -->
        <div class="product-image-wrap bg-light-section position-relative d-flex align-items-center justify-content-center overflow-hidden" style="height: 180px;">
          <img src="${product.image}" class="img-fluid object-fit-cover w-100 h-100 product-img-pic" alt="${product.name}" loading="lazy">
        </div>

        <!-- Card Body -->
        <div class="card-body p-3.5 d-flex flex-column text-start">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="text-muted small fw-medium">${product.category}</span>
            <div class="d-flex align-items-center text-warning gap-1">
              <i class="bi bi-star-fill text-warning" style="font-size: 0.85rem;"></i>
              <span class="text-dark small fw-bold">${product.rating}</span>
            </div>
          </div>
          <h5 class="fw-bold text-dark font-outfit mb-1.5 text-truncate-2" style="font-size: 1.05rem; line-height: 1.4;" title="${product.name}">${product.name}</h5>
          <p class="text-muted small text-truncate-3 mb-3" style="line-height: 1.5; font-size: 0.85rem;">${product.description}</p>
          
          <div class="d-flex justify-content-between align-items-center mt-auto pt-2 border-top border-light-subtle">
            <span class="fs-4 fw-bold text-primary">$${product.price.toFixed(2)}</span>
            <button class="btn btn-primary rounded-3 d-flex align-items-center justify-content-center btn-add-to-cart p-2.5 btn-hover-effect" 
                    data-product-id="${product.id}" 
                    ${isOutOfStock ? 'disabled' : ''} 
                    style="width: 42px; height: 42px;"
                    title="Add to Cart"
                    aria-label="Add ${product.name} to cart">
              <i class="bi bi-plus-lg fs-5"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    productsCatalogGrid.appendChild(cardCol);
  });

  // Attach Add to Cart event listeners
  const addButtons = productsCatalogGrid.querySelectorAll('.btn-add-to-cart');
  addButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const btnEl = e.target.closest('.btn-add-to-cart');
      const productId = parseInt(btnEl.getAttribute('data-product-id'));
      const product = productsDatabase.find(p => p.id === productId);
      if (product && window.SharedCartCart) {
        window.SharedCartCart.handleAddToCart(product);
      }
    });
  });
}

function getProductById(id) {
  return productsDatabase.find(p => p.id === id) || FALLBACK_PRODUCTS.find(p => p.id === id);
}

// Expose products database functions
window.SharedCartProducts = {
  productsDatabase,
  getProductById,
  filterAndRenderProducts
};
