/**
 * Dashboard Analytics and Tab Routing Controller for SharedCart
 */

let categoryChartInstance = null;
let growthChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  const catalogTabBtn = document.getElementById('catalogTabBtn');
  const analyticsTabBtn = document.getElementById('analyticsTabBtn');
  const catalogPane = document.getElementById('catalogPane');
  const analyticsPane = document.getElementById('analyticsPane');

  if (!catalogTabBtn || !analyticsTabBtn) return; // Exit if not on room.html

  // Tab Toggling Action
  catalogTabBtn.addEventListener('click', () => {
    catalogTabBtn.classList.add('active');
    analyticsTabBtn.classList.remove('active');
    catalogPane.classList.remove('d-none');
    analyticsPane.classList.add('d-none');
  });

  analyticsTabBtn.addEventListener('click', () => {
    analyticsTabBtn.classList.add('active');
    catalogTabBtn.classList.remove('active');
    analyticsPane.classList.remove('d-none');
    catalogPane.classList.add('d-none');
    
    // Draw or Refresh charts
    renderAnalyticsCharts();
  });

  // Re-draw charts when LocalStorage synchronises
  window.addEventListener('storage', () => {
    if (analyticsPane && !analyticsPane.classList.contains('d-none')) {
      renderAnalyticsCharts();
    }
  });
});

function renderAnalyticsCharts() {
  const storage = window.SharedCartStorage;
  const roomCode = storage.getActiveRoomCode();
  if (!roomCode) return;

  const items = storage.getCart(roomCode);
  const logs = storage.getLogs(roomCode);

  renderCategoryChart(items);
  renderGrowthChart(logs, items);
}

// Doughnut Chart of Product Categories
function renderCategoryChart(cartItems) {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;

  const categories = ['Grocery', 'Electronics', 'Home Essentials', 'Snacks'];
  const dataCounts = [0, 0, 0, 0];

  cartItems.forEach(item => {
    const catIndex = categories.indexOf(item.category);
    if (catIndex > -1) {
      dataCounts[catIndex] += item.quantity;
    }
  });

  const chartData = {
    labels: categories,
    datasets: [{
      data: dataCounts,
      backgroundColor: [
        '#4F46E5', // Indigo
        '#7C3AED', // Violet
        '#10B981', // Emerald
        '#F59E0B'  // Amber
      ],
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverOffset: 6
    }]
  };

  if (categoryChartInstance) {
    categoryChartInstance.destroy();
  }

  categoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            font: {
              family: 'Inter',
              size: 11
            },
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
              const value = context.raw;
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${context.label}: ${value} units (${percentage}%)`;
            }
          }
        }
      },
      cutout: '65%'
    }
  });
}

// Line Chart of Cart Value Growth Over Log History
function renderGrowthChart(logs, currentCartItems) {
  const ctx = document.getElementById('growthChart');
  if (!ctx) return;

  // Re-build growth timeline by walking logs backwards
  // Logs are sorted descending (latest first). Let's sort ascending for chronological walk.
  const chronoLogs = [...logs].reverse();
  
  // Track running cost values
  const labels = ['Start'];
  const values = [0];
  
  let currentCost = 0;
  
  // Quick lookup of prices from catalog fallback
  const getPrice = (prodName) => {
    const item = currentCartItems.find(i => prodName.toLowerCase().includes(i.name.toLowerCase()));
    if (item) return item.price;
    // Guess default values if not present
    if (prodName.toLowerCase().includes('laptop')) return 899.99;
    if (prodName.toLowerCase().includes('headphones')) return 149.99;
    if (prodName.toLowerCase().includes('rice')) return 12.99;
    return 5.00; // default guess
  };

  chronoLogs.forEach((log) => {
    // Basic regex checks for actions
    const timeLabel = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add X (Qty: N)
    const addMatch = log.action.match(/added (.+) \(Qty: (\d+)\)/i);
    // increased quantity of X to N
    const incMatch = log.action.match(/increased quantity of (.+) to (\d+)/i);
    // decreased quantity of X to N
    const decMatch = log.action.match(/decreased quantity of (.+) to (\d+)/i);
    // removed X
    const remMatch = log.action.match(/removed (.+) from the cart/i);

    if (addMatch) {
      const name = addMatch[1];
      const qty = parseInt(addMatch[2]);
      currentCost += getPrice(name) * qty;
      labels.push(timeLabel);
      values.push(parseFloat((currentCost * 1.10).toFixed(2))); // include taxes
    } else if (incMatch) {
      const name = incMatch[1];
      const newQty = parseInt(incMatch[2]);
      // Approximate: difference is newQty - (newQty - 1) which is 1
      currentCost += getPrice(name);
      labels.push(timeLabel);
      values.push(parseFloat((currentCost * 1.10).toFixed(2)));
    } else if (decMatch) {
      const name = decMatch[1];
      const newQty = decMatch[2];
      currentCost -= getPrice(name);
      labels.push(timeLabel);
      values.push(parseFloat((currentCost * 1.10).toFixed(2)));
    } else if (remMatch) {
      const name = remMatch[1];
      currentCost -= getPrice(name);
      if (currentCost < 0) currentCost = 0;
      labels.push(timeLabel);
      values.push(parseFloat((currentCost * 1.10).toFixed(2)));
    }
  });

  // If no growth points logged yet, draw flat current value
  if (values.length <= 1) {
    const totalVal = currentCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.10;
    labels.push('Now');
    values.push(parseFloat(totalVal.toFixed(2)));
  }

  // Cap timeline data points to last 8 events to prevent clutter
  let displayLabels = labels;
  let displayValues = values;
  if (values.length > 8) {
    displayLabels = [labels[0], ...labels.slice(-7)];
    displayValues = [values[0], ...values.slice(-7)];
  }

  const chartData = {
    labels: displayLabels,
    datasets: [{
      label: 'Cart Total ($)',
      data: displayValues,
      borderColor: '#4F46E5', // Indigo
      backgroundColor: 'rgba(79, 70, 229, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#4F46E5',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7
    }]
  };

  if (growthChartInstance) {
    growthChartInstance.destroy();
  }

  growthChartInstance = new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              family: 'Inter',
              size: 10
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: '#f3f4f6'
          },
          ticks: {
            callback: value => `$${value}`,
            font: {
              family: 'Inter',
              size: 10
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}
