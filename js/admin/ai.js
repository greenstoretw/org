// ===== admin/ai.js =====

// Load API Key on start
document.addEventListener('DOMContentLoaded', function() {
  var savedKey = localStorage.getItem('gemini_api_key');
  if (savedKey) {
    var keyInput = document.getElementById('gemini-api-key');
    if (keyInput) keyInput.value = savedKey;
  }
  
  var savedModel = localStorage.getItem('gemini_model');
  // Auto-fix: Ensure fallback to the most stable model name
  if (!savedModel || savedModel.indexOf('latest') !== -1) {
    savedModel = 'gemini-1.5-flash';
    localStorage.setItem('gemini_model', savedModel);
  }
  
  var modelInput = document.getElementById('gemini-model');
  if (modelInput) {
    modelInput.value = savedModel;
  }
  
  // Also listen for enter key on input
  var aiInput = document.getElementById('ai-input');
  if (aiInput) {
    aiInput.addEventListener('keypress', function (e) {
      if ((e.key === 'Enter' || e.keyCode === 13) && !e.shiftKey) {
        e.preventDefault();
        window.sendAiMessage();
      }
    });
  }
});


// RAG index — built once when shops load, reused per query
window.ragChunks = [];
window.rebuildRAGIndex = function() {
  if (window.RAG && window.adminAllShops && window.adminAllShops.length) {
    window.ragChunks = window.RAG.buildIndex(window.adminAllShops);
    console.log('RAG index: ' + window.ragChunks.length + ' chunks from ' + window.adminAllShops.length + ' shops');
  }
};
window.toggleAISidebar = function() {
  document.getElementById('ai-sidebar').classList.toggle('open');
};

window.saveApiKey = function(key) {
  localStorage.setItem('gemini_api_key', key.trim());
};

window.addMessageToUI = function(text, sender) {
  var msgDiv = document.createElement('div');
  msgDiv.className = 'ai-msg ' + sender;
  
  // Format JSON codeblocks into clickable buttons if it's from bot
  if (sender === 'bot' && text.indexOf('```json') !== -1) {
    var formattedText = text.replace(/```json([\s\S]*?)```/g, function(match, p1) {
      try {
        var data = JSON.parse(p1);
        var dataStr = encodeURIComponent(JSON.stringify(data));
        return '<pre><code>' + p1 + '</code></pre>' +
               '<button class="btn btn-green btn-sm mt-2" onclick="window.fillShopForm(\'' + dataStr + '\')">使用此資料帶入表單</button>';
      } catch (e) {
        return '<pre><code>' + p1 + '</code></pre>';
      }
    });
    // Replace markdown bold
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    msgDiv.innerHTML = formattedText;
  } else {
    // Basic text to HTML conversion
    var safeText = text.replace(/[&<>"']/g, function(m) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[m];
    });
    msgDiv.innerHTML = safeText.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }
  
  var container = document.getElementById('ai-messages');
  if (container) {
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
  }
};

// Expose a function to be called from the shop list
window.verifyShopWithAI = function(shopId) {
  var s = null;
  for (var i = 0; i < window.adminAllShops.length; i++) {
    if (window.adminAllShops[i].id === shopId) {
      s = window.adminAllShops[i];
      break;
    }
  }
  if (!s) return;
  
  window.toggleAISidebar();
  
  var name = (s.name && s.name['zh-TW']) || '';
  var addr = (s.address && s.address['zh-TW']) || '';
  
  var query = '請查核這間商店是否還在營業，並提供最新的營業時間、電話及官方網站。\n商店名稱：' + name + '\n地址：' + addr;
  document.getElementById('ai-input').value = query;
};

window.sendAiMessage = function() {
  var inputEl = document.getElementById('ai-input');
  var btn = document.getElementById('ai-send-btn');
  var text = inputEl.value.trim();
  var apiKey = localStorage.getItem('gemini_api_key');
  
  if (!text) return;
  if (!apiKey) {
    alert("請先點擊齒輪圖示設定 Gemini API Key！");
    document.getElementById('ai-settings').classList.add('show');
    return;
  }
  
  inputEl.value = '';
  window.addMessageToUI(text, 'user');
  
  btn.disabled = true;
  var originalHtml = btn.innerHTML;
  btn.innerHTML = '正在分析...';
  
  var systemPrompt = "你是一個協助永續商店地圖管理員的 AI 助手。\n你的任務是：\n1. 透過 Google 搜尋查核商店的真實性、營業時間、電話及網站。\n2. 若使用者希望新增或修改商店資料，請輸出一個純 JSON 格式的代碼區塊 (markdown ```json )。\nJSON 必須包含以下欄位（若查回資料請留空字串）：\n{\n  \"name_zh\": \"商店中文名\",\n  \"address_zh\": \"中文地址\",\n  \"phone\": \"電話\",\n  \"website\": \"網址\",\n  \"opening_hours\": \"營業時間\",\n  \"eco_features\": \"減塑包裝|在地食材|無毒認證 (請用 | 分隔)\"\n}\n請確保你的回答具有參考價值且格式正確。";

  var selectedModel = localStorage.getItem('gemini_model') || 'gemini-1.5-flash';
  
var ragContext = '';
  if (window.RAG && window.ragChunks && window.ragChunks.length) {
    var hits = window.RAG.search(window.ragChunks, text, 5);
    if (hits.length) ragContext = '以下是資料庫中的相關店家資訊:\n' + window.RAG.toContext(hits);
  }

  fetch('https://generativelanguage.googleapis.com/v1beta/models/' + selectedModel + ':generateContent?key=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: ragContext + '\n\n用戶問題: ' + text }] }],
      systemInstruction: { role: "user", parts: [{ text: systemPrompt }] },
      tools: [{ googleSearch: {} }]
    })
  })
  .then(function(response) { 
    if (response.status === 429) {
      throw new Error("額度已耗盡 (Quota Exceeded)。免費版 API 每分鐘有限制，請稍候再試，或更換較穩定的模型 (如 gemini-1.5-flash)。");
    }
    return response.json(); 
  })
  .then(function(data) {
    if (data.error) {
      if (data.error.code === 429) {
        throw new Error("額度已耗盡 (Quota Exceeded)。請稍候 60 秒再試。");
      }
      throw new Error(data.error.message);
    }
    
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      window.addMessageToUI(data.candidates[0].content.parts[0].text, 'bot');
    } else {
      window.addMessageToUI("抱歉，我無法產生回應。", 'bot');
    }
  })
  .catch(function(err) {
    console.error(err);
    window.addMessageToUI('<span style="color:red">發生錯誤：' + err.message + '</span>', 'bot');
  })
  .finally(function() {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  });
};

window.fillShopForm = function(encodedJsonStr) {
  try {
    var data = JSON.parse(decodeURIComponent(encodedJsonStr));
    
    if (!document.getElementById('shop-modal').classList.contains('open')) {
       window.openShopModal();
    }
    
    if(data.name_zh) document.getElementById('s-name-zh').value = data.name_zh;
    if(data.address_zh) document.getElementById('s-addr-zh').value = data.address_zh;
    if(data.phone) document.getElementById('s-phone').value = data.phone;
    if(data.website) document.getElementById('s-website').value = data.website;
    if(data.opening_hours) document.getElementById('s-hours').value = data.opening_hours;
    if(data.eco_features) document.getElementById('s-eco').value = data.eco_features.replace(/\|/g, ',');
    
    alert('已成功將 AI 分析的資料帶入表單！');
    
  } catch(e) {
    console.error(e);
    alert('無法解析資料');
  }
};
