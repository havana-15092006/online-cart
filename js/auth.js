/**
 * Authentication Logic for SharedCart
 */

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');
  const authAlert = document.getElementById('authAlert');
  const authAlertMsg = document.getElementById('authAlertMsg');

  // Check if session already exists and auto-redirect
  const currentUser = window.SharedCartStorage.getCurrentUser();
  const currentPath = window.location.pathname.toLowerCase();

  const isAuthPage = currentPath.endsWith('login.html') || currentPath.endsWith('register.html') || currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/');

  if (currentUser && (currentPath.endsWith('login.html') || currentPath.endsWith('register.html') || currentPath.endsWith('index.html'))) {
    window.location.href = 'dashboard.html';
    return;
  }

  // Helper to show errors
  function showError(message) {
    if (authAlert && authAlertMsg) {
      authAlertMsg.textContent = message;
      authAlert.classList.remove('d-none');
    }
  }

  // Helper to hide errors
  function hideError() {
    if (authAlert) {
      authAlert.classList.add('d-none');
    }
  }

  // --- Registration Logic ---
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      hideError();

      const name = document.getElementById('registerName').value;
      const email = document.getElementById('registerEmail').value;
      const password = document.getElementById('registerPassword').value;
      const confirmPassword = document.getElementById('registerConfirmPassword').value;

      // Front-end sanity checks
      if (!name.trim() || !email.trim() || !password || !confirmPassword) {
        showError('Please fill out all fields.');
        return;
      }

      if (password !== confirmPassword) {
        showError('Passwords do not match.');
        return;
      }

      // Call DAL to register
      const result = window.SharedCartStorage.registerUser(name, email, password);

      if (result.success) {
        // Success: redirect to login
        window.location.href = 'login.html?registered=true';
      } else {
        showError(result.message);
      }
    });
  }

  // --- Login Logic ---
  if (loginForm) {
    // Check if redirect query exists (from register success)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'true') {
      if (authAlert && authAlertMsg) {
        authAlert.classList.remove('alert-danger', 'd-none');
        authAlert.classList.add('alert-success');
        authAlertMsg.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i> Registration successful! Please log in.';
      }
    }

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      hideError();
      // Reset alert classes in case it was a success alert previously
      if (authAlert) {
        authAlert.classList.remove('alert-success');
        authAlert.classList.add('alert-danger');
      }

      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const remember = document.getElementById('loginRemember').checked;

      if (!email.trim() || !password) {
        showError('Please enter both email and password.');
        return;
      }

      // Call DAL to login
      const result = window.SharedCartStorage.loginUser(email, password, remember);

      if (result.success) {
        window.location.href = 'dashboard.html';
      } else {
        showError(result.message);
      }
    });
  }
});
