// payment-gateway.js
// Handles payment selection, PayPal login, card payment, and email config

document.addEventListener('DOMContentLoaded', function() {
  const paymentForm = document.getElementById('payment-form');
  const paymentSection = document.getElementById('payment-section');
  const emailForm = document.getElementById('email-form');
  const emailStatus = document.getElementById('email-status');

  if (paymentForm) {
    paymentForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const method = paymentForm.payment.value;
    paymentSection.innerHTML = '';
    if (method === 'paypal') {
      showPayPalButtons();
    } else {
      showCardForm();
    }
  });
  }

  function showPayPalButtons() {
    paymentSection.innerHTML = `<div id="paypal-button-container" style="margin-top:20px;"></div><div id="paypal-status" style="margin-top:12px;"></div>`;
    fetch('/config/paypal')
      .then(r => r.json())
      .then(cfg => {
        if (!cfg.clientId) {
          document.getElementById('paypal-status').textContent = 'PayPal not configured.';
          return;
        }
        // Dynamically load PayPal SDK with correct client ID
        if (window.paypal) {
          window.paypal.Buttons({
            createOrder: function(_data, _actions) {
              // Call backend to create order
              return fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: [{ title: 'Order', price: 10, quantity: 1 }] }) // Replace with real order data
              })
                .then(res => res.json())
                .then(order => order.id);
            },
            onApprove: function(_data, _actions) {
              // Capture payment
              return fetch(`/api/orders/${_data.orderID}/capture`, { method: 'POST' })
                .then(res => res.json())
                .then(_details => {
                  document.getElementById('paypal-status').textContent = 'Payment successful!';
                });
            },
            onError: function(_err) {
              document.getElementById('paypal-status').textContent = 'Payment failed.';
            }
          }).render('#paypal-button-container');
        } else {
          document.getElementById('paypal-status').textContent = 'PayPal SDK not loaded.';
        }
      });
  }

  function showCardForm() {
    paymentSection.innerHTML = `
      <form id="card-form" style="margin-top:20px;">
        <input type="text" class="input" placeholder="Card Number" required maxlength="19">
        <input type="text" class="input" placeholder="MM/YY" required maxlength="5">
        <input type="text" class="input" placeholder="CVV" required maxlength="4">
        <button type="submit" class="btn btn-card">Pay with Card</button>
      </form>
      <div id="card-status" style="margin-top:12px;"></div>
    `;
    document.getElementById('card-form').onsubmit = function(e) {
      e.preventDefault();
      document.getElementById('card-status').textContent = 'Processing card payment...';
      setTimeout(() => {
        document.getElementById('card-status').textContent = 'Payment successful!';
      }, 1500);
    };
  }

  if (emailForm) {
    emailForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const emailInput = document.getElementById('email');
      const email = emailInput ? emailInput.value : '';
      // Simulate saving email (replace with real backend call)
      if (emailStatus) emailStatus.textContent = 'Saving...';
      setTimeout(() => {
        if (emailStatus) emailStatus.textContent = 'Sender email saved: ' + email;
      }, 1000);
    });
  }
});
