document.addEventListener('DOMContentLoaded', async () => {
  requireAuth();

  // Load plans
  try {
    const res = await get('/subscriptions/plans');
    const data = await res.json();
    const container = document.getElementById('plans-container');
    if (container && data.success) {
      container.innerHTML = data.data.map(plan => `
        <div class="plan-card ${plan.slug === 'pro' ? 'featured' : ''}">
          ${plan.slug === 'pro' ? '<div class="plan-badge">Most Popular</div>' : ''}
          <h3>${plan.name}</h3>
          <div class="plan-price">
            ${plan.is_free ? '<span class="price">Free</span>' : `<span class="price">₹${plan.price}</span><span class="interval">/${plan.interval}</span>`}
          </div>
          ${plan.trial_days > 0 ? `<p class="trial-note">${plan.trial_days}-day free trial</p>` : ''}
          <ul class="plan-features">
            ${plan.features.map(f => `<li>✓ ${f}</li>`).join('')}
          </ul>
          <button class="btn-subscribe" data-plan-id="${plan._id}" data-plan-free="${plan.is_free}">
            ${plan.is_free ? 'Get Started' : `Subscribe — ₹${plan.price}`}
          </button>
        </div>
      `).join('');
      attachSubscribeHandlers();
    }
  } catch (e) { console.error(e); }

  // Load current subscription
  try {
    const res = await get('/subscriptions/my');
    const data = await res.json();
    const currentEl = document.getElementById('current-subscription');
    if (currentEl) {
      if (data.data) {
        const s = data.data;
        currentEl.innerHTML = `
          <div class="current-sub">
            <strong>${s.plan?.name || 'Unknown Plan'}</strong>
            <span class="status-badge">${s.status}</span>
            <span>Expires: ${s.expires_at ? new Date(s.expires_at).toLocaleDateString() : 'N/A'}</span>
            <button id="cancel-sub-btn" class="btn-danger">Cancel</button>
          </div>
        `;
        document.getElementById('cancel-sub-btn')?.addEventListener('click', cancelSubscription);
      } else {
        currentEl.innerHTML = '<p>No active subscription.</p>';
      }
    }
  } catch (e) {}
});

function attachSubscribeHandlers() {
  document.querySelectorAll('.btn-subscribe').forEach(btn => {
    btn.addEventListener('click', async () => {
      const planId = btn.dataset.planId;
      const isFree = btn.dataset.planFree === 'true';
      if (isFree) {
        const res = await post(`/subscriptions/subscribe/${planId}`, {});
        const data = await res.json();
        showToast(data.message, data.success ? 'success' : 'error');
        if (data.success) setTimeout(() => location.reload(), 1000);
      } else {
        initiateRazorpayPayment(planId);
      }
    });
  });
}

async function initiateRazorpayPayment(planId) {
  try {
    const res = await post('/payments/create-order', { plan_id: planId });
    const data = await res.json();
    if (!data.success) { showToast(data.message, 'error'); return; }
    const order = data.data;

    // Check for mock environment (local development without keys)
    if (!order.razorpay_key || order.razorpay_key.startsWith('your-') || order.razorpay_key === 'rzp_test_mock') {
      openMockPaymentModal(order);
      return;
    }

    const options = {
      key: order.razorpay_key,
      amount: order.amount,
      currency: order.currency,
      name: 'Subspace Platform',
      description: `${order.plan_name} Subscription`,
      order_id: order.razorpay_order_id,
      handler: async (response) => {
        const verify = await post('/payments/verify', {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
        const vData = await verify.json();
        showToast(vData.message, vData.success ? 'success' : 'error');
        if (vData.success) setTimeout(() => location.reload(), 1500);
      },
      prefill: {},
      theme: { color: '#6c47ff' },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (e) { showToast('Payment initiation failed', 'error'); }
}

function openMockPaymentModal(order) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'mock-payment-overlay';
  
  overlay.innerHTML = `
    <div class="payment-modal">
      <div class="pm-header">
        <h3>Select Payment Mode</h3>
        <button class="pm-close-btn" id="pm-close">&times;</button>
      </div>
      <div class="pm-summary">
        <span>Subscription Fee</span>
        <strong>₹${(order.amount / 100).toFixed(2)}</strong>
      </div>
      
      <div id="pm-payment-flow">
        <div class="pm-tabs">
          <button class="pm-tab-btn active" id="pm-tab-card">💳 Card</button>
          <button class="pm-tab-btn" id="pm-tab-upi">📱 UPI</button>
        </div>
        
        <div class="pm-content">
          <!-- Card Form -->
          <div class="pm-pane active" id="pm-pane-card">
            <div class="form-group">
              <label class="form-label">Card Number</label>
              <input type="text" class="form-control" placeholder="4111 2222 3333 4444" id="pm-card-num" required>
            </div>
            <div style="display:flex;gap:12px">
              <div class="form-group" style="flex:1">
                <label class="form-label">Expiry</label>
                <input type="text" class="form-control" placeholder="MM/YY" id="pm-card-expiry" required>
              </div>
              <div class="form-group" style="flex:1">
                <label class="form-label">CVV</label>
                <input type="password" class="form-control" placeholder="123" id="pm-card-cvv" required>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Cardholder Name</label>
              <input type="text" class="form-control" placeholder="John Doe" id="pm-card-name" required>
            </div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:12px;display:flex;gap:6px">
              <span>ℹ️</span>
              <span>Money will be debited and transferred to Admin's bank account.</span>
            </div>
            <button class="btn-full" style="margin-top:16px" id="pm-btn-pay-card">Pay via Card</button>
          </div>
          
          <!-- UPI Form -->
          <div class="pm-pane" id="pm-pane-upi">
            <div class="form-group">
              <label class="form-label">UPI ID / VPA</label>
              <input type="text" class="form-control" placeholder="username@upi" id="pm-upi-id" required>
            </div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:12px;display:flex;gap:6px">
              <span>ℹ️</span>
              <span>A payment request will be simulated on your mobile UPI app.</span>
            </div>
            <button class="btn-full" style="margin-top:16px" id="pm-btn-pay-upi">Pay via UPI</button>
          </div>
        </div>
      </div>
      
      <!-- Simulation State -->
      <div id="pm-simulation" class="pm-simulating hidden">
        <div class="pm-spinner"></div>
        <h4 id="pm-sim-status" style="margin-bottom:8px">Processing Payment...</h4>
        <p id="pm-sim-detail" style="font-size:13px;color:var(--text-muted)">Transferring funds to Admin Bank Account...</p>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Tab switching
  const tabCard = overlay.querySelector('#pm-tab-card');
  const tabUpi = overlay.querySelector('#pm-tab-upi');
  const paneCard = overlay.querySelector('#pm-pane-card');
  const paneUpi = overlay.querySelector('#pm-pane-upi');

  tabCard.addEventListener('click', () => {
    tabCard.classList.add('active');
    tabUpi.classList.remove('active');
    paneCard.classList.add('active');
    paneUpi.classList.remove('active');
  });

  tabUpi.addEventListener('click', () => {
    tabUpi.classList.add('active');
    tabCard.classList.remove('active');
    paneUpi.classList.add('active');
    paneCard.classList.remove('active');
  });

  // Close modal
  overlay.querySelector('#pm-close').addEventListener('click', () => {
    overlay.remove();
  });

  // Pay Card
  overlay.querySelector('#pm-btn-pay-card').addEventListener('click', () => {
    const cardNum = overlay.querySelector('#pm-card-num').value.trim();
    const expiry = overlay.querySelector('#pm-card-expiry').value.trim();
    const cvv = overlay.querySelector('#pm-card-cvv').value.trim();
    const name = overlay.querySelector('#pm-card-name').value.trim();

    if (!cardNum || !expiry || !cvv || !name) {
      showToast('Please fill all card details', 'error');
      return;
    }
    startSimulation('Card', cardNum);
  });

  // Pay UPI
  overlay.querySelector('#pm-btn-pay-upi').addEventListener('click', () => {
    const upiId = overlay.querySelector('#pm-upi-id').value.trim();
    if (!upiId) {
      showToast('Please enter your UPI ID', 'error');
      return;
    }
    startSimulation('UPI', upiId);
  });

  function startSimulation(method, identifier) {
    overlay.querySelector('#pm-payment-flow').classList.add('hidden');
    overlay.querySelector('#pm-simulation').classList.remove('hidden');
    
    const statusText = overlay.querySelector('#pm-sim-status');
    const detailText = overlay.querySelector('#pm-sim-detail');

    statusText.textContent = `Connecting to ${method} Gateway...`;
    detailText.textContent = `Verifying account: ${identifier}...`;

    setTimeout(() => {
      statusText.textContent = 'Transferring Funds...';
      detailText.textContent = `Sending ₹${(order.amount / 100).toFixed(2)} to Admin Bank Account...`;
      
      setTimeout(async () => {
        statusText.textContent = 'Finalizing Subscription...';
        detailText.textContent = 'Activating your Premium benefits...';

        try {
          const verify = await post('/payments/verify', {
            razorpay_order_id: order.razorpay_order_id,
            razorpay_payment_id: 'pay_mock_' + Math.random().toString(36).substr(2, 9),
            razorpay_signature: 'sig_mock_' + Math.random().toString(36).substr(2, 9),
          });
          const vData = await verify.json();
          showToast(vData.message, vData.success ? 'success' : 'error');
          overlay.remove();
          if (vData.success) setTimeout(() => location.reload(), 1000);
        } catch (e) {
          showToast('Failed to complete mock verification', 'error');
          overlay.remove();
        }
      }, 2000);
    }, 1500);
  }
}

async function cancelSubscription() {
  if (!confirm('Are you sure you want to cancel your subscription?')) return;
  const res = await post('/subscriptions/cancel', {});
  const data = await res.json();
  showToast(data.message, data.success ? 'success' : 'error');
  if (data.success) setTimeout(() => location.reload(), 1000);
}
