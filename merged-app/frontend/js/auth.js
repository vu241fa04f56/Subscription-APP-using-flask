document.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn()) window.location.href = '/dashboard.html';

  // --- BUG FIX: Tab switching now uses correct IDs (login-tab / register-tab) ---
  const tabBtns = document.querySelectorAll('.tab-btn');
  const forms   = document.querySelectorAll('.auth-form');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      forms.forEach(f => f.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });

  // --- BUG FIX: Now targeting 'login-form-el' (not 'login-form' which was the outer div) ---
  const loginForm = document.getElementById('login-form-el');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email    = loginForm.querySelector('[name="email"]').value;
      const password = loginForm.querySelector('[name="password"]').value;
      const btn      = loginForm.querySelector('button[type="submit"]');
      btn.disabled   = true;
      btn.textContent = 'Logging in…';
      try {
        const res  = await post('/auth/email/login', { email, password });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('access_token',  data.data.access_token);
          localStorage.setItem('refresh_token', data.data.refresh_token);
          window.location.href = '/dashboard.html';
        } else {
          showToast(data.message || 'Login failed', 'error');
        }
      } catch {
        showToast('Network error. Please try again.', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Login to Subspace';
      }
    });
  }

  // --- BUG FIX: Now targeting 'register-form-el' ---
  const registerForm = document.getElementById('register-form-el');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name     = registerForm.querySelector('[name="name"]').value;
      const email    = registerForm.querySelector('[name="email"]').value;
      const password = registerForm.querySelector('[name="password"]').value;
      const btn      = registerForm.querySelector('button[type="submit"]');
      btn.disabled   = true;
      btn.textContent = 'Creating account…';
      try {
        const res  = await post('/auth/email/register', { name, email, password });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('access_token',  data.data.access_token);
          localStorage.setItem('refresh_token', data.data.refresh_token);
          showToast('Welcome to Subspace! 🚀', 'success');
          setTimeout(() => window.location.href = '/dashboard.html', 1000);
        } else {
          showToast(data.message || 'Registration failed', 'error');
        }
      } catch {
        showToast('Network error. Please try again.', 'error');
      } finally {
        btn.disabled   = false;
        btn.textContent = 'Create Account';
      }
    });
  }

  // --- Google OAuth & GIS Integration ---
  async function initGoogleLogin() {
    try {
      const res = await get('/auth/google/config');
      const data = await res.json();
      
      const googleBtn = document.getElementById('google-login-btn');
      if (!googleBtn) return;
      
      const clientId = data.google_client_id;
      const isValidClientId = clientId && clientId !== 'your-google-client-id' && clientId.endsWith('.apps.googleusercontent.com');
      
      if (isValidClientId) {
        // Initialize Google Identity Services
        google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: false
        });
        
        // Google client renders their official button inside a container.
        // We replace the <button> with a <div> container to support the iframe rendering correctly.
        const container = document.createElement('div');
        container.id = 'google-login-btn-container';
        container.style.width = '100%';
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.marginBottom = '16px';
        
        googleBtn.parentNode.replaceChild(container, googleBtn);
        
        google.accounts.id.renderButton(
          container,
          { 
            theme: 'outline', 
            size: 'large', 
            width: 380, 
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left'
          }
        );
      } else {
        // Mock fallback if Google Sign-In is not configured yet
        googleBtn.addEventListener('click', async () => {
          const email = prompt('Google client ID not configured in .env. Enter a mock Google email to test login:');
          if (!email) return;
          if (!email.includes('@')) {
            showToast('Invalid email address', 'error');
            return;
          }
          try {
            const mockToken = `mock_token_${email}`;
            const res = await post('/auth/google/login', { id_token: mockToken });
            const result = await res.json();
            if (result.success) {
              localStorage.setItem('access_token',  result.data.access_token);
              localStorage.setItem('refresh_token', result.data.refresh_token);
              showToast('Logged in successfully via Mock Google OAuth! 🚀', 'success');
              setTimeout(() => window.location.href = '/dashboard.html', 1000);
            } else {
              showToast(result.message || 'Mock Google login failed', 'error');
            }
          } catch (err) {
            showToast('Network error. Please try again.', 'error');
          }
        });
      }
    } catch (err) {
      console.error('Error initializing Google login:', err);
    }
  }

  async function handleGoogleCredentialResponse(response) {
    const idToken = response.credential;
    try {
      const res = await post('/auth/google/login', { id_token: idToken });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('access_token',  data.data.access_token);
        localStorage.setItem('refresh_token', data.data.refresh_token);
        showToast('Google login successful! 🚀', 'success');
        setTimeout(() => window.location.href = '/dashboard.html', 1000);
      } else {
        showToast(data.message || 'Google login failed', 'error');
      }
    } catch (err) {
      console.error('Google login error:', err);
      showToast('Network error during Google login', 'error');
    }
  }

  function checkGoogleLoaded() {
    if (window.google && window.google.accounts) {
      initGoogleLogin();
    } else {
      setTimeout(checkGoogleLoaded, 100);
    }
  }
  checkGoogleLoaded();

  // Forgot password
  document.getElementById('forgot-password-link')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = prompt('Enter your registered email:');
    if (!email) return;
    try {
      const res  = await post('/auth/email/forgot-password', { email });
      const data = await res.json();
      showToast(data.message, data.success ? 'success' : 'error');
      
      if (data.success) {
        // Give the user a moment to check their email/terminal logs, then prompt for OTP
        setTimeout(async () => {
          const otp = prompt('Enter the 6-digit OTP code sent to your email (or check server terminal logs):');
          if (!otp) return;
          const newPassword = prompt('Enter your new password:');
          if (!newPassword) return;
          
          try {
            const resetRes = await post('/auth/email/reset-password', {
              email,
              otp,
              new_password: newPassword
            });
            const resetData = await resetRes.json();
            if (resetData.success) {
              showToast('Password reset successful! You can now login.', 'success');
            } else {
              showToast(resetData.message || 'Failed to reset password', 'error');
            }
          } catch {
            showToast('Network error. Please try again.', 'error');
          }
        }, 1000);
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    }
  });

  // Fetch online users count for the landing page
  async function loadOnlineUsers() {
    const badge = document.getElementById('online-users-badge');
    if (!badge) return;
    try {
      const res = await get('/users/stats');
      const data = await res.json();
      if (data.success) {
        const count = data.data.online_users || 0;
        badge.textContent = `${count} ${count === 1 ? 'user' : 'users'} online now`;
      }
    } catch (err) {
      console.error('Failed to load online users:', err);
      badge.textContent = 'Active community';
    }
  }

  loadOnlineUsers();
  setInterval(loadOnlineUsers, 8000); // refresh every 8 seconds
});
