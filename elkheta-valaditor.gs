/**
 * 💎 ELKHETA HYBRID TURBO (The Fastest Version)
 * =======================================================
 * 🚀 Speed: Reads cookies from Sheet (Instant Access).
 * 🔐 Security: Password is hidden in Code (Not in sheet).
 * 📅 Date: Clean "7 Feb 2026".
 * 🎯 Match: Exact String Match.
 */

// ====================================================
// ⚙️ 1. CONFIGURATION
// ====================================================
const CONFIG = {
  // 👇 اكتب بياناتك هنا
  CREDENTIALS: {
    EMAIL: "acteam4.14@gmail.com",    // 👈 إيميلك
    PASSWORD: "h1A097<G0Jp-"        // 👈 باسووردك
  },

  SHEETS: {
    MAIN: "Live_Search",
    CONFIG: "Config" // ⚠️ لازم تنشئ الشيت ده وتسيبه فاضي
  },
  COLS: {
    PHONE: 1,      // Input
    PRODUCT: 5,    // Input
    PRICE: 6,      // Input
    RESULT: 7,     // Output Start
  },
  URLS: {
    API_SEARCH: "https://www.elkheta.org/nova-api/orders?search=",
    LOGIN: "https://www.elkheta.org/admin/login"
  },
  UI: {
    MATCH_COLOR: "#d9ead3", MATCH_TEXT: "#38761d",
    ERROR_COLOR: "#f4cccc", ERROR_TEXT: "#cc0000",
    WARN_COLOR: "#fff2cc",  WARN_TEXT: "#bf9000",
    LOADING_TEXT: "Waiting ⏳",
  }
};

// ====================================================
// 🚀 2. MAIN TRIGGER
// ====================================================
function onEditTrigger(e) {
  const sheet = e.source.getActiveSheet();
  if (sheet.getName() !== CONFIG.SHEETS.MAIN) return;

  const range = e.range;
  const startRow = range.getRow();
  const startCol = range.getColumn();
  const numRows = range.getNumRows();
  const lastCol = range.getLastColumn();

  if (startRow < 2) return;

  const inputs = [CONFIG.COLS.PHONE, CONFIG.COLS.PRODUCT, CONFIG.COLS.PRICE];
  const isInputAffected = inputs.some(col => col >= startCol && col <= lastCol);
  if (!isInputAffected) return;

  const maxColNeeded = Math.max(CONFIG.COLS.PHONE, CONFIG.COLS.PRODUCT, CONFIG.COLS.PRICE);
  const inputData = sheet.getRange(startRow, 1, numRows, maxColNeeded).getValues();
  
  let requests = [];
  let loadingOutput = [];
  let finalOutput = [];
  let backgrounds = [];
  let fontColors = [];
  let fontWeights = [];

  for (let i = 0; i < numRows; i++) {
    let phoneInput = String(inputData[i][CONFIG.COLS.PHONE - 1] || "").trim();
    const productInput = String(inputData[i][CONFIG.COLS.PRODUCT - 1] || "").trim();
    const priceInput = String(inputData[i][CONFIG.COLS.PRICE - 1] || "").trim();

    if (!phoneInput) {
      loadingOutput.push(new Array(9).fill(""));
      continue;
    }

    if (phoneInput.length === 10 && !phoneInput.startsWith("0")) phoneInput = "0" + phoneInput;
    
    loadingOutput.push([CONFIG.UI.LOADING_TEXT, ...new Array(8).fill("...")]);

    const timestamp = new Date().getTime();
    requests.push({
      url: `${CONFIG.URLS.API_SEARCH}${phoneInput}&perPage=25&page=1&_t=${timestamp}`,
      method: "get",
      muteHttpExceptions: true,
      userData: { index: i, phone: phoneInput, userProd: productInput, userPrice: priceInput }
    });
  }

  if (loadingOutput.length > 0) {
    sheet.getRange(startRow, CONFIG.COLS.RESULT, loadingOutput.length, 9).setValues(loadingOutput);
    SpreadsheetApp.flush(); 
  }

  if (requests.length > 0) {
    // ⚡ قراءة الكوكيز من الشيت (أسرع حاجة في الكون)
    let session = AuthService.getSession();
    let headers = { 'cookie': session.cookie, 'x-csrf-token': session.token, 'x-requested-with': 'XMLHttpRequest' };
    requests.forEach(r => r.headers = headers);

    try {
      let responses = UrlFetchApp.fetchAll(requests);
      const needsLogin = responses.some(r => r.getResponseCode() === 401 || r.getResponseCode() === 419);

      if (needsLogin) {
        // لو باظت، ادخل بالباسورد اللي في الكود
        if (AuthService.performAutoLogin()) {
           session = AuthService.getSession();
           headers = { 'cookie': session.cookie, 'x-csrf-token': session.token, 'x-requested-with': 'XMLHttpRequest' };
           requests.forEach(r => r.headers = headers);
           responses = UrlFetchApp.fetchAll(requests);
        } else {
           finalOutput = new Array(numRows).fill(["❌ Login Failed", ...new Array(8).fill("---")]);
           backgrounds = new Array(numRows).fill(new Array(9).fill(CONFIG.UI.ERROR_COLOR));
        }
      }

      if (!finalOutput.length) { 
        finalOutput = new Array(numRows);
        backgrounds = new Array(numRows);
        fontColors = new Array(numRows);
        fontWeights = new Array(numRows);

        responses.forEach((resp, idx) => {
          const req = requests[idx];
          const rowIndex = req.userData.index;
          let apiResult = { found: false, apiData: null };

          if (resp.getResponseCode() === 200) {
            const apiJson = JSON.parse(resp.getContentText()).resources || [];
            if (apiJson.length > 0) {
              const cleanPrice = parseFloat(req.userData.userPrice.replace(/[^0-9.]/g, "")) || 0;
              apiResult = MatcherService.findBestMatch(apiJson, req.userData.userProd, cleanPrice);
            }
          }

          let statusText = "", bg = null, fc = null;
          let rowData = [];

          if (!apiResult.found) {
            statusText = "⛔ Not Found";
            bg = CONFIG.UI.ERROR_COLOR; fc = CONFIG.UI.ERROR_TEXT;
            rowData = new Array(8).fill("---");
          } else {
            const uProd = req.userData.userProd;
            const uPrice = req.userData.userPrice;

            if (!uProd && !uPrice) {
               statusText = "⚠️ Need Details"; bg = CONFIG.UI.WARN_COLOR; fc = CONFIG.UI.WARN_TEXT;
            } else if (!uProd) {
               statusText = "⚠️ Enter Product"; bg = CONFIG.UI.WARN_COLOR; fc = CONFIG.UI.WARN_TEXT;
            } else if (!uPrice) {
               statusText = "⚠️ Enter Price"; bg = CONFIG.UI.WARN_COLOR; fc = CONFIG.UI.WARN_TEXT;
            } else {
               if (apiResult.isMatch) {
                 statusText = "✅ MATCH";
                 bg = CONFIG.UI.MATCH_COLOR; fc = CONFIG.UI.MATCH_TEXT;
               } else {
                 statusText = "❌ " + apiResult.reason;
                 bg = CONFIG.UI.ERROR_COLOR; fc = CONFIG.UI.ERROR_TEXT;
               }
            }

            if (apiResult.apiData) {
              rowData = [
                apiResult.apiData.studentName,
                apiResult.apiData.studentPhone,
                apiResult.apiData.product,
                apiResult.apiData.price,
                apiResult.apiData.status,
                apiResult.apiData.expDate,
                apiResult.apiData.paymentMethod,
                apiResult.apiData.createdBy
              ];
            } else {
              rowData = new Array(8).fill("---");
            }
          }

          finalOutput[rowIndex] = [statusText, ...rowData];
          backgrounds[rowIndex] = [bg, ...new Array(8).fill("#ffffff")];
          fontColors[rowIndex] = [fc, ...new Array(8).fill("#000000")];
          fontWeights[rowIndex] = ["bold", ...new Array(8).fill("normal")];
        });
      }
      
      for (let i = 0; i < numRows; i++) {
          if (!finalOutput[i]) {
            finalOutput[i] = new Array(9).fill("");
            backgrounds[i] = new Array(9).fill("#ffffff");
            fontColors[i] = new Array(9).fill("#000000");
            fontWeights[i] = new Array(9).fill("normal");
          }
      }

    } catch (e) { Logger.log(e); }
  } else {
    finalOutput = new Array(numRows).fill(new Array(9).fill(""));
    backgrounds = new Array(numRows).fill(new Array(9).fill("#ffffff"));
    fontColors = new Array(numRows).fill(new Array(9).fill("#000000"));
    fontWeights = new Array(numRows).fill(new Array(9).fill("normal"));
  }

  const outputRange = sheet.getRange(startRow, CONFIG.COLS.RESULT, numRows, 9);
  outputRange.setValues(finalOutput);
  outputRange.setBackgrounds(backgrounds).setFontColors(fontColors).setFontWeights(fontWeights);
}

// ====================================================
// ⚖️ 3. MATCHER SERVICE (Genius Fuzzy Edition)
// ====================================================
const MatcherService = {
  findBestMatch: function(resources, userProduct, userPrice) {
    const targetName = userProduct ? userProduct.toLowerCase().trim() : "";
    
    let perfectMatches = [];   // 100% تطابق
    let smartMatches = [];     // 80%~99% تطابق (Smart Fuzzy)
    let anyCompleted = [];     // أي حاجة مدفوعة (للطوارئ)
    let allOthers = [];        

    for (let r = 0; r < resources.length; r++) {
      const current = this.parseResource(resources[r]);
      const currName = current.product.toLowerCase();

      // 1. Check Exact Match
      const isExactName = (currName === targetName);
      
      // 2. Check Fuzzy Match (Similarity > 80%)
      // بنحسب نسبة التشابه، لو فوق 0.8 (يعني 80%) يبقى هو ده
      const similarity = this.getSimilarity(currName, targetName);
      const isFuzzyName = similarity >= 0.80; 

      const isPrice = (current.price === userPrice);

      if (isExactName && isPrice) perfectMatches.push(current);
      else if (isFuzzyName) smartMatches.push({ ...current, _score: similarity }); // بنحفظ الاسكور عشان نختار الأعلى
      
      if (current.status === 'completed') anyCompleted.push(current);
      allOthers.push(current);
    }

    // --- ترتيب الأولويات ---

    // 🥇 1. Perfect Match (اسم وسعر)
    if (perfectMatches.length > 0) {
      return { found: true, isMatch: true, reason: "Perfect", apiData: this.pickBest(perfectMatches) };
    }

    // 🥈 2. Smart Match (الاسم فيه غلطة مطبعية بس عرفناه)
    if (smartMatches.length > 0) {
      // لو لقينا كذا واحد شبهه، بناخد "أكثر واحد شبهه" (أعلى سكور)
      smartMatches.sort((a, b) => b._score - a._score);
      // ولو كلهم نفس الشبه، نطبق المنطق الذهبي (completed/date)
      const bestFuzzy = this.pickBest(smartMatches);
      
      // هنا هنقوله Check Name عشان يعرف إن فيه غلطة صلحناها
      let reason = bestFuzzy.price === userPrice ? "Check Name" : "Diff Price";
      return { found: true, isMatch: false, reason: reason, apiData: bestFuzzy };
    }

    // 🥉 3. Fallback (لو مفيش أي تشابه، هات أي حاجة مدفوعة)
    if (anyCompleted.length > 0) {
      let reason = targetName ? "Diff Product" : "Best Order";
      return { found: true, isMatch: false, reason: reason, apiData: this.pickBest(anyCompleted) };
    }

    // 4. Last Resort
    return { found: true, isMatch: false, reason: "Not Found", apiData: allOthers[0] ? this.parseResource(resources[0]) : null };
  },

  // 👇 خوارزمية حساب نسبة التشابه (Levenshtein Distance)
  getSimilarity: function(s1, s2) {
    if (!s1 || !s2) return 0;
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    const longerLength = longer.length;
    if (longerLength === 0) return 1.0;
    
    // Calculate Edit Distance
    const costs = new Array();
    for (let i = 0; i <= longer.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= shorter.length; j++) {
        if (i == 0) costs[j] = j;
        else {
          if (j > 0) {
            let newValue = costs[j - 1];
            if (longer.charAt(i - 1) != shorter.charAt(j - 1)) newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0) costs[shorter.length] = lastValue;
    }
    
    const distance = costs[shorter.length];
    return (longerLength - distance) / longerLength;
  },

  pickBest: function(candidates) {
    if (!candidates || candidates.length === 0) return null;
    let winner = candidates.find(o => o.status === 'completed' && o.expDate !== '---');
    if (!winner) winner = candidates.find(o => o.status === 'completed');
    if (!winner) winner = candidates.find(o => o.status === 'pending' || o.status === 'processing');
    if (!winner) winner = candidates[0];
    return winner;
  },

  formatDate: function(rawStr) {
    if (!rawStr || rawStr === "---") return "---";
    try {
      const datePart = rawStr.split(',')[0].trim(); 
      const parts = datePart.split('/');
      if (parts.length !== 3) return rawStr;
      const day = parseInt(parts[0], 10);
      const monthNum = parseInt(parts[1], 10);
      const year = parts[2];
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${day} ${months[monthNum - 1]} ${year}`;
    } catch (e) { return rawStr; }
  },

  parseResource: function(resource) {
    const fields = resource.fields || [];
    const map = {};
    fields.forEach(f => {
      if (f.name) map[f.name] = f.value;
      if (f.attribute) map[f.attribute] = f.value;
    });
    const rawDate = map['Expiration Course Date'];
    const formattedDate = (rawDate && rawDate.length > 5) ? this.formatDate(rawDate) : "---";
    return {
      studentName: map['Student Name'] || "---",
      studentPhone: map['Student Phone Number'] || "---",
      product: String(map['Product Name'] || "").replace(/<[^>]*>/g, "").trim(),
      price: parseFloat(map['Order Value']),
      status: String(map['status']).toLowerCase(),
      expDate: formattedDate,
      paymentMethod: map['Payment Method'],
      createdBy: map['Created By']
    };
  }
};
// ====================================================
// 🔐 4. AUTH SERVICE (Hybrid: Code Pass, Sheet Cache)
// ====================================================
const AuthService = {
  // قراءة سريعة جداً من الشيت
  getSession: function() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.CONFIG);
    if (!sheet) return { cookie: '', token: '' };
    // بنقرا A1 و A2 (استخدام مخفي)
    const data = sheet.getRange("A1:A2").getValues();
    return { cookie: data[0][0], token: data[1][0] };
  },
  
  performAutoLogin: function() {
    const email = CONFIG.CREDENTIALS.EMAIL;
    const password = CONFIG.CREDENTIALS.PASSWORD;
    
    if (!email || !password) return false;

    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0';
    try {
      const r1 = UrlFetchApp.fetch(CONFIG.URLS.LOGIN, {'muteHttpExceptions': true, 'headers': {'User-Agent': ua}});
      const html = r1.getContentText();
      const tokenMatch = html.match(/<meta name="csrf-token" content="([^"]+)">/) || html.match(/name="_token" value="([^"]+)"/);
      const token = tokenMatch ? tokenMatch[1] : null;
      if (!token) return false;
      const cookies1 = this.extractCookies(r1.getAllHeaders());
      const payload = { 'email': email, 'password': password, '_token': token, 'remember': 'on' };
      const r2 = UrlFetchApp.fetch(CONFIG.URLS.LOGIN, { 'method': 'post', 'payload': payload, 'headers': { 'Cookie': cookies1, 'User-Agent': ua, 'Referer': CONFIG.URLS.LOGIN, 'Content-Type': 'application/x-www-form-urlencoded' }, 'followRedirects': false, 'muteHttpExceptions': true });
      if (r2.getResponseCode() === 302 || r2.getResponseCode() === 200) {
        const cookies2 = this.extractCookies(r2.getAllHeaders());
        
        // كتابة سريعة في الشيت
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.CONFIG);
        if(sheet) {
          sheet.getRange("A1").setValue(cookies1 + "; " + cookies2); 
          sheet.getRange("A2").setValue(token);
        }
        return true;
      }
    } catch (e) { Logger.log("Login Error: " + e); }
    return false;
  },
  extractCookies: function(headers) {
    const c = headers['Set-Cookie'];
    if (!c) return "";
    return Array.isArray(c) ? c.map(x => x.split(';')[0]).join('; ') : c.split(';')[0];
  }
};
