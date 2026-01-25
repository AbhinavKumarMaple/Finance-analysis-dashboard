# Password-Protected Excel Files - Important Information

## Issue

The free version of the xlsx library (SheetJS Community Edition) does **not support password-protected Excel files**. This is a limitation of the library, not the application.

## Solution: Remove Password Protection

To use your bank statement with this dashboard, you need to remove the password protection from the Excel file first.

### Steps to Remove Password in Excel:

#### Method 1: Using Microsoft Excel

1. Open your password-protected Excel file in Microsoft Excel
2. Enter the password when prompted
3. Go to **File** → **Info**
4. Click **Protect Workbook** → **Encrypt with Password**
5. **Delete the password** (leave the field empty)
6. Click **OK**
7. Save the file (**Ctrl+S** or **File** → **Save**)
8. Upload the unprotected file to the dashboard

#### Method 2: Using LibreOffice Calc (Free Alternative)

1. Open your password-protected Excel file in LibreOffice Calc
2. Enter the password when prompted
3. Go to **File** → **Save As**
4. Choose **Excel 2007-365 (.xlsx)** format
5. **Uncheck** "Save with password"
6. Click **Save**
7. Upload the unprotected file to the dashboard

#### Method 3: Save As New File

1. Open the password-protected file in Excel
2. Enter the password
3. Go to **File** → **Save As**
4. Choose a new location/name
5. In the **Tools** dropdown (bottom of save dialog), select **General Options**
6. **Delete** both "Password to open" and "Password to modify"
7. Click **OK** and then **Save**
8. Upload the new unprotected file

## Why This Limitation Exists

- **SheetJS Community Edition** (free, open-source) does not include password decryption
- **SheetJS Pro** (paid license, ~$500/year) includes password support
- This is a business decision by the library maintainers
- Alternative libraries with password support are either:
  - Not browser-compatible (require Node.js backend)
  - Have other limitations or licensing issues

## Privacy Note

Even after removing the password:

- **All data processing still happens locally in your browser**
- **No data is sent to any server**
- **Your financial information remains private**
- The password was only protecting the file on disk, not during processing

## Alternative Approach (Future Enhancement)

If you need to keep files password-protected, consider:

1. Using a backend service (requires server setup)
2. Upgrading to SheetJS Pro (requires paid license)
3. Using a different file format (CSV export from your bank)

## Current Workaround

**For now, please remove the password from your Excel file before uploading.**

The application will work perfectly with unprotected Excel files while maintaining complete privacy - all processing happens in your browser.
