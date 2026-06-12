/**
 * LocalStorage Data Access Layer (DAL) for SharedCart
 */

const STORAGE_KEYS = {
  USERS: 'sharedcart_users',
  CURRENT_USER: 'sharedcart_currentUser',
  ROOMS: 'sharedcart_rooms',
  ACTIVE_ROOM: 'sharedcart_activeRoom',
  CARTS: 'sharedcart_carts',
  ACTIVITY_LOGS: 'sharedcart_activityLogs'
};

// --- Core Helper Functions ---
function getFromStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

function generateId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

// --- User Management ---
function getUsers() {
  return getFromStorage(STORAGE_KEYS.USERS, []);
}

function saveUsers(users) {
  saveToStorage(STORAGE_KEYS.USERS, users);
}

function registerUser(name, email, password) {
  const users = getUsers();
  
  // Format check
  if (!name || !email || !password) {
    return { success: false, message: 'All fields are required.' };
  }
  if (password.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, message: 'Invalid email format.' };
  }

  // Duplicate email check
  const duplicate = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (duplicate) {
    return { success: false, message: 'An account with this email already exists.' };
  }

  const newUser = {
    id: generateId('usr'),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: password // In real app, this would be hashed
  };

  users.push(newUser);
  saveUsers(users);

  return { success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email } };
}

function loginUser(email, password, remember = false) {
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password);
  
  if (!user) {
    return { success: false, message: 'Invalid email or password.' };
  }

  const sessionUser = { id: user.id, name: user.name, email: user.email };
  saveToStorage(STORAGE_KEYS.CURRENT_USER, sessionUser);
  return { success: true, user: sessionUser };
}

function getCurrentUser() {
  return getFromStorage(STORAGE_KEYS.CURRENT_USER, null);
}

function logoutUser() {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_ROOM);
}

// --- Room Management ---
function getRooms() {
  return getFromStorage(STORAGE_KEYS.ROOMS, []);
}

function saveRooms(rooms) {
  saveToStorage(STORAGE_KEYS.ROOMS, rooms);
}

function createRoom(roomName) {
  const currentUser = getCurrentUser();
  if (!currentUser) return { success: false, message: 'User not authenticated' };

  const rooms = getRooms();
  const roomNameClean = roomName.trim();
  if (!roomNameClean) return { success: false, message: 'Room name cannot be empty' };

  // Generate unique code like GROCERY-2931
  let code;
  let codeExists = true;
  while (codeExists) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    code = `${roomNameClean.split(' ')[0].toUpperCase()}-${randomNum}`;
    codeExists = !!rooms.find(r => r.code === code);
  }

  const newRoom = {
    code: code,
    name: roomNameClean,
    createdBy: currentUser.id,
    createdAt: new Date().toISOString(),
    members: [{ id: currentUser.id, name: currentUser.name, lastActive: new Date().toISOString() }]
  };

  rooms.push(newRoom);
  saveRooms(rooms);

  // Initialize empty cart & activity logs for the room
  saveCart(code, []);
  logActivity(code, currentUser.name, `created the room`);

  return { success: true, room: newRoom };
}

function joinRoom(roomCode) {
  const currentUser = getCurrentUser();
  if (!currentUser) return { success: false, message: 'User not authenticated' };

  const rooms = getRooms();
  const codeClean = roomCode.trim().toUpperCase();
  const roomIndex = rooms.findIndex(r => r.code === codeClean);

  if (roomIndex === -1) {
    return { success: false, message: 'Room not found. Please check the room code.' };
  }

  const room = rooms[roomIndex];
  
  // Check if member already in room list
  const memberIndex = room.members.findIndex(m => m.id === currentUser.id);
  if (memberIndex === -1) {
    room.members.push({ id: currentUser.id, name: currentUser.name, lastActive: new Date().toISOString() });
    rooms[roomIndex] = room;
    saveRooms(rooms);
    logActivity(codeClean, currentUser.name, `joined the room`);
  } else {
    // Just update timestamp
    room.members[memberIndex].lastActive = new Date().toISOString();
    rooms[roomIndex] = room;
    saveRooms(rooms);
  }

  saveToStorage(STORAGE_KEYS.ACTIVE_ROOM, codeClean);
  return { success: true, room: room };
}

function updateMemberPresence(roomCode, userId) {
  const rooms = getRooms();
  const roomIndex = rooms.findIndex(r => r.code === roomCode);
  if (roomIndex > -1) {
    const room = rooms[roomIndex];
    const memberIndex = room.members.findIndex(m => m.id === userId);
    if (memberIndex > -1) {
      room.members[memberIndex].lastActive = new Date().toISOString();
      rooms[roomIndex] = room;
      saveRooms(rooms);
      // Dispatch event for tab sync
      window.dispatchEvent(new Event('storage'));
    }
  }
}

function getRoomByCode(code) {
  const rooms = getRooms();
  return rooms.find(r => r.code === code.trim().toUpperCase()) || null;
}

function getActiveRoomCode() {
  return getFromStorage(STORAGE_KEYS.ACTIVE_ROOM, null);
}

function setActiveRoomCode(code) {
  saveToStorage(STORAGE_KEYS.ACTIVE_ROOM, code);
}

function getRoomsForUser(userId) {
  const rooms = getRooms();
  return rooms.filter(room => room.members.some(m => m.id === userId));
}

// --- Cart Management ---
function getCartsMap() {
  return getFromStorage(STORAGE_KEYS.CARTS, {});
}

function getCart(roomCode) {
  const carts = getCartsMap();
  return carts[roomCode] || [];
}

function saveCart(roomCode, items) {
  const carts = getCartsMap();
  carts[roomCode] = items;
  saveToStorage(STORAGE_KEYS.CARTS, carts);
  // Dispatch a storage event manually for same-page updates (or storage event takes care of other windows)
  window.dispatchEvent(new Event('storage'));
}

function addToCart(roomCode, product, quantity = 1, userName) {
  const cartItems = getCart(roomCode);
  const existingItemIndex = cartItems.findIndex(item => item.productId === product.id);

  // Check if product is in stock
  if (product.stock <= 0) {
    return { success: false, message: `${product.name} is currently out of stock.` };
  }

  let finalQuantity = quantity;
  if (existingItemIndex > -1) {
    const newQty = cartItems[existingItemIndex].quantity + quantity;
    if (newQty > product.stock) {
      return { success: false, message: `Only ${product.stock} units of ${product.name} are in stock.` };
    }
    cartItems[existingItemIndex].quantity = newQty;
    finalQuantity = newQty;
  } else {
    if (quantity > product.stock) {
      return { success: false, message: `Only ${product.stock} units of ${product.name} are in stock.` };
    }
    cartItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      quantity: quantity,
      addedBy: userName
    });
  }

  saveCart(roomCode, cartItems);
  logActivity(roomCode, userName, `added ${product.name} (Qty: ${quantity})`);
  return { success: true, cart: cartItems };
}

function updateQuantity(roomCode, productId, delta, userName, productStock) {
  const cartItems = getCart(roomCode);
  const index = cartItems.findIndex(item => item.productId === productId);

  if (index === -1) return { success: false, message: 'Item not found in cart.' };

  const currentItem = cartItems[index];
  const newQty = currentItem.quantity + delta;

  if (newQty <= 0) {
    return removeFromCart(roomCode, productId, userName);
  }

  if (newQty > productStock) {
    return { success: false, message: `Only ${productStock} units of ${currentItem.name} are in stock.` };
  }

  currentItem.quantity = newQty;
  saveCart(roomCode, cartItems);
  
  const actionText = delta > 0 ? 'increased' : 'decreased';
  logActivity(roomCode, userName, `${actionText} quantity of ${currentItem.name} to ${newQty}`);
  return { success: true, cart: cartItems };
}

function removeFromCart(roomCode, productId, userName) {
  const cartItems = getCart(roomCode);
  const index = cartItems.findIndex(item => item.productId === productId);

  if (index === -1) return { success: false, message: 'Item not found in cart.' };

  const item = cartItems[index];
  cartItems.splice(index, 1);
  
  saveCart(roomCode, cartItems);
  logActivity(roomCode, userName, `removed ${item.name} from the cart`);
  return { success: true, cart: cartItems };
}

// --- Activity Logs ---
function getLogsMap() {
  return getFromStorage(STORAGE_KEYS.ACTIVITY_LOGS, {});
}

function getLogs(roomCode) {
  const logs = getLogsMap();
  return logs[roomCode] || [];
}

function logActivity(roomCode, userName, action) {
  const logsMap = getLogsMap();
  const roomLogs = logsMap[roomCode] || [];
  
  const newLog = {
    id: generateId('log'),
    user: userName,
    action: action,
    timestamp: new Date().toISOString()
  };

  roomLogs.unshift(newLog); // Keep latest logs at the top
  logsMap[roomCode] = roomLogs;
  saveToStorage(STORAGE_KEYS.ACTIVITY_LOGS, logsMap);
  window.dispatchEvent(new Event('storage'));
}

// --- Dark Mode Theme Helper ---
function initTheme() {
  const savedTheme = localStorage.getItem('sharedcart_theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }
  updateThemeIcons();
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('sharedcart_theme', isDark ? 'dark' : 'light');
  updateThemeIcons();
}

function updateThemeIcons() {
  const toggleButtons = document.querySelectorAll('#darkModeToggle');
  const isDark = document.body.classList.contains('dark-mode');
  toggleButtons.forEach(btn => {
    const icon = btn.querySelector('i');
    if (icon) {
      if (isDark) {
        icon.className = 'bi bi-sun-fill';
        btn.classList.add('text-warning');
        btn.classList.remove('text-secondary');
      } else {
        icon.className = 'bi bi-moon-fill';
        btn.classList.add('text-secondary');
        btn.classList.remove('text-warning');
      }
    }
  });
}

// Automatically init theme on load
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  const toggleButtons = document.querySelectorAll('#darkModeToggle');
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });
});

// Expose functions globally for modular script use
window.SharedCartStorage = {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  createRoom,
  joinRoom,
  getRoomByCode,
  getActiveRoomCode,
  setActiveRoomCode,
  getRoomsForUser,
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  getLogs,
  logActivity,
  updateMemberPresence,
  STORAGE_KEYS
};

