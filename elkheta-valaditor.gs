
  💎 ELKHETA GOLDEN VALIDATOR (Final Version)
  =======================================================
  Logic Priority
  1. Completed + Date (🥇 BEST)
  2. Completed + No Date (🥈 Good)
  3. PendingProcessing (🥉 Active)
  4. CanceledFailed (Bad)
 

 ====================================================
 ⚙️ 1. CONFIGURATION
 ====================================================
const CONFIG = {
  SHEETS {
    MAIN Live_Search,
    CONFIG Config
  },
  COLS {
    PHONE 1,       A
    PRODUCT 2,     B
    PRICE 3,       C
    RESULT 4,      D
    DATA_START 5   E
  },
  URLS {
    API_SEARCH httpswww.elkheta.orgnova-apiorderssearch=,
    LOGIN httpswww.elkheta.orgadminlogin
  },
  UI {
    MATCH_COLOR #d9ead3, MATCH_TEXT #38761d,  Green
    ERROR_COLOR #f4cccc, ERROR_TEXT #cc0000,  Red
    WARN_COLOR #fff2cc,  WARN_TEXT #bf9000,   Yellow
    LOADING_TEXT Waiting ⏳,
  }
};

 ====================================================
 🚀 2. MAIN TRIGGER
 ====================================================
function onEditTrigger(e) {
  const sheet = e.source.getActiveSheet();
  if (sheet.getName() !== CONFIG.SHEETS.MAIN) return;

  const range = e.range;
  const startRow = range.getRow();
  const startCol = range.getColumn();
  const numRows = range.getNumRows();

  if (startRow  2  startCol  3) return;

  const inputData = sheet.getRange(startRow, 1, numRows, 3).getValues();
  
  let requests = [];
  let loadingOutput = [];
  let finalOutput = [];
  let backgrounds = [];
  let fontColors = [];
  let fontWeights = [];

   Phase 1 Show Waiting
  for (let i = 0; i  numRows; i++) {
    let phoneInput = String(inputData[i][0]).trim();
    const productInput = String(inputData[i][1]).trim();
    const priceInput = String(inputData[i][2]).trim();

    if (!phoneInput) {
      loadingOutput.push([, , , , , , ]);
      continue;
    }

    if (phoneInput.length === 10 && !phoneInput.startsWith(0)) phoneInput = 0 + phoneInput;
    
    loadingOutput.push([CONFIG.UI.LOADING_TEXT, ..., ..., ..., ..., ..., ...]);

    const timestamp = new Date().getTime();
    requests.push({
      url `${CONFIG.URLS.API_SEARCH}${phoneInput}&perPage=25&page=1&_t=${timestamp}`,
      method get,
      muteHttpExceptions true,
      userData { index i, phone phoneInput, userProd productInput, userPrice priceInput }
    });
  }

  if (loadingOutput.length  0) {
    sheet.getRange(startRow, CONFIG.COLS.RESULT, loadingOutput.length, 7).setValues(loadingOutput);
    SpreadsheetApp.flush(); 
  }

   Phase 2 Fetch
  if (requests.length  0) {
    if (!AuthService.ensureAuth(requests[0].userData.phone)) {
       finalOutput = new Array(numRows).fill([❌ Login Failed, ---, ---, ---, ---, ---, ---]);
       backgrounds = new Array(numRows).fill(new Array(7).fill(CONFIG.UI.ERROR_COLOR));
    } else {
      const config = AuthService.getConfig();
      const headers = { 'cookie' config['cookie'], 'x-csrf-token' config['x_csrf_token'], 'x-requested-with' 'XMLHttpRequest' };
      requests.forEach(r = r.headers = headers);

      try {
        const responses = UrlFetchApp.fetchAll(requests);
        
        finalOutput = new Array(numRows);
        backgrounds = new Array(numRows);
        fontColors = new Array(numRows);
        fontWeights = new Array(numRows);

        responses.forEach((resp, idx) = {
          const req = requests[idx];
          const rowIndex = req.userData.index;
          let apiResult = { found false, apiData null };

          if (resp.getResponseCode() === 200) {
            const apiJson = JSON.parse(resp.getContentText()).resources  [];
            if (apiJson.length  0) {
              const cleanPrice = parseFloat(req.userData.userPrice.replace([^0-9.]g, ))  0;
              apiResult = MatcherService.findBestMatch(apiJson, req.userData.userProd, cleanPrice);
            }
          }

          let statusText = , bg = null, fc = null;
          let rowData = [];

          if (!apiResult.found) {
            statusText = ⛔ Not Found;
            bg = CONFIG.UI.ERROR_COLOR; fc = CONFIG.UI.ERROR_TEXT;
            rowData = [---, ---, ---, ---, ---, ---];
          } else {
            const uProd = req.userData.userProd;
            const uPrice = req.userData.userPrice;

            if (!uProd && !uPrice) {
               statusText = ⚠️ Need Details; bg = CONFIG.UI.WARN_COLOR; fc = CONFIG.UI.WARN_TEXT;
            } else if (!uProd) {
               statusText = ⚠️ Enter Product; bg = CONFIG.UI.WARN_COLOR; fc = CONFIG.UI.WARN_TEXT;
            } else if (!uPrice) {
               statusText = ⚠️ Enter Price; bg = CONFIG.UI.WARN_COLOR; fc = CONFIG.UI.WARN_TEXT;
            } else {
               if (apiResult.isMatch) {
                 statusText = ✅ MATCH;
                 bg = CONFIG.UI.MATCH_COLOR; fc = CONFIG.UI.MATCH_TEXT;
               } else {
                 statusText = ❌  + apiResult.reason;
                 bg = CONFIG.UI.ERROR_COLOR; fc = CONFIG.UI.ERROR_TEXT;
               }
            }

            if (apiResult.apiData) {
              rowData = [
                apiResult.apiData.product,
                apiResult.apiData.price,
                apiResult.apiData.status,
                apiResult.apiData.expDate,
                apiResult.apiData.paymentMethod,
                apiResult.apiData.createdBy
              ];
            } else {
              rowData = [---, ---, ---, ---, ---, ---];
            }
          }

          finalOutput[rowIndex] = [statusText, ...rowData];
          backgrounds[rowIndex] = [bg, ...new Array(6).fill(#ffffff)];
          fontColors[rowIndex] = [fc, ...new Array(6).fill(#000000)];
          fontWeights[rowIndex] = [bold, ...new Array(6).fill(normal)];
        });

         Fill blanks
        for (let i = 0; i  numRows; i++) {
           if (!finalOutput[i]) {
             finalOutput[i] = [, , , , , , ];
             backgrounds[i] = new Array(7).fill(#ffffff);
             fontColors[i] = new Array(7).fill(#000000);
             fontWeights[i] = new Array(7).fill(normal);
           }
        }

      } catch (e) { Logger.log(e); }
    }
  } else {
    finalOutput = new Array(numRows).fill([, , , , , , ]);
    backgrounds = new Array(numRows).fill(new Array(7).fill(#ffffff));
    fontColors = new Array(numRows).fill(new Array(7).fill(#000000));
    fontWeights = new Array(numRows).fill(new Array(7).fill(normal));
  }

  const outputRange = sheet.getRange(startRow, CONFIG.COLS.RESULT, numRows, 7);
  outputRange.setValues(finalOutput);
  outputRange.setBackgrounds(backgrounds).setFontColors(fontColors).setFontWeights(fontWeights);
}

 ====================================================
 ⚖️ 3. MATCHER SERVICE (GOLDEN PRIORITY)
 ====================================================
const MatcherService = {
  findBestMatch function(resources, userProduct, userPrice) {
    let candidates = [];
    let bestFallback = null;

    for (let r = 0; r  resources.length; r++) {
      const current = this.parseResource(resources[r]);
      
      const isProdMatch = current.product.toLowerCase().includes(userProduct.toLowerCase());
      const isPriceMatch = (current.price === userPrice);

      if (isProdMatch && isPriceMatch) {
        candidates.push(current);
      }

      if (isProdMatch && !bestFallback) bestFallback = current;
      if (!bestFallback) bestFallback = current;
    }

    if (candidates.length  0) {
       🥇 Priority 1 Completed + Has Date (Not '---')
      let winner = candidates.find(o = o.status === 'completed' && o.expDate !== '---' && o.expDate.length  5);
      
       🥈 Priority 2 Completed (Even if no date)
      if (!winner) winner = candidates.find(o = o.status === 'completed');
      
       🥉 Priority 3 PendingProcessing
      if (!winner) winner = candidates.find(o = o.status === 'pending'  o.status === 'processing');
      
       4️⃣ Last Resort CanceledFailed (First available)
      if (!winner) winner = candidates[0];

      return { found true, isMatch true, reason Perfect, apiData winner };
    }

    let reason = Mismatch;
    if (bestFallback && userProduct) {
      if (!bestFallback.product.toLowerCase().includes(userProduct.toLowerCase())) reason = Diff Product;
      else if (bestFallback.price !== userPrice) reason = Diff Price;
    }

    return { found true, isMatch false, reason reason, apiData bestFallback };
  },

  parseResource function(resource) {
    const fields = resource.fields  [];
    const map = {};
    fields.forEach(f = {
      if (f.name) map[f.name] = f.value;
      if (f.attribute) map[f.attribute] = f.value;
    });
    return {
      product String(map['Product Name']  ).replace([^]g, ).trim(),
      price parseFloat(map['Order Value']),
      status String(map['status']).toLowerCase(),
      expDate map['Expiration Course Date']  ---,
      paymentMethod map['Payment Method'],
      createdBy map['Created By']
    };
  }
};

 ====================================================
 🔐 4. AUTH SERVICE
 ====================================================
const AuthService = {
  getConfig function() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.CONFIG);
    if (!sheet) return {};
    const data = sheet.getRange(A2B6).getValues();
    const config = {};
    data.forEach(r = config[r[0]] = r[1]);
    return config;
  },
  ensureAuth function(testPhone) {
    const config = this.getConfig();
    if (!config['cookie']) return this.performAutoLogin();
    const headers = {'cookie' config['cookie'], 'x-csrf-token' config['x_csrf_token'], 'x-requested-with' 'XMLHttpRequest'};
    try {
      const timestamp = new Date().getTime();
      const probeUrl = `${CONFIG.URLS.API_SEARCH}${testPhone}&_t=${timestamp}`;
      const resp = UrlFetchApp.fetch(probeUrl, {'headers' headers, 'muteHttpExceptions' true});
      if (resp.getResponseCode() === 401  resp.getResponseCode() === 419) return this.performAutoLogin();
      return true;
    } catch (e) { return false; }
  },
  performAutoLogin function() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.getSheetByName(CONFIG.SHEETS.CONFIG);
    const email = configSheet.getRange(B2).getValue();
    const password = configSheet.getRange(B3).getValue();
    if (!email  !password) return false;
    const ua = 'Mozilla5.0 (Windows NT 10.0; Win64; x64) Chrome120.0.0.0';
    try {
      const r1 = UrlFetchApp.fetch(CONFIG.URLS.LOGIN, {'muteHttpExceptions' true, 'headers' {'User-Agent' ua}});
      const html = r1.getContentText();
      const tokenMatch = html.match(meta name=csrf-token content=([^]+))  html.match(name=_token value=([^]+));
      const token = tokenMatch  tokenMatch[1]  null;
      if (!token) return false;
      const cookies1 = this.extractCookies(r1.getAllHeaders());
      const payload = { 'email' email, 'password' password, '_token' token, 'remember' 'on' };
      const r2 = UrlFetchApp.fetch(CONFIG.URLS.LOGIN, { 'method' 'post', 'payload' payload, 'headers' { 'Cookie' cookies1, 'User-Agent' ua, 'Referer' CONFIG.URLS.LOGIN, 'Content-Type' 'applicationx-www-form-urlencoded' }, 'followRedirects' false, 'muteHttpExceptions' true });
      if (r2.getResponseCode() === 302  r2.getResponseCode() === 200) {
        const cookies2 = this.extractCookies(r2.getAllHeaders());
        configSheet.getRange(B4).setValue(cookies1 + ;  + cookies2);
        configSheet.getRange(B5).setValue(token);
        return true;
      }
    } catch (e) { Logger.log(Login Error  + e); }
    return false;
  },
  extractCookies function(headers) {
    const c = headers['Set-Cookie'];
    if (!c) return ;
    return Array.isArray(c)  c.map(x = x.split(';')[0]).join('; ')  c.split(';')[0];
  }
};