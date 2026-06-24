// ===== admin/ai.js =====

document.addEventListener('DOMContentLoaded', function() {
  var savedKey = localStorage.getItem('gemini_api_key');
  if (savedKey) {
    var keyInput = document.getElementById('gemini-api-key');
    if (keyInput) keyInput.value = savedKey;
  }
  var savedModel = localStorage.getItem('gemini_model');
  if (!savedModel || savedModel.indexOf('latest') !== -1) {
    savedModel = 'gemini-1.5-flash';
    localStorage.setItem('gemini_model', savedModel);
  }
  var modelInput = document.getElementById('gemini-model');
  if (modelInput) modelInput.value = savedModel;
});

function saveApiKey(val) { localStorage.setItem('gemini_api_key', val); }
function toggleAISidebar() {
  var sb = document.getElementById('ai-sidebar');
  if (sb) sb.classList.toggle('open');
}

window.usePromptTemplate = function(type) {
  var input = document.getElementById('ai-input');
  if (!input) return;
  if (type === 'analyze') input.value = "請分析這些商店評價，並給出三個重點摘要：\n\n";
  else if (type === 'json') input.value = "請幫我把以下資料整理成 JSON 格式：\n\n";
  else if (type === 'check') input.value = "請檢查此商店的資料是否有異常之處：\n\n";
  input.focus();
};

window.copyToClipboard = function(elementId, btn) {
  var el = document.getElementById(elementId);
  if (!el) return;
  var text = el.innerText;
  navigator.clipboard.writeText(text).then(function() {
    var oldText = btn.innerText;
    btn.innerText = "已複製！";
    btn.style.backgroundColor = "#16a34a";
    btn.style.color = "#fff";
    setTimeout(function() {
      btn.innerText = oldText;
      btn.style.backgroundColor = "";
      btn.style.color = "";
    }, 2000);
  });
};

window.autofillForm = function(elementId) {
  var el = document.getElementById(elementId);
  if (!el) return;
  try {
    var data = JSON.parse(el.innerText);
    if (data.name && document.getElementById('s-name-zh')) document.getElementById('s-name-zh').value = data.name;
    if (data.category && document.getElementById('s-type-zh')) document.getElementById('s-type-zh').value = data.category;
    if (data.address && document.getElementById('s-addr-zh')) document.getElementById('s-addr-zh').value = data.address;
    alert("表單自動填寫成功！");
  } catch (e) {
    alert("無法解析 JSON，或表單不存在。");
  }
};

let messageIdCounter = 0;

function escapeHtml(text) {
  var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function appendMessage(role, text) {
  var container = document.getElementById('ai-messages');
  if (!container) return;
  var msgDiv = document.createElement('div');
  msgDiv.className = 'ai-msg ' + role;
  
  if (role === 'bot') {
    var formattedText = text.replace(/```json\n([\s\S]*?)```/g, function(match, p1) {
      var id = 'json-block-' + (messageIdCounter++);
      return '<div class="json-container"><div class="json-actions"><button onclick="window.copyToClipboard(\'' + id + '\', this)">複製 JSON</button><button class="btn-green" onclick="window.autofillForm(\'' + id + '\')">自動填寫表單</button></div><pre id="' + id + '"><code>' + escapeHtml(p1) + '</code></pre></div>';
    });
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    msgDiv.innerHTML = formattedText;
  } else {
    msgDiv.textContent = text;
  }
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

function showTypingIndicator() {
  var container = document.getElementById('ai-messages');
  if (!container) return;
  var div = document.createElement('div');
  div.id = 'ai-typing-indicator';
  div.className = 'ai-typing';
  div.innerHTML = '<span></span><span></span><span></span>';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
  var el = document.getElementById('ai-typing-indicator');
  if (el) el.remove();
}

async function sendAIMessage() {
  var inputEl = document.getElementById('ai-input');
  var text = inputEl.value.trim();
  if (!text) return;
  var key = localStorage.getItem('gemini_api_key');
  if (!key) {
    alert("請先在上方設定 API Key");
    document.getElementById('ai-settings').classList.add('show');
    return;
  }
  var model = localStorage.getItem('gemini_model') || 'gemini-1.5-flash';
  appendMessage('user', text);
  inputEl.value = '';
  showTypingIndicator();
  try {
    var response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: text }] }], generationConfig: { temperature: 0.7 } })
    });
    removeTypingIndicator();
    if (!response.ok) {
      var errText = await response.text();
      appendMessage('bot', "API 錯誤: " + response.status + " " + errText);
      return;
    }
    var data = await response.json();
    if (data.candidates && data.candidates.length > 0) appendMessage('bot', data.candidates[0].content.parts[0].text);
    else appendMessage('bot', "無法取得回應。");
  } catch (err) {
    removeTypingIndicator();
    appendMessage('bot', "網路錯誤：" + err.message);
  }
}

document.addEventListener('DOMContentLoaded', function() {
    var aiInput = document.getElementById('ai-input');
    if (aiInput) {
        aiInput.addEventListener('keypress', function(e) {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendAIMessage();
          }
        });
    }
});
