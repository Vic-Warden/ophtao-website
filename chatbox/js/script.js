/**
 * script.js Ophtao AI chatbot widget
 * Communicates with an AnythingLLM local instance.
 * Loaded on every page after the chatbot HTML block.
 */

(function () {

  /*   DOM elements   */
  const bubble      = document.getElementById('ophtao-chat-bubble');
  const chatWindow  = document.getElementById('ophtao-chat-window');
  const closeBtn    = document.getElementById('chat-close-btn');
  const messagesEl  = document.getElementById('chat-messages');
  const inputEl     = document.getElementById('chat-input');
  const sendBtn     = document.getElementById('chat-send-btn');
  const suggestions = document.getElementById('chat-suggestions');
  const statusDot   = document.getElementById('status-dot');
  const statusLabel = document.getElementById('status-label');
  const badge       = document.getElementById('chat-badge');
  const iconChat    = document.getElementById('bubble-icon-chat');
  const iconClose   = document.getElementById('bubble-icon-close');

  /*   State   */
  let isOpen    = false;
  let isBusy    = false;
  let hasUnread = false;

  /*   Toggle chat window open/closed   */
  function toggleChat() {
    isOpen = !isOpen;
    chatWindow.classList.toggle('chat-open', isOpen);
    iconChat.style.display  = isOpen ? 'none' : '';
    iconClose.style.display = isOpen ? ''     : 'none';
    bubble.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

    if (isOpen) {
      badge.style.display = 'none';
      hasUnread = false;
      setTimeout(() => inputEl.focus(), 280);
    }
  }

  bubble.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', toggleChat);

  /* Close on Escape key */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) toggleChat();
  });

  /*   Quick-suggestion buttons   */
  if (suggestions) {
    suggestions.querySelectorAll('.chat-suggestion-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const q = btn.getAttribute('data-question');
        if (q) sendMessage(q);
      });
    });
  }

  /*   Textarea auto-resize and send-button state   */
  inputEl.addEventListener('input', function () {
    sendBtn.disabled = (inputEl.value.trim().length === 0);
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 90) + 'px';
  });

  /* Send on Enter (Shift+Enter inserts a newline) */
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled && !isBusy) sendMessage(inputEl.value.trim());
    }
  });

  sendBtn.addEventListener('click', function () {
    if (!isBusy) sendMessage(inputEl.value.trim());
  });

  /*   Append a message bubble to the chat window   */
  function appendMessage(role, text) {
    /* Hide suggestions once the user has sent a message */
    if (suggestions && role === 'user') {
      suggestions.style.display = 'none';
    }

    const wrap = document.createElement('div');
    wrap.className = 'chat-message ' + role;

    /* Avatar shown only for bot messages */
    if (role === 'bot') {
      const av = document.createElement('div');
      av.className = 'msg-avatar';
      av.innerHTML = '<svg viewBox="0 0 32 32" fill="none"><path d="M3 16C3 16 8.5 7 16 7C23.5 7 29 16 29 16C29 16 23.5 25 16 25C8.5 25 3 16 3 16Z" stroke="white" stroke-width="1.8" fill="none" stroke-linejoin="round"/><circle cx="16" cy="16" r="4.5" stroke="white" stroke-width="1.8" fill="none"/><circle cx="17.5" cy="14.5" r="1.2" fill="white"/></svg>';
      wrap.appendChild(av);
    }

    const bubbleMsg = document.createElement('div');
    bubbleMsg.className = 'msg-bubble';
    bubbleMsg.textContent = text;
    wrap.appendChild(bubbleMsg);
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    return bubbleMsg;
  }

  /*   Typing indicator (animated dots)   */
  function showTyping() {
    const wrap = document.createElement('div');
    wrap.className = 'chat-message bot';
    wrap.id = 'typing-row';

    const av = document.createElement('div');
    av.className = 'msg-avatar';
    av.innerHTML = '<svg viewBox="0 0 32 32" fill="none"><path d="M3 16C3 16 8.5 7 16 7C23.5 7 29 16 29 16C29 16 23.5 25 16 25C8.5 25 3 16 3 16Z" stroke="white" stroke-width="1.8" fill="none" stroke-linejoin="round"/><circle cx="16" cy="16" r="4.5" stroke="white" stroke-width="1.8" fill="none"/><circle cx="17.5" cy="14.5" r="1.2" fill="white"/></svg>';
    wrap.appendChild(av);

    const ind = document.createElement('div');
    ind.className = 'typing-indicator';
    ind.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    wrap.appendChild(ind);
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById('typing-row');
    if (el) el.remove();
  }

  /*   Send a message to the AnythingLLM API   */
  async function sendMessage(text) {
    if (!text || isBusy) return;

    isBusy = true;
    sendBtn.disabled = true;
    inputEl.value = '';
    inputEl.style.height = '';

    appendMessage('user', text);
    showTyping();

    const endpoint =
      CONFIG.ANYTHINGLLM_BASE +
      '/api/v1/workspace/' +
      CONFIG.WORKSPACE_SLUG +
      '/chat';

    try {
      const res = await fetch(endpoint, {
        method  : 'POST',
        headers : {
          'Content-Type' : 'application/json',
          'Authorization': 'Bearer ' + CONFIG.API_KEY
        },
        body: JSON.stringify({ message: text, mode: 'query' })
      });

      hideTyping();

      if (!res.ok) throw new Error('HTTP ' + res.status);

      const data  = await res.json();
      const reply = (data.textResponse || data.text || '').trim()
        || "Je n'ai pas pu trouver une réponse. Appelez-nous au 01.39.13.91.91.";

      appendMessage('bot', reply);

      /* Show unread badge if window is closed */
      if (!isOpen) {
        hasUnread = true;
        badge.style.display = 'block';
      }

      setStatus(true);

    } catch (err) {
      hideTyping();
      console.error('[Ophtao Chat]', err);
      appendMessage('bot',
        "Je suis momentanément indisponible. Pour toute question, " +
        "appelez le cabinet au 01.39.13.91.91."
      );
      setStatus(false);
    }

    isBusy = false;
    inputEl.focus();
  }

  /*   Online / offline status indicator   */
  function setStatus(online) {
    if (statusDot)   statusDot.classList.toggle('offline', !online);
    if (statusLabel) statusLabel.textContent = online ? 'En ligne' : 'Hors ligne';
  }

  /* Ping the server on load to determine initial status */
  fetch(CONFIG.ANYTHINGLLM_BASE + '/api/ping', { method: 'GET' })
    .then(function (r) { setStatus(r.ok); })
    .catch(function ()  { setStatus(false); });

})();