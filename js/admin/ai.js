// ===== admin/ai.js =====

// Load API Key on start
document.addEventListener('DOMContentLoaded', () => {
  const savedKey = localStorage.getItem('gemini_api_key');
  if (savedKey) {
    document.getElementById('gemini-api-key').value = savedKey;
  }
  
  let savedModel = localStorage.getItem('gemini_model');
  // Auto-fix: Ensure fallback to the most stable model name
  if (!savedModel || savedModel.includes('latest')) {
    savedModel = 'gemini-1.5-flash';
    localStorage.setItem('gemini_model', savedModel);
  }
  
  if (savedModel) {
    document.getElementById('gemini-model').value = savedModel;
  }
  
  // Also listen for enter key on input
  document.getElementById('ai-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAiMessage();
    }
  });
});

window.toggleAISidebar = function() {
  document.getElementById('ai-sidebar').classList.toggle('open');
};

window.saveApiKey = function(key) {
  localStorage.setItem('gemini_api_key', key.trim());
};

window.addMessageToUI = function(text, sender) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `ai-msg ${sender}`;
  
  // Format JSON codeblocks into clickable buttons if it's from bot
  if (sender === 'bot' && text.includes('```json')) {
    let formattedText = text.replace(/```json([\s\S]*?)```/g, function(match, p1) {
      try {
        const data = JSON.parse(p1);
        const dataStr = encodeURIComponent(JSON.stringify(data));
        return `
          <pre><code>${p1}</code></pre>
          <button class="btn btn-green btn-sm mt-2" onclick="fillShopForm('${dataStr}')">使用此資料帶入表單</button>
        `;
      } catch (e) {
        return `<pre><code>${p1}</code></pre>`;
      }
    });
    // Replace markdown bold
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    msgDiv.innerHTML = formattedText;
  } else {
    // Basic text to HTML conversion
    const safeText = text.replace(/[&<>"']/g, function(m) {
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
  
  const container = document.getElementById('ai-messages');
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
};

// Expose a function to be called from the shop list
window.verifyShopWithAI = function(shopId) {
  const shop = window.adminAllShops.find(s => s.id === shopId);
  if (!shop) return;
  
  window.toggleAISidebar();
  
  const name = shop.name?.['zh-TW'] || '';
  const addr = shop.address?.['zh-TW'] || '';
  
  const query = `請查核這間商店是否還在營業，並提供最新的營業時間、電話及官方網站。\n商店名稱：${name}\n地址：${addr}`;
  document.getElementById('ai-input').value = query;
  
  // Optional: Auto send
  // sendAiMessage();
};

window.sendAiMessage = async function() {
  const inputEl = document.getElementById('ai-input');
  const btn = document.getElementById('ai-send-btn');
  const text = inputEl.value.trim();
  const apiKey = localStorage.getItem('gemini_api_key');
  
  if (!text) return;
  if (!apiKey) {
    alert("請先點擊齒輪圖示設定 Gemini API Key！");
    document.getElementById('ai-settings').classList.add('show');
    return;
  }
  
  inputEl.value = '';
  window.addMessageToUI(text, 'user');
  
  btn.disabled = true;
  btn.innerHTML = '<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
  
  const systemPrompt = `
  你是一個協助永續商店地圖管理員的 AI 助手。
  你的任務是：
  1. 透過 Google 搜尋查核商店的真實性、營業時間、電話及網站。
  2. 若使用者希望新增或修改商店資料，請輸出一個純 JSON 格式的代碼區塊 (markdown \`\`\`json )。
  JSON 必須包含以下欄位（若查無資料請留空字串）：
  {
    "name_zh": "商店中文名",
    "address_zh": "中文地址",
    "phone": "電話",
    "website": "網址",
    "opening_hours": "營業時間",
    "eco_features": "減塑包裝|在地食材|無毒認證 (請用 | 分隔)"
  }
  請確保你的回答具有參考價值且格式正確。
  `;

  try {
    const selectedModel = localStorage.getItem('gemini_model') || 'gemini-1.5-flash';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: text }] }],
        systemInstruction: { role: "user", parts: [{ text: systemPrompt }] },
        tools: [{ googleSearch: {} }] // Enable Google Search grounding
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      window.addMessageToUI(data.candidates[0].content.parts[0].text, 'bot');
    } else {
      window.addMessageToUI("抱歉，我無法產生回應。", 'bot');
    }
    
  } catch (err) {
    console.error(err);
    window.addMessageToUI(`<span style="color:red">發生錯誤：${err.message}</span>`, 'bot');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '發送 <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>';
  }
};

window.fillShopForm = function(encodedJsonStr) {
  try {
    const data = JSON.parse(decodeURIComponent(encodedJsonStr));
    
    // Open modal if it's not open
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
