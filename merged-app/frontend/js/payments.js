document.addEventListener('DOMContentLoaded', async () => {
  requireAuth();

  try {
    const res = await get('/payments/history');
    const data = await res.json();
    const tbody = document.getElementById('payments-table-body');
    if (tbody && data.success) {
      if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No payments found.</td></tr>';
        return;
      }
      tbody.innerHTML = data.data.map(p => `
        <tr>
          <td><code>${p._id.slice(-8).toUpperCase()}</code></td>
          <td>${p.plan_id}</td>
          <td>₹${(p.amount / 100).toFixed(2)}</td>
          <td><span class="status-badge status-${p.status}">${p.status}</span></td>
          <td>${new Date(p.created_at).toLocaleDateString('en-IN')}</td>
          <td>
            ${p.status === 'captured' ? `<button class="btn-sm" onclick="downloadInvoice('${p._id}')">Invoice</button>` : '—'}
          </td>
        </tr>
      `).join('');
    }
  } catch (e) { console.error(e); }
});

async function downloadInvoice(paymentId) {
  try {
    const token = localStorage.getItem('access_token');
    const res = await fetch(`/api/payments/invoice/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) { showToast('Invoice not available', 'error'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${paymentId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch { showToast('Download failed', 'error'); }
}
