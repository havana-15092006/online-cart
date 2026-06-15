/**
 * Cart Sidebar Controller and Synchronization for SharedCart
 */

document.addEventListener('DOMContentLoaded', () => {
  const storage = window.SharedCartStorage;
  
  // Elements
  const cartSidebar = document.getElementById('cartSidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  const cartSidebarToggleBtn = document.getElementById('cartSidebarToggleBtn');
  const cartSidebarCloseBtn = document.getElementById('cartSidebarCloseBtn');

  if (!cartSidebar) return; // Exit if not in room.html

  // --- Sidebar Toggle Actions ---
  function openCartSidebar() {
    cartSidebar.classList.add('open');
    sidebarBackdrop.classList.add('show');
  }

  function closeCartSidebar() {
    cartSidebar.classList.remove('open');
    sidebarBackdrop.classList.remove('show');
  }

  if (cartSidebarToggleBtn) cartSidebarToggleBtn.addEventListener('click', openCartSidebar);
  if (cartSidebarCloseBtn) cartSidebarCloseBtn.addEventListener('click', closeCartSidebar);
  if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeCartSidebar);

  // Initialize Cart rendering
  initCart(storage);
});

function initCart(storage) {
  const roomCode = storage.getActiveRoomCode();
  if (!roomCode) return;

  // Render initial cart state
  renderCart(storage, roomCode);

  // Cross-tab real-time update sync
  window.addEventListener('storage', (e) => {
    // If the cart or room changed, redraw the cart UI
    renderCart(storage, roomCode);
    
    // Show real-time sync notification
    if (e.key === storage.STORAGE_KEYS.CARTS) {
      showToast('Cart Synced', 'The shared cart was updated by a room member.', 'info');
    }
  });
}

function renderCart(storage, roomCode) {
  const cartItemsList = document.getElementById('cartItemsList');
  const cartBadgeCount = document.getElementById('cartBadgeCount');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const cartTax = document.getElementById('cartTax');
  const cartGrandTotal = document.getElementById('cartGrandTotal');

  if (!cartItemsList) return;

  const items = storage.getCart(roomCode);
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

  // Update Badge
  if (cartBadgeCount) cartBadgeCount.textContent = totalQty;

  if (items.length === 0) {
    cartItemsList.innerHTML = `
      <div class="text-center py-5 text-muted empty-cart-msg">
        <i class="bi bi-cart-x display-3 text-light-subtle d-block mb-3"></i>
        <h6 class="fw-bold">🛒 Your shared cart is waiting for items</h6>
        <p class="small text-muted">Add some items from the catalog to begin.</p>
      </div>
    `;
    if (cartSubtotal) cartSubtotal.textContent = '₹0.00';
    if (cartTax) cartTax.textContent = '₹0.00';
    if (cartGrandTotal) cartGrandTotal.textContent = '₹0.00';
    
    // Reset progress tracker and dashboard metrics
    updateProgressTracker(0);
    updateDashboardMetrics(0, 0, 0, 'None');
    return;
  }

  cartItemsList.innerHTML = '';
  let subtotal = 0;

  // Group items or list them
  items.forEach(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    // Retrieve active product to check current stock limits
    const product = window.SharedCartProducts ? window.SharedCartProducts.getProductById(item.productId) : null;
    const currentStock = product ? product.stock : 99; // fallback if product list not loaded

    const itemRow = document.createElement('div');
    itemRow.className = 'cart-item-row p-3 border-bottom border-light text-start d-flex justify-content-between align-items-start gap-2 animate-fade-in';
    itemRow.innerHTML = `
      <div class="flex-grow-1" style="min-width: 0;">
        <h6 class="fw-semibold text-dark mb-0.5 text-truncate" title="${item.name}">${item.name}</h6>
        <div class="d-flex align-items-center gap-2 mb-1.5">
          <span class="text-primary fw-bold">₹${item.price.toFixed(2)}</span>
          <span class="text-muted small">| Added by ${item.addedBy}</span>
        </div>
        
        <!-- Quantity Actions -->
        <div class="d-flex align-items-center gap-2">
          <div class="input-group input-group-sm" style="width: 100px;">
            <button class="btn btn-outline-secondary btn-qty-minus py-0 px-2.5 rounded-start-3" data-product-id="${item.productId}" aria-label="Decrease quantity">&minus;</button>
            <span class="form-control text-center py-0 fw-semibold bg-light" style="font-size: 0.85rem; line-height: 2.1;">${item.quantity}</span>
            <button class="btn btn-outline-secondary btn-qty-plus py-0 px-2.5 rounded-end-3" data-product-id="${item.productId}" data-stock="${currentStock}" aria-label="Increase quantity">&plus;</button>
          </div>
        </div>
      </div>
      <div class="d-flex flex-column align-items-end justify-content-between h-100" style="min-height: 60px;">
        <button class="btn btn-outline-light text-danger border-0 p-1 btn-cart-remove rounded-3" data-product-id="${item.productId}" title="Remove Item" aria-label="Remove ${item.name} from cart">
          <i class="bi bi-trash"></i>
        </button>
        <span class="fw-bold text-dark font-outfit">₹${itemTotal.toFixed(2)}</span>
      </div>
    `;

    cartItemsList.appendChild(itemRow);
  });

  // Calculations
  const tax = subtotal * 0.10;
  const grandTotal = subtotal + tax;

  if (cartSubtotal) cartSubtotal.textContent = `₹${subtotal.toFixed(2)}`;
  if (cartTax) cartTax.textContent = `₹${tax.toFixed(2)}`;
  if (cartGrandTotal) cartGrandTotal.textContent = `₹${grandTotal.toFixed(2)}`;

  // Update free delivery tracker
  updateProgressTracker(grandTotal);

  // Find Top Added product
  let topItemName = 'None';
  let maxQty = 0;
  items.forEach(i => {
    if (i.quantity > maxQty) {
      maxQty = i.quantity;
      topItemName = i.name;
    }
  });

  // Update dashboard metrics (statistics cards) if they exist
  updateDashboardMetrics(grandTotal, items.length, totalQty, topItemName);

  // Attach controls listeners
  attachCartControlListeners(storage, roomCode);
}

function updateProgressTracker(total) {
  const cartProgressPercent = document.getElementById('cartProgressPercent');
  const cartProgressBar = document.getElementById('cartProgressBar');
  const cartProgressStatus = document.getElementById('cartProgressStatus');

  if (!cartProgressBar) return;

  const target = 2000.00;
  
  if (total >= target) {
    if (cartProgressPercent) cartProgressPercent.textContent = '100%';
    cartProgressBar.style.width = '100%';
    cartProgressBar.setAttribute('aria-valuenow', '100');
    cartProgressBar.className = 'progress-bar bg-success progress-bar-striped progress-bar-animated';
    if (cartProgressStatus) cartProgressStatus.innerHTML = '<span class="text-success fw-bold">🎉 Free delivery threshold reached!</span>';
  } else {
    const percent = Math.round((total / target) * 100);
    const needed = target - total;
    if (cartProgressPercent) cartProgressPercent.textContent = `${percent}%`;
    cartProgressBar.style.width = `${percent}%`;
    cartProgressBar.setAttribute('aria-valuenow', percent.toString());
    cartProgressBar.className = 'progress-bar bg-primary progress-bar-striped progress-bar-animated';
    if (cartProgressStatus) cartProgressStatus.textContent = `₹${needed.toFixed(2)} more needed for free delivery`;
  }
}

function attachCartControlListeners(storage, roomCode) {
  const listEl = document.getElementById('cartItemsList');
  if (!listEl) return;

  const currentUser = storage.getCurrentUser();

  // Plus Buttons
  listEl.querySelectorAll('.btn-qty-plus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const productId = parseInt(e.target.getAttribute('data-product-id'));
      const stock = parseInt(e.target.getAttribute('data-stock'));
      
      const result = storage.updateQuantity(roomCode, productId, 1, currentUser.name, stock);
      if (result.success) {
        renderCart(storage, roomCode);
        showToast('Quantity Updated', 'Product count increased successfully.', 'success');
      } else {
        showToast('Stock Error', result.message, 'warning');
      }
    });
  });

  // Minus Buttons
  listEl.querySelectorAll('.btn-qty-minus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const productId = parseInt(e.target.getAttribute('data-product-id'));
      
      const result = storage.updateQuantity(roomCode, productId, -1, currentUser.name, 999);
      if (result.success) {
        renderCart(storage, roomCode);
        showToast('Quantity Updated', 'Product count adjusted.', 'success');
      }
    });
  });

  // Remove Buttons
  listEl.querySelectorAll('.btn-cart-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetBtn = e.target.closest('.btn-cart-remove');
      const productId = parseInt(targetBtn.getAttribute('data-product-id'));
      
      const result = storage.removeFromCart(roomCode, productId, currentUser.name);
      if (result.success) {
        renderCart(storage, roomCode);
        showToast('Item Removed', 'Product removed from the shared cart.', 'danger');
      }
    });
  });
}

// Add to Cart handler triggered from Catalog
function handleAddToCart(product) {
  const storage = window.SharedCartStorage;
  const roomCode = storage.getActiveRoomCode();
  const currentUser = storage.getCurrentUser();

  const result = storage.addToCart(roomCode, product, 1, currentUser.name);
  if (result.success) {
    renderCart(storage, roomCode);
    showToast('Product Added', `${product.name} added to the shared cart.`, 'success');
  } else {
    showToast('Add Failed', result.message, 'warning');
  }
}

// Toast Notifications Builder
function showToast(title, message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  let bgClass = 'bg-primary text-white';
  let iconClass = 'bi-check-circle-fill';

  if (type === 'success') {
    bgClass = 'bg-success text-white';
    iconClass = 'bi-check-circle-fill';
  } else if (type === 'danger') {
    bgClass = 'bg-danger text-white';
    iconClass = 'bi-trash-fill';
  } else if (type === 'warning') {
    bgClass = 'bg-warning text-dark';
    iconClass = 'bi-exclamation-triangle-fill';
  } else if (type === 'info') {
    bgClass = 'bg-info text-white';
    iconClass = 'bi-info-circle-fill';
  }

  const toastId = `toast-${Date.now()}`;
  const toastHtml = `
    <div id="${toastId}" class="toast align-items-center ${bgClass} border-0 shadow-lg rounded-3 mb-2" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="3000">
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi ${iconClass} fs-5"></i>
          <div>
            <strong class="d-block">${title}</strong>
            <span style="font-size: 0.85rem;">${message}</span>
          </div>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', toastHtml);
  
  const toastEl = document.getElementById(toastId);
  const bsToast = new bootstrap.Toast(toastEl);
  bsToast.show();

  // Remove toast element from DOM after hidden
  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
}

function updateDashboardMetrics(totalVal, distinctItems, sumQty, topItem) {
  const statTotalCost = document.getElementById('statTotalCost');
  const statTotalItems = document.getElementById('statTotalItems');
  const statTotalQty = document.getElementById('statTotalQty');
  const statTopItem = document.getElementById('statTopItem');

  if (statTotalCost) statTotalCost.textContent = `₹${totalVal.toFixed(2)}`;
  if (statTotalItems) statTotalItems.textContent = distinctItems;
  if (statTotalQty) statTotalQty.textContent = sumQty;
  if (statTopItem) {
    statTopItem.textContent = topItem;
    statTopItem.title = topItem;
  }
}

// Expose cart controller
window.SharedCartCart = {
  handleAddToCart,
  renderCart,
  showToast
};
