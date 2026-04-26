const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

/**
 * 處理 GET 請求
 * 雖然程式碼放在 GitHub，但 GAS 仍可作為 API 端點
 */
function doGet(e) {
  return HtmlService.createHtmlOutput("API is running. Access via Frontend on GitHub.")
    .setTitle('永續商店地圖 API');
}

/**
 * 處理 POST 請求
 */
function doPost(e) {
  // 處理跨域預檢請求 (CORS)
  if (e === undefined) return; 
  
  let postData;
  try {
    postData = JSON.parse(e.postData.contents);
  } catch (err) {
    return createResponse({ status: 'error', message: 'Invalid JSON' });
  }
  
  const action = postData.action;
  const token = postData.token;
  
  // 記錄訪問 (Analytics)
  logVisit();

  try {
    // 免驗證的公開 Action
    if (action === 'login') return createResponse(login(postData.username, postData.password));
    if (action === 'getPublicData') return createResponse(getPublicData());
    if (action === 'getPublicPolicies') return createResponse(getPublicPolicies());
    if (action === 'subscribe') return createResponse(subscribe(postData.email));
    if (action === 'submitIssue') return createResponse(submitIssue(postData.message));

    // 需要驗證的 Action
    const session = validateToken(token);
    if (!session) return createResponse({ status: 'error', message: 'Unauthorized: Invalid or expired token' });

    // 角色權限檢查
    switch (action) {
      case 'getAnalyticsData':
        if (session.role !== 'admin') throw new Error('Permission denied');
        return createResponse(getAnalyticsData());
      case 'getUserProfile':
        return createResponse({ username: session.username, role: session.role });
      case 'sendRecommendation':
        if (session.role !== 'admin') throw new Error('Permission denied');
        return createResponse(sendRecommendation(postData.shopId));
      default:
        return createResponse({ status: 'error', message: 'Unknown action or permission denied' });
    }
  } catch (error) {
    return createResponse({ status: 'error', message: error.toString() });
  }
}
        return createResponse({ status: 'error', message: 'Unknown action: ' + action });
    }
  } catch (error) {
    return createResponse({ status: 'error', message: error.toString() });
  }
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 資料庫輔助函數
 */
function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // 初始化標頭
    if (name === 'Shops') {
      sheet.appendRow(['id', 'name_zh-TW', 'name_en', 'type_zh-TW', 'type_en', 'description_zh-TW', 'description_en', 'address_zh-TW', 'address_en', 'lat', 'lng', 'phone', 'website', 'badges']);
    } else if (name === 'Subscribers') {
      sheet.appendRow(['Email', 'Timestamp']);
    } else if (name === 'Issues') {
      sheet.appendRow(['Message', 'Timestamp']);
    } else if (name === 'Policies') {
      sheet.appendRow(['key', 'value']);
    } else if (name === 'Analytics') {
      sheet.appendRow(['Date', 'Channel', 'PV', 'UV', 'Duration', 'BounceRate']);
    } else if (name === 'Users') {
      sheet.appendRow(['username', 'password', 'role']);
      // 預設帳號
      sheet.appendRow(['admin', 'admin123', 'admin']);
      sheet.appendRow(['user', 'user123', 'user']);
    } else if (name === 'Sessions') {
      sheet.appendRow(['token', 'username', 'role', 'expiry']);
    }
  }
  return sheet;
}

function login(username, password) {
  const userSheet = getSheet('Users');
  const users = getRowsData(userSheet);
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    const token = Utilities.getUuid();
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24); // 24小時有效期
    
    const sessionSheet = getSheet('Sessions');
    sessionSheet.appendRow([token, user.username, user.role, expiry]);
    
    return { token: token, role: user.role, username: user.username };
  }
  throw new Error('帳號或密碼錯誤');
}

function validateToken(token) {
  if (!token) return null;
  const sessionSheet = getSheet('Sessions');
  const sessions = getRowsData(sessionSheet);
  const now = new Date();
  
  const session = sessions.find(s => s.token === token && new Date(s.expiry) > now);
  return session || null;
}

function sendRecommendation(shopId) {
  // 模擬發送電子報
  return { message: '推薦信已發送至所有訂閱者！店號: ' + shopId };
}

function getPublicPolicies() {
  const sheet = getSheet('Policies');
  return getRowsData(sheet);
}

/**
 * Analytics 相關
 */
function logVisit() {
  const sheet = getSheet('Analytics');
  const today = Utilities.formatDate(new Date(), "GMT+8", "MM月dd日");
  const channels = ['direct', 'search', 'social', 'external', 'ads'];
  const channel = channels[Math.floor(Math.random() * channels.length)];
  
  // 這裡簡單模擬：如果當天該渠道已存在則增加 PV，否則新增
  const data = sheet.getDataRange().getValues();
  let found = false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === today && data[i][1] === channel) {
      sheet.getRange(i + 1, 3).setValue(data[i][2] + 1);
      found = true;
      break;
    }
  }
  
  if (!found) {
    sheet.appendRow([today, channel, 1, 1, Math.floor(Math.random() * 200) + 50, Math.floor(Math.random() * 30) + 10]);
  }
}

function getAnalyticsData() {
  const sheet = getSheet('Analytics');
  const data = getRowsData(sheet);
  
  // 彙整 KPI
  let totalPV = 0;
  let totalUV = 0;
  let totalDuration = 0;
  let totalBounceRate = 0;
  
  data.forEach(row => {
    totalPV += Number(row.PV || 0);
    totalUV += Number(row.UV || 0);
    totalDuration += Number(row.Duration || 0);
    totalBounceRate += Number(row.BounceRate || 0);
  });
  
  const recordCount = data.length || 1;
  
  return {
    allData: data,
    kpi: {
      pv: totalPV,
      uv: totalUV,
      avgDuration: Math.floor(totalDuration / recordCount),
      avgBounceRate: (totalBounceRate / recordCount).toFixed(1),
      changes: {
        pv: 12.5, // 模擬值
        uv: 8.3,
        duration: -2.1,
        bounce: -1.5
      }
    }
  };
}

/**
 * 工具函數：將 Sheet 轉換為物件陣列
 */
function getRowsData(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }
  return rows;
}
