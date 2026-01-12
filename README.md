# 💎 Elkheta Golden Validator

A powerful Google Apps Script tool for validating and verifying customer orders against the Elkheta API. It provides real-time order validation directly within Google Sheets with visual status indicators.

---

## 📋 Overview

**Elkheta Golden Validator** automates the process of verifying customer phone numbers, products, and prices against Elkheta's order database. It:

- Searches orders by phone number via API
- Matches products and prices with intelligent prioritization
- Displays validation results with color-coded status indicators
- Handles authentication automatically

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **Real-time Validation** | Validates orders instantly when data is entered |
| 🎯 **Smart Matching** | Prioritizes matches based on order status and expiration date |
| 🎨 **Visual Indicators** | Color-coded results (Green=Match, Red=Error, Yellow=Warning) |
| 🔐 **Auto Authentication** | Automatically re-authenticates when session expires |
| ⚡ **Batch Processing** | Handles multiple rows simultaneously |
| 📱 **Phone Formatting** | Auto-corrects 10-digit numbers missing leading zero |

---

## 🥇 Matching Priority Logic

The validator uses a "Golden Priority" system to find the best matching order:

| Priority | Criteria | Badge |
|----------|----------|-------|
| 1st | Completed + Has Expiration Date | 🥇 BEST |
| 2nd | Completed (any) | 🥈 Good |
| 3rd | Pending/Processing | 🥉 Active |
| 4th | Canceled/Failed | ⚠️ Fallback |

---

## 📊 Sheet Structure

### Main Sheet (`Live_Search`)

| Column | Content | Description |
|--------|---------|-------------|
| A | Phone | Customer phone number |
| B | Product | Product name to verify |
| C | Price | Expected price |
| D | Result | ✅ MATCH / ❌ Error status |
| E | API Product | Product from API |
| F | API Price | Price from API |
| G | Status | Order status |
| H | Exp Date | Expiration date |
| I | Payment | Payment method |
| J | Created By | Order creator |

### Config Sheet (`Config`)

| Row | Key | Value |
|-----|-----|-------|
| 2 | email | Elkheta admin email |
| 3 | password | Elkheta admin password |
| 4 | cookie | Session cookie (auto-filled) |
| 5 | x_csrf_token | CSRF token (auto-filled) |

---

## 🛠️ Installation

### 1. Create Google Sheet
Create a new Google Spreadsheet with two sheets:
- `Live_Search` - Main data sheet
- `Config` - Configuration sheet

### 2. Add Script
1. Open your Google Sheet
2. Go to **Extensions** → **Apps Script**
3. Delete any existing code
4. Paste the contents of `elkheta-valaditor.gs`
5. Save the project (Ctrl+S)

### 3. Setup Trigger
1. In Apps Script, click ⏰ **Triggers** (left sidebar)
2. Click **+ Add Trigger**
3. Configure:
   - Function: `onEditTrigger`
   - Event source: `From spreadsheet`
   - Event type: `On edit`
4. Click **Save**

### 4. Configure Credentials
In the `Config` sheet:
1. Cell A2: `email` → B2: Your Elkheta admin email
2. Cell A3: `password` → B3: Your Elkheta admin password

---

## 🚀 Usage

1. Open the `Live_Search` sheet
2. Enter data starting from row 2:
   - **Column A**: Customer phone number (e.g., `01012345678`)
   - **Column B**: Product name to verify
   - **Column C**: Expected price
3. Results appear automatically in columns D-J

---

## 🎨 Status Indicators

| Status | Color | Meaning |
|--------|-------|---------|
| ✅ MATCH | 🟢 Green | Product and price verified |
| ⛔ Not Found | 🔴 Red | Phone number not in system |
| ❌ Diff Product | 🔴 Red | Product name mismatch |
| ❌ Diff Price | 🔴 Red | Price mismatch |
| ⚠️ Enter Product | 🟡 Yellow | Product column empty |
| ⚠️ Enter Price | 🟡 Yellow | Price column empty |
| ❌ Login Failed | 🔴 Red | Authentication error |

---

## 🔧 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Google Sheets                             │
│  ┌─────────────┐    ┌─────────────┐                         │
│  │ Live_Search │    │   Config    │                         │
│  │   (Data)    │    │  (Auth)     │                         │
│  └──────┬──────┘    └──────┬──────┘                         │
└─────────┼──────────────────┼────────────────────────────────┘
          │                  │
          ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   Apps Script Engine                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  onEditTrigger()                     │    │
│  │  • Detects cell edits in columns A-C               │    │
│  │  • Coordinates validation workflow                  │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐    │
│  │                  AuthService                         │    │
│  │  • getConfig(): Reads credentials                   │    │
│  │  • ensureAuth(): Validates session                  │    │
│  │  • performAutoLogin(): Re-authenticates             │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐    │
│  │                MatcherService                        │    │
│  │  • findBestMatch(): Golden priority matching        │    │
│  │  • parseResource(): Extracts order fields           │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Elkheta API                               │
│  • GET /nova-api/orders?search={phone}                      │
│  • POST /admin/login                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
elkheta-valaditor/
├── elkheta-valaditor.gs   # Main Google Apps Script
└── README.md              # This documentation
```

---

## 🔐 Security Notes

> [!IMPORTANT]
> - Store credentials only in the `Config` sheet
> - The script auto-manages session tokens
> - Never share your spreadsheet publicly
> - Consider using Google Apps Script Properties for sensitive data

---

## 📝 Code Breakdown

### CONFIG Object (Lines 14-36)
Centralized configuration for sheet names, column indices, API URLs, and UI colors.

### onEditTrigger (Lines 41-190)
Main entry point that:
- Detects edits in the main sheet
- Shows "Waiting ⏳" status during API calls
- Batches API requests using `UrlFetchApp.fetchAll()`
- Applies color formatting based on results

### MatcherService (Lines 195-255)
Handles order matching logic:
- `findBestMatch()`: Implements the golden priority algorithm
- `parseResource()`: Extracts and normalizes API response fields

### AuthService (Lines 260-311)
Manages authentication:
- `getConfig()`: Reads credentials from Config sheet
- `ensureAuth()`: Checks if session is valid
- `performAutoLogin()`: Performs form-based login with CSRF handling

---

## 📄 License

This project is private and intended for internal use with Elkheta.

---

## 👤 Author

**Elkheta Team**

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Login Failed" | Check email/password in Config sheet |
| No results | Verify phone number format (11 digits) |
| Slow response | API may be rate-limited; wait and retry |
| Trigger not working | Re-authorize the script in Apps Script |
