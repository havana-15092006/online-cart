/**
 * Receipt Generation and Export Controller for SharedCart
 */

// Dynamically load jsPDF library for PDF export capabilities
if (typeof window.jspdf === 'undefined') {
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  document.head.appendChild(script);
}

document.addEventListener('DOMContentLoaded', () => {
  const storage = window.SharedCartStorage;

  const checkoutReceiptBtn = document.getElementById('checkoutReceiptBtn');
  const printReceiptBtn = document.getElementById('printReceiptBtn');
  const downloadReceiptBtn = document.getElementById('downloadReceiptBtn');

  if (!checkoutReceiptBtn) return; // Exit if not in room.html

  // Checkout Receipt Button Click
  checkoutReceiptBtn.addEventListener('click', () => {
    const roomCode = storage.getActiveRoomCode();
    if (!roomCode) return;

    const cartItems = storage.getCart(roomCode);
    if (cartItems.length === 0) {
      if (window.SharedCartCart) {
        window.SharedCartCart.showToast('Empty Cart', 'Cannot generate receipt for an empty cart.', 'warning');
      }
      return;
    }

    // Load receipt data
    generateReceiptData(storage, roomCode, cartItems);

    // Open Modal
    const receiptModalEl = document.getElementById('receiptModal');
    if (receiptModalEl) {
      const modal = new bootstrap.Modal(receiptModalEl);
      modal.show();
    }
  });

  // Native Browser Print Trigger
  if (printReceiptBtn) {
    printReceiptBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // PDF Download Trigger via jsPDF
  if (downloadReceiptBtn) {
    downloadReceiptBtn.addEventListener('click', () => {
      const roomCode = storage.getActiveRoomCode();
      const room = storage.getRoomByCode(roomCode);
      const cartItems = storage.getCart(roomCode);
      
      exportReceiptToPDF(room, cartItems);
    });
  }
});

function generateReceiptData(storage, roomCode, cartItems) {
  const room = storage.getRoomByCode(roomCode);
  if (!room) return;

  const receiptRoomCode = document.getElementById('receiptRoomCode');
  const receiptTimestamp = document.getElementById('receiptTimestamp');
  const receiptMembersNames = document.getElementById('receiptMembersNames');
  const receiptTableBody = document.getElementById('receiptTableBody');
  const receiptSubtotal = document.getElementById('receiptSubtotal');
  const receiptTax = document.getElementById('receiptTax');
  const receiptGrandTotal = document.getElementById('receiptGrandTotal');

  if (receiptRoomCode) receiptRoomCode.textContent = room.code;
  if (receiptTimestamp) {
    receiptTimestamp.textContent = `Date: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (receiptMembersNames) {
    receiptMembersNames.textContent = room.members.map(m => m.name).join(', ');
  }

  if (receiptTableBody) {
    receiptTableBody.innerHTML = '';
    let subtotal = 0;

    cartItems.forEach(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      const tr = document.createElement('tr');
      tr.className = 'border-bottom border-light';
      tr.innerHTML = `
        <td class="py-2">
          <span class="d-block fw-semibold text-dark small">${item.name}</span>
          <span class="text-muted text-opacity-75" style="font-size: 0.75rem;">Category: ${item.category} | Added by ${item.addedBy}</span>
        </td>
        <td class="text-center py-2 text-muted align-middle small">${item.quantity}</td>
        <td class="text-end py-2 fw-semibold text-dark align-middle small">₹${itemTotal.toFixed(2)}</td>
      `;
      receiptTableBody.appendChild(tr);
    });

    const tax = subtotal * 0.10;
    const grandTotal = subtotal + tax;

    if (receiptSubtotal) receiptSubtotal.textContent = `₹${subtotal.toFixed(2)}`;
    if (receiptTax) receiptTax.textContent = `₹${tax.toFixed(2)}`;
    if (receiptGrandTotal) receiptGrandTotal.textContent = `₹${grandTotal.toFixed(2)}`;

    // Generate Smart Expense Split
    const splits = {};
    cartItems.forEach(item => {
      const addedBy = item.addedBy || 'System';
      const itemTotal = item.price * item.quantity;
      splits[addedBy] = (splits[addedBy] || 0) + itemTotal;
    });

    const receiptSplitContainer = document.getElementById('receiptSplitContainer');
    if (receiptSplitContainer) {
      receiptSplitContainer.innerHTML = `
        <h6 class="fw-bold text-dark font-outfit mb-3 d-flex align-items-center gap-2" style="font-size: 0.95rem;">
          <i class="bi bi-pie-chart text-secondary"></i> Smart Expense Split
        </h6>
      `;
      Object.keys(splits).forEach(user => {
        const userSubtotal = splits[user];
        const userTax = userSubtotal * 0.10;
        const userTotal = userSubtotal + userTax;
        
        const row = document.createElement('div');
        row.className = 'd-flex justify-content-between align-items-center mb-2 small text-dark';
        row.innerHTML = `
          <span>👤 <strong class="text-secondary">${user}</strong></span>
          <span>
            <strong class="text-dark">₹${userTotal.toFixed(2)}</strong> 
            <span class="text-muted text-opacity-50" style="font-size: 0.75rem;">(₹${userSubtotal.toFixed(2)} + ₹${userTax.toFixed(2)} tax)</span>
          </span>
        `;
        receiptSplitContainer.appendChild(row);
      });
    }
  }
}

function exportReceiptToPDF(room, cartItems) {
  if (typeof window.jspdf === 'undefined') {
    alert('PDF generator is still loading. Please try again in a second.');
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Styling constants
    const primaryColor = '#F95A2C';
    const secondaryColor = '#FF9F1C';
    const darkColor = '#1E2229';
    const greyColor = '#A59892';

    // Header Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(primaryColor);
    doc.text('SharedCart Invoice', 20, 20);

    // Meta details
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(darkColor);
    doc.text(`Room Code: ${room.code.toUpperCase()}`, 20, 28);
    doc.text(`Room Name: ${room.name}`, 20, 33);
    doc.text(`Timestamp: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, 38);

    // Members list
    doc.setFont('Helvetica', 'bold');
    doc.text('Members:', 20, 48);
    doc.setFont('Helvetica', 'normal');
    const membersText = room.members.map(m => m.name).join(', ');
    const splitMembers = doc.splitTextToSize(membersText, 170);
    doc.text(splitMembers, 40, 48);

    // Drawing Table header line
    doc.setDrawColor('#E5E7EB');
    doc.line(20, 56, 190, 56);

    // Table titles
    doc.setFont('Helvetica', 'bold');
    doc.text('Product Name / Category', 20, 62);
    doc.text('Qty', 130, 62);
    doc.text('Price (Rs.)', 160, 62);
    doc.line(20, 65, 190, 65);

    let yPosition = 72;
    let subtotal = 0;

    doc.setFont('Helvetica', 'normal');
    cartItems.forEach(item => {
      const cost = item.price * item.quantity;
      subtotal += cost;

      // Item Name & Creator tag
      doc.setFont('Helvetica', 'bold');
      doc.text(item.name, 20, yPosition);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(greyColor);
      doc.text(`Cat: ${item.category} | Added: ${item.addedBy}`, 20, yPosition + 4);
      
      // Quantity & Cost
      doc.setFontSize(10);
      doc.setTextColor(darkColor);
      doc.text(item.quantity.toString(), 132, yPosition + 2);
      doc.text(`Rs. ${cost.toFixed(2)}`, 160, yPosition + 2);

      // Separator
      doc.line(20, yPosition + 8, 190, yPosition + 8);
      yPosition += 12;

      // Check if page overflows
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
    });

    // Calculation section
    const tax = subtotal * 0.10;
    const grandTotal = subtotal + tax;

    doc.line(20, yPosition + 2, 190, yPosition + 2);
    yPosition += 8;

    doc.setFont('Helvetica', 'normal');
    doc.text('Subtotal:', 120, yPosition);
    doc.text(`Rs. ${subtotal.toFixed(2)}`, 160, yPosition);

    yPosition += 6;
    doc.text('Tax (10%):', 120, yPosition);
    doc.text(`Rs. ${tax.toFixed(2)}`, 160, yPosition);

    yPosition += 8;
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.setFontSize(12);
    doc.text('Grand Total:', 120, yPosition);
    doc.text(`Rs. ${grandTotal.toFixed(2)}`, 160, yPosition);

    // Add Smart Expense Split Section to PDF
    yPosition += 15;
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.setFontSize(12);
    doc.text('Smart Expense Split', 20, yPosition);
    doc.setDrawColor('#E5E7EB');
    doc.line(20, yPosition + 2, 190, yPosition + 2);
    
    yPosition += 8;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(darkColor);
    doc.setFontSize(10);

    const pdfSplits = {};
    cartItems.forEach(item => {
      const addedBy = item.addedBy || 'System';
      const itemTotal = item.price * item.quantity;
      pdfSplits[addedBy] = (pdfSplits[addedBy] || 0) + itemTotal;
    });

    Object.keys(pdfSplits).forEach(user => {
      const uSub = pdfSplits[user];
      const uTax = uSub * 0.10;
      const uTotal = uSub + uTax;
      doc.text(`User: ${user}`, 20, yPosition);
      doc.text(`Rs. ${uTotal.toFixed(2)} (Rs. ${uSub.toFixed(2)} + Rs. ${uTax.toFixed(2)} tax)`, 120, yPosition);
      yPosition += 6;
    });

    // Save File
    doc.save(`receipt-${room.code.toLowerCase()}.pdf`);
    
    if (window.SharedCartCart) {
      window.SharedCartCart.showToast('PDF Exported', 'Receipt downloaded successfully.', 'success');
    }
  } catch (err) {
    console.error('Failed to export PDF:', err);
    alert('Error exporting PDF: ' + err.message);
  }
}
