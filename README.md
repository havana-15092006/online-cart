# SharedCart - Collaborative Shopping Cart Web Application

SharedCart is a modern, responsive web application that enables multiple users to join a common room and collaboratively build a shopping list in real-time. It simulates a real-world multi-user collaborative shopping experience using **purely client-side technologies (HTML5, CSS3, Bootstrap 5, Vanilla JS)** and utilizes browser **LocalStorage** as its primary persistence and synchronization mechanism.

---

## Key Features

1. **LocalStorage Authentication**: Create accounts, log in, manage active sessions, and save credentials locally.
2. **Room Management**: Create custom shopping rooms (e.g. `GROCERY-2931`) or enter existing codes to join list collaborations.
3. **Cross-Tab Real-time Sync**: Open two separate browser tabs or windows, log into different accounts, join the same room code, and see changes in the cart or timeline reflect instantly in both windows.
4. **Rich Product Catalog**: Browse items with descriptions, ratings, and stock limits. Sort and filter items dynamically.
5. **Interactive Analytics Panel**: Visualized using Chart.js, featuring category breakdowns and chronological value growth timelines derived from room logs.
6. **Timeline Auditing**: Real-time logging of user actions (e.g., "Sarah increased Milk quantity to 3").
7. **Printable Invoice & PDF Exports**: Compile carts into clean invoices, print them directly, or download as formatted PDF files.

---

## Folder Structure

```
sharedcart/
├── index.html            # Landing / Marketing Page
├── login.html            # User Authentication Login Screen
├── register.html         # User Account Registration Screen
├── dashboard.html        # Main Portal (Create / Join / History Rooms)
├── room.html             # Collaborative Shopping Workspace
├── css/
│   ├── style.css         # Typography, Transitions, Global Overrides, Printing Styles
│   ├── auth.css          # Centered Form Cards & Glowing Input Styles
│   ├── dashboard.css     # Timeline, Cart Sidebar, and Chart Panel Styles
│   └── responsive.css    # Layout Overrides for Mobile and Tablet breakpoint limits
├── js/
│   ├── storage.js        # LocalStorage Data Access Layer (DAL) & Synchronization Hook
│   ├── auth.js           # Auth validations, cookie simulator, redirects
│   ├── room.js           # Member list rendering, room logic, relative dates
│   ├── products.js       # Product grid render, search matching, filtering, sorting
│   ├── cart.js           # Quantities increment/decrement, subtotal sums, sidebar animations, toast notifications
│   ├── dashboard.js      # Chart.js Category doughnut and cumulative growth line graphs
│   └── receipt.js        # Receipt rendering, browser print commands, jsPDF compilation
└── data/
    └── products.json     # Mock database catalog (Grocery, Electronics, Home, Snacks)
```

---

## LocalStorage Schema Design

Data is kept clean and normalized under these main keys:

- `sharedcart_users`: Collection of registered accounts `[{id, name, email, password}]`.
- `sharedcart_currentUser`: Active session metadata `{id, name, email}`.
- `sharedcart_rooms`: Active collaboration rooms `[{code, name, createdBy, createdAt, members: [{id, name}]}]`.
- `sharedcart_activeRoom`: String room code (e.g., `"GROCERY-2931"`).
- `sharedcart_carts`: Map of room codes to their respective cart items `{"ROOM_CODE": [{productId, name, price, category, quantity, addedBy}]}`.
- `sharedcart_activityLogs`: Map of room codes to chronological changes `{"ROOM_CODE": [{id, user, action, timestamp}]}`.

---

## Real-Time Collaboration Simulation (Cross-Tab Sync)

To simulate online multi-user real-time edits without a backend database, SharedCart listens to the native window `storage` event handler:
```javascript
window.addEventListener('storage', (e) => {
  if (e.key === 'sharedcart_carts') {
    // Automatically re-draws items and updates values
  }
});
```
When a user in **Tab A** changes a quantity, the browser updates `localStorage`. The browser triggers a `storage` event on **Tab B**, causing Tab B to instantly sync the cart UI and launch an interactive Toast notification.

---

## Setup & Running Locally

### Prerequisites
- Any modern web browser (Chrome, Firefox, Safari, Edge).
- No web servers are strictly required! The application is designed with local fallbacks, meaning it can run directly by double-clicking `index.html`. 
- However, to prevent browser console notices and allow seamless mock JSON fetches, running a simple local server is recommended.

### Option A: Run directly from Browser
1. Navigate to the root directory `sharedcart`.
2. Double-click `index.html` to open it in your browser.
3. *Note: Catalog fetching will gracefully fall back to hardcoded models if CORS policies block local file JSON fetches.*

### Option B: Run via a Local Node Server (Recommended)
1. Install a global static server package (if Node.js is installed):
   ```bash
   npm install -g http-server
   ```
2. Open terminal in the project directory and run:
   ```bash
   http-server -p 8080
   ```
3. Open `http://localhost:8080` in your web browser.

---

## How to Test Real-time Features
1. Open two browser windows side-by-side (either two normal windows or one normal and one incognito/different profile, or just two tabs in the same browser).
2. Register an account as **User A** (e.g., `userA@example.com`) in Window A and log in.
3. Register an account as **User B** (e.g., `userB@example.com`) in Window B and log in.
4. In Window A, create a room named `Weekly Grocery`. Write down the generated room code (e.g., `WEEKLY-5321`).
5. In Window B, enter the room code `WEEKLY-5321` and click **Join Room**.
6. **Add an item** from the product catalog in Window A. Observe that the item immediately updates in Window B's cart sidebar, accompanied by a Toast notification!
7. **Change quantities** or **remove items** in either window, and watch the subtotals, tax totals, timeline logs, and active member listings sync across both screens.
