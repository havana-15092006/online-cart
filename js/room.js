/**
 * Room and Workspace Controller for SharedCart
 */

document.addEventListener('DOMContentLoaded', () => {
  const storage = window.SharedCartStorage;
  const currentUser = storage.getCurrentUser();

  if (!currentUser) {
    // If not authenticated, redirect to login
    if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('register.html') && !window.location.pathname.endsWith('index.html')) {
      window.location.href = 'login.html';
      return;
    }
  }

  // --- Common Actions: Profile and Navigation Dropdowns ---
  const userNameLabel = document.getElementById('userNameLabel');
  const userEmailLabel = document.getElementById('userEmailLabel');
  const avatarInitial = document.getElementById('avatarInitial');
  const logoutButton = document.getElementById('logoutButton');

  if (currentUser) {
    if (userNameLabel) userNameLabel.textContent = currentUser.name;
    if (userEmailLabel) userEmailLabel.textContent = currentUser.email;
    if (avatarInitial) avatarInitial.textContent = currentUser.name.charAt(0).toUpperCase();
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', (e) => {
      e.preventDefault();
      storage.logoutUser();
      window.location.href = 'index.html';
    });
  }

  // Check which page we are on
  const isDashboard = !!document.getElementById('createRoomForm') || !!document.getElementById('joinRoomForm');
  const isRoomWorkspace = !!document.getElementById('roomNameTitle');

  if (isDashboard) {
    initDashboard(storage, currentUser);
  } else if (isRoomWorkspace) {
    initRoomWorkspace(storage, currentUser);
  }
});

// --- Dashboard Initializer ---
function initDashboard(storage, currentUser) {
  const welcomeHeading = document.getElementById('welcomeHeading');
  if (welcomeHeading) {
    welcomeHeading.innerHTML = `Welcome back, <span class="text-primary">${currentUser.name}</span>!`;
  }

  const createRoomForm = document.getElementById('createRoomForm');
  const joinRoomForm = document.getElementById('joinRoomForm');
  const createAlert = document.getElementById('createAlert');
  const joinAlert = document.getElementById('joinAlert');

  // Load Rooms Grid
  renderUserRooms(storage, currentUser);

  // Create Room Submit
  if (createRoomForm) {
    createRoomForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (createAlert) createAlert.classList.add('d-none');

      const roomName = document.getElementById('roomNameInput').value;
      const result = storage.createRoom(roomName);

      if (result.success) {
        // Automatically enter room
        storage.setActiveRoomCode(result.room.code);
        window.location.href = `room.html?code=${result.room.code}`;
      } else {
        if (createAlert) {
          createAlert.textContent = result.message;
          createAlert.classList.remove('d-none');
        }
      }
    });
  }

  // Join Room Submit
  if (joinRoomForm) {
    joinRoomForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (joinAlert) joinAlert.classList.add('d-none');

      const roomCode = document.getElementById('roomCodeInput').value;
      const result = storage.joinRoom(roomCode);

      if (result.success) {
        window.location.href = `room.html?code=${result.room.code}`;
      } else {
        if (joinAlert) {
          joinAlert.textContent = result.message;
          joinAlert.classList.remove('d-none');
        }
      }
    });
  }

  // Handle storage synchronisation to refresh lists
  window.addEventListener('storage', () => {
    renderUserRooms(storage, currentUser);
  });
}

function renderUserRooms(storage, currentUser) {
  const roomsListGrid = document.getElementById('roomsListGrid');
  const emptyRoomsState = document.getElementById('emptyRoomsState');
  const totalRoomsCount = document.getElementById('totalRoomsCount');
  const roomSummaryBadge = document.getElementById('roomSummaryBadge');

  if (!roomsListGrid) return;

  const userRooms = storage.getRoomsForUser(currentUser.id);

  if (totalRoomsCount) totalRoomsCount.textContent = userRooms.length;
  if (roomSummaryBadge) roomSummaryBadge.textContent = `${userRooms.length} Room${userRooms.length === 1 ? '' : 's'} Joined`;

  if (userRooms.length === 0) {
    if (emptyRoomsState) emptyRoomsState.classList.remove('d-none');
    // Clear old elements but keep empty state
    const oldCards = roomsListGrid.querySelectorAll('.room-card-col');
    oldCards.forEach(card => card.remove());
    return;
  }

  if (emptyRoomsState) emptyRoomsState.classList.add('d-none');

  // Clear existing dynamically added cards
  const oldCards = roomsListGrid.querySelectorAll('.room-card-col');
  oldCards.forEach(card => card.remove());

  // Render cards
  userRooms.forEach(room => {
    const cardCol = document.createElement('div');
    cardCol.className = 'col-md-6 col-lg-4 room-card-col animate-fade-in';
    
    // Calculate total items and quantity for this room
    const cartItems = storage.getCart(room.code);
    const totalItems = cartItems.length;
    const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    cardCol.innerHTML = `
      <div class="card h-100 border-0 shadow-sm rounded-4 room-card p-4 bg-white btn-hover-effect">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <span class="badge bg-primary bg-opacity-10 text-primary font-monospace fs-6 px-3 py-2 rounded-3">${room.code}</span>
          <span class="text-muted small"><i class="bi bi-people me-1"></i> ${room.members.length}</span>
        </div>
        <h4 class="fw-bold font-outfit text-dark mb-2 text-truncate">${room.name}</h4>
        <div class="row text-center bg-light rounded-3 p-3 mb-4 g-2">
          <div class="col-6 border-end border-light-subtle">
            <span class="text-muted small d-block">Cart Items</span>
            <span class="fw-semibold text-dark fs-5">${totalItems}</span>
          </div>
          <div class="col-6">
            <span class="text-muted small d-block">Total Qty</span>
            <span class="fw-semibold text-dark fs-5">${totalQty}</span>
          </div>
        </div>
        <a href="room.html?code=${room.code}" class="btn btn-outline-primary w-100 py-2.5 rounded-3 fw-semibold mt-auto">
          Enter Cart Room <i class="bi bi-arrow-right ms-1"></i>
        </a>
      </div>
    `;
    roomsListGrid.appendChild(cardCol);
  });
}

// --- Room Workspace Initializer ---
let currentActiveRoomCode = null;

function initRoomWorkspace(storage, currentUser) {
  const urlParams = new URLSearchParams(window.location.search);
  const roomCode = urlParams.get('code');

  if (!roomCode) {
    alert('No room code provided. Redirecting to dashboard...');
    window.location.href = 'dashboard.html';
    return;
  }

  const room = storage.getRoomByCode(roomCode);
  if (!room) {
    alert('Invalid room code. Room not found. Redirecting to dashboard...');
    window.location.href = 'dashboard.html';
    return;
  }

  // User must have joined the room to work in it, if not, auto join
  const memberExists = room.members.find(m => m.id === currentUser.id);
  if (!memberExists) {
    storage.joinRoom(roomCode);
  }

  currentActiveRoomCode = roomCode.toUpperCase();
  storage.setActiveRoomCode(currentActiveRoomCode);

  // Setup Title Headers
  const roomNameTitle = document.getElementById('roomNameTitle');
  const roomCodeBadge = document.getElementById('roomCodeBadge');

  if (roomNameTitle) roomNameTitle.textContent = room.name;
  if (roomCodeBadge) roomCodeBadge.textContent = currentActiveRoomCode;

  // Initial presence update
  storage.updateMemberPresence(currentActiveRoomCode, currentUser.id);

  // Periodic presence update every 8 seconds
  setInterval(() => {
    storage.updateMemberPresence(currentActiveRoomCode, currentUser.id);
  }, 8000);

  // Periodic UI update every 4 seconds to catch when other members go offline
  setInterval(() => {
    updateRoomUI(storage, currentActiveRoomCode);
  }, 4000);

  // Initial UI updates
  updateRoomUI(storage, currentActiveRoomCode);

  // Setup Leave Room Button
  const leaveRoomButton = document.getElementById('leaveRoomButton');
  if (leaveRoomButton) {
    leaveRoomButton.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to exit this shopping room?')) {
        storage.setActiveRoomCode(null);
        window.location.href = 'dashboard.html';
      }
    });
  }

  // Storage listener to refresh workspace info in real-time
  window.addEventListener('storage', () => {
    updateRoomUI(storage, currentActiveRoomCode);
  });
}

function updateRoomUI(storage, roomCode) {
  const room = storage.getRoomByCode(roomCode);
  if (!room) return;

  // Update Members list UI
  const activeMembersCount = document.getElementById('activeMembersCount');
  const activeRoomMembersList = document.getElementById('activeRoomMembersList');

  if (activeMembersCount) activeMembersCount.textContent = room.members.length;
  if (activeRoomMembersList) {
    activeRoomMembersList.innerHTML = '';
    room.members.forEach(member => {
      const isMe = member.id === storage.getCurrentUser().id;
      const item = document.createElement('li');
      item.className = 'd-flex align-items-center justify-content-between py-2 border-bottom border-light';
      item.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <div class="avatar bg-gradient text-white rounded-circle d-flex align-items-center justify-content-center fw-bold text-uppercase" style="width: 28px; height: 28px; font-size: 0.8rem;">
            ${member.name.charAt(0)}
          </div>
          <span class="fw-medium text-dark small">${member.name} ${isMe ? '<span class="text-muted text-opacity-50 small">(you)</span>' : ''}</span>
        </div>
        <span class="badge rounded-circle bg-success p-1"><span class="visually-hidden">Online</span></span>
      `;
      activeRoomMembersList.appendChild(item);
    });
  }

  // Update Activity Timeline UI
  const activityTimelineList = document.getElementById('activityTimelineList');
  if (activityTimelineList) {
    const logs = storage.getLogs(roomCode);
    activityTimelineList.innerHTML = '';

    if (logs.length === 0) {
      activityTimelineList.innerHTML = `
        <li class="text-center py-4 text-muted small">
          <i class="bi bi-clock-history d-block mb-1 fs-5"></i> No actions recorded yet.
        </li>
      `;
    } else {
      // Show only last 10 activities for clean timeline display
      logs.slice(0, 10).forEach(log => {
        const item = document.createElement('li');
        item.className = 'mb-3 ms-4 position-relative timeline-item text-start';
        
        // Human readable time
        const timeStr = formatTimestamp(log.timestamp);
        
        item.innerHTML = `
          <div class="timeline-marker bg-primary bg-opacity-25 rounded-circle position-absolute" style="left: -24px; top: 4px; width: 12px; height: 12px; border: 2px solid var(--primary);"></div>
          <p class="mb-0 text-dark small"><strong>${log.user}</strong> ${log.action}</p>
          <span class="text-muted small text-opacity-75" style="font-size: 0.75rem;">${timeStr}</span>
        `;
        activityTimelineList.appendChild(item);
      });
    }
  }
}

function formatTimestamp(isoString) {
  try {
    const date = new Date(isoString);
    const diffMs = new Date() - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch (e) {
    return 'Recently';
  }
}
