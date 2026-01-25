# Parser Module

This module handles the parsing and decryption of password-protected Excel bank statements.

## Overview

The parser module is responsible for:

1. **Decryption**: Validating and preparing encrypted Excel files for parsing
2. **Parsing**: Extracting transaction data from Excel sheets (to be implemented)
3. **Deduplication**: Removing duplicate transactions (to be implemented)
4. **Merging**: Combining multiple statements (to be implemented)

## Decryption (`decrypt.ts`)

### How It Works

Excel files can be in two formats:

- **Unencrypted (.xlsx)**: Standard ZIP format (PK header: `50 4B 03 04`)
- **Encrypted (.xlsx)**: OLE2 format (header: `D0 CF 11 E0`)

The decryption module validates the file format and prepares it for the xlsx library, which handles the actual decryption internally.

### Usage

```typescript
import { decryptExcel, isEncrypted, readFileAsArrayBuffer } from './decrypt';

// Read file
const file = /* File object from input */;
const buffer = await readFileAsArrayBuffer(file);

// Check if encrypted
if (isEncrypted(buffer)) {
  console.log('File is encrypted, password required');
}

// Prepare for parsing (validates format)
const decryptedBuffer = await decryptExcel(buffer, password);

// Pass to xlsx library for parsing
import * as XLSX from 'xlsx';
const workbook = XLSX.read(decryptedBuffer, {
  type: 'array',
  password: password // xlsx handles decryption
});
```

### Error Handling

The module throws `DecryptionError` with specific error codes:

| Error Code       | Description                | User Action                  |
| ---------------- | -------------------------- | ---------------------------- |
| `EMPTY_FILE`     | File is empty or corrupted | Upload a different file      |
| `NO_PASSWORD`    | Password not provided      | Enter password               |
| `CORRUPTED_FILE` | Invalid file format        | Upload a valid Excel file    |
| `READ_ERROR`     | Failed to read file        | Try again                    |
| `UNKNOWN_ERROR`  | Unexpected error           | Try again or contact support |

### Security Considerations

1. **Client-Side Only**: All decryption happens in the browser using the xlsx library
2. **No Network Requests**: File data never leaves the user's device
3. **Memory Management**: Large files are handled efficiently with ArrayBuffer
4. **Password Security**: Passwords are not stored or logged

## Integration with xlsx Library

The xlsx library (SheetJS) provides built-in support for encrypted Excel files:

```typescript
// The xlsx library handles Office Open XML encryption:
// - AES-128/192/256 encryption
// - SHA-1/256/512 key derivation
// - PKCS#5 padding

const workbook = XLSX.read(buffer, {
  type: "array",
  password: userPassword,
});
```

If the password is incorrect, xlsx will throw an error that should be caught and presented to the user with a retry option.

## Future Enhancements

- [ ] Support for other bank statement formats (CSV, PDF)
- [ ] Progress indicators for large files
- [ ] Batch file processing
- [ ] File format auto-detection
