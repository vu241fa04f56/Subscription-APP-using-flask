let currentChatId = null;
let currentUserId = null;
let pollInterval  = null;

document.addEventListener('DOMContentLoaded', async () => {
  requireAuth();

  try {
    const meRes  = await get('/auth/me');
    const meData = await meRes.json();
    if (meData.success) currentUserId = meData.data._id;
  } catch(e) { console.error('Failed to get current user', e); }

  await loadConversations();

  const params     = new URLSearchParams(window.location.search);
  const targetUser = params.get('user');
  if (targetUser) await openOrCreateChat(targetUser);

  document.getElementById('send-btn')?.addEventListener('click', sendMessage);
  document.getElementById('msg-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  document.getElementById('new-chat-btn')?.addEventListener('click', () => {
    const userId = prompt('Enter User ID to chat with:');
    if (userId) openOrCreateChat(userId);
  });
});

async function loadConversations() {
  try {
    const res  = await get('/chat/conversations');
    const data = await res.json();
    const list = document.getElementById('conversations-list');
    if (!list || !data.success) return;
    if (!data.data.length) {
      list.innerHTML = '<p class="empty-chat">No conversations yet. Start one from Matches!</p>';
      return;
    }
    list.innerHTML = data.data.map(c => {
      const other = c.other_user || { name: 'User', avatar: '' };
      const otherId = c.participants.find(p => p !== currentUserId) || '';
      const nameLetter = (other.name || '?')[0].toUpperCase();
      const avatarHTML = other.avatar 
        ? `<img src="${other.avatar}" alt="${other.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
        : `<span>${nameLetter}</span>`;
      
      const showLS = other.show_last_seen !== false;
      const lastSeenStr = other.last_seen || '';
        
      return `
        <div class="conv-item ${c._id === currentChatId ? 'active' : ''}" 
             data-chat-id="${c._id}" 
             data-user-id="${otherId}" 
             data-show-last-seen="${showLS}" 
             data-last-seen="${lastSeenStr}" 
             onclick="selectChat('${c._id}')">
          <div class="conv-avatar">${avatarHTML}</div>
          <div class="conv-info">
            <div class="conv-name" style="font-weight:600;font-size:14px;margin-bottom:2px">${other.name}</div>
            <div class="conv-last" style="font-size:12px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px">${c.last_message || 'No messages yet'}</div>
            <div class="conv-time" style="font-size:10px;color:var(--text-muted);margin-top:4px">${c.last_message_at ? timeAgo(c.last_message_at) : ''}</div>
          </div>
        </div>
      `;
    }).join('');

    // Dynamically update active chat header status
    if (currentChatId) {
      const activeConv = document.querySelector(`[data-chat-id="${currentChatId}"]`);
      if (activeConv) {
        activeConv.classList.add('active');
        updateHeaderStatus(activeConv);
      }
    }
  } catch (e) { console.error('Load conversations error:', e); }
}

function updateHeaderStatus(activeConv) {
  if (!activeConv) return;
  const showLS = activeConv.dataset.showLastSeen !== 'false';
  const lastSeenStr = activeConv.dataset.lastSeen || '';
  const statusEl = document.getElementById('chat-header-status');
  if (statusEl) {
    if (!showLS) {
      statusEl.textContent = '● Status: Hidden';
      statusEl.style.color = 'var(--text-muted)';
    } else if (!lastSeenStr) {
      statusEl.textContent = '● Offline';
      statusEl.style.color = 'var(--text-muted)';
    } else {
      const lastSeenDate = new Date(lastSeenStr);
      const diffMs = Date.now() - lastSeenDate;
      if (diffMs < 15000) { // 15s online threshold
        statusEl.textContent = '● Online';
        statusEl.style.color = 'var(--success)';
      } else {
        statusEl.textContent = `Last seen: ${timeAgo(lastSeenStr)}`;
        statusEl.style.color = 'var(--text-muted)';
      }
    }
  }
}

async function openOrCreateChat(userId) {
  try {
    const res  = await post('/chat/conversations', { user_id: userId });
    const data = await res.json();
    if (data.success) {
      const chatId = data.data.chat_id || data.data._id;
      await selectChat(chatId);
      await loadConversations();
    } else {
      showToast(data.message || 'Could not open chat', 'error');
    }
  } catch (e) { showToast('Could not open chat', 'error'); }
}

// BUG FIX: selectChat now directly shows/hides panel elements.
// The broken override in chat.html (calling undefined 'origSelect') has been removed.
async function selectChat(chatId) {
  currentChatId = chatId;
  if (pollInterval) clearInterval(pollInterval);

  // Show chat panels
  document.getElementById('chat-placeholder').style.display  = 'none';
  document.getElementById('messages-container').style.display = 'flex';
  document.getElementById('chat-input-area').style.display    = 'flex';

  document.querySelectorAll('.conv-item').forEach(el => el.classList.remove('active'));
  const activeConv = document.querySelector(`[data-chat-id="${chatId}"]`);
  if (activeConv) {
    activeConv.classList.add('active');
    
    // Populate header info
    const name = activeConv.querySelector('.conv-name')?.textContent || 'User';
    const avatarHTML = activeConv.querySelector('.conv-avatar')?.innerHTML || '';
    const otherUserId = activeConv.dataset.userId || '';
    
    const headerName = document.getElementById('chat-header-name');
    const headerAvatar = document.getElementById('chat-header-avatar');
    const headerId = document.getElementById('chat-header-id');
    const header = document.getElementById('chat-window-header');
    
    if (headerName && headerAvatar && header && headerId) {
      headerName.textContent = name;
      headerAvatar.innerHTML = avatarHTML;
      headerId.textContent = `User ID: ${otherUserId}`;
      header.style.display = 'flex';
      updateHeaderStatus(activeConv);
    }
  }

  await loadMessages(chatId);
  pollInterval = setInterval(() => loadMessages(chatId), 3000);

  try {
    const readRes = await post(`/chat/conversations/${chatId}/read`, {});
    if (readRes.ok) {
      loadConversations();
    }
  } catch(e) {}
}

async function loadMessages(chatId) {
  try {
    const res  = await get(`/chat/conversations/${chatId}/messages`);
    const data = await res.json();
    const container = document.getElementById('messages-container');
    if (!container || !data.success) return;
    const wasAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 60;
    container.innerHTML = data.data.map(m => {
      let statusHtml = '';
      if (m.sender_id === currentUserId) {
        let checkIcon = '✓';
        let checkClass = 'msg-status-sent';
        
        // If read_by contains other participant
        const otherId = document.querySelector(`[data-chat-id="${chatId}"]`)?.dataset.userId;
        if (otherId && m.read_by && m.read_by.includes(otherId)) {
          checkIcon = '✓✓';
          checkClass = 'msg-status-read';
        } else if (otherId && m.delivered_to && m.delivered_to.includes(otherId)) {
          checkIcon = '✓✓';
          checkClass = 'msg-status-delivered';
        }
        statusHtml = `<span class="msg-status ${checkClass}">${checkIcon}</span>`;
      }
      
      return `
        <div class="message ${m.sender_id === currentUserId ? 'sent' : 'received'}">
          <div class="message-bubble">
            <div class="message-text">${escapeHtml(m.content)}</div>
            <div class="message-meta">
              <span class="message-time">${formatTime(m.created_at)}</span>
              ${statusHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');
    if (wasAtBottom) container.scrollTop = container.scrollHeight;

    // Auto-read check
    const hasUnread = data.data.some(m => m.sender_id !== currentUserId && (!m.read_by || !m.read_by.includes(currentUserId)));
    if (hasUnread) {
      try {
        const readRes = await post(`/chat/conversations/${chatId}/read`, {});
        if (readRes.ok) loadConversations();
      } catch (err) {}
    }
  } catch (e) {}
}

async function sendMessage() {
  if (!currentChatId) return;
  const input   = document.getElementById('msg-input');
  const content = input?.value.trim();
  if (!content) return;
  input.value = '';
  try {
    const res  = await post(`/chat/conversations/${currentChatId}/messages`, { content });
    const data = await res.json();
    if (data.success) loadMessages(currentChatId);
    else showToast(data.message || 'Failed to send', 'error');
  } catch { showToast('Failed to send message', 'error'); }
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
