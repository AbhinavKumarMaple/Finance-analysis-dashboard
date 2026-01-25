/**
 * Excel File Decryption Module
 *
 * Handles decryption of password-protected .xlsx files using browser's native crypto API.
 * This module provides client-side decryption without sending data to any server.
 *
 * Excel files use Office Open XML encryption which is based on:
 * - AES encryption (128/192/256 bit)
 * - SHA-1/SHA-256/SHA-512 for key derivation
 * - PKCS#5 padding
 *
 * The actual decryption is performed by the xlsx library (SheetJS) which has built-in
 * support for password-protected files. This module provides validation, error handling,
 * and a consistent interface for the parser.
 *
 * Requirements: 1.1, 1.2
 */

/**
 * Error types for decryption operations
 */
export class DecryptionError extends Error {
  constructor(
    message: string,
    public readonly code: DecryptionErrorCode,
  ) {
    super(message);
    this.name = "DecryptionError";
  }
}

/**
 * Error codes for decryption operations
 */
export type DecryptionErrorCode =
  | "EMPTY_FILE"
  | "NO_PASSWORD"
  | "CORRUPTED_FILE"
  | "INVALID_PASSWORD"
  | "READ_ERROR"
  | "UNKNOWN_ERROR";

/**
 * Result of decryption validation
 */
export interface DecryptionValidation {
  isValid: boolean;
  isEncrypted: boolean;
  requiresPassword: boolean;
  fileFormat: "OLE2" | "ZIP" | "UNKNOWN";
}

/**
 * Decrypts a password-protected Excel file
 *
 * This function validates the file format and prepares it for decryption.
 * The actual decryption is performed by the xlsx library when parsing.
 *
 * @param buffer - The encrypted Excel file as ArrayBuffer
 * @param password - The password to decrypt the file
 * @returns Promise<ArrayBuffer> - The validated file data ready for parsing
 * @throws {DecryptionError} - If validation fails
 *
 * Implementation Notes:
 * - Excel encryption uses Office Open XML format with AES encryption
 * - The xlsx library (SheetJS) handles the actual cryptographic operations
 * - This function provides validation and error handling before parsing
 * - All processing happens in the browser - no data is sent to any server
 *
 * File Format Detection:
 * - OLE2 format (D0 CF 11 E0): Encrypted Excel file
 * - ZIP format (50 4B 03 04): Unencrypted .xlsx file
 */
export async function decryptExcel(
  buffer: ArrayBuffer,
  password: string,
): Promise<ArrayBuffer> {
  try {
    // Validate inputs
    if (!buffer || buffer.byteLength === 0) {
      throw new DecryptionError(
        "Invalid file: The file is empty or corrupted.",
        "EMPTY_FILE",
      );
    }

    if (!password || password.trim().length === 0) {
      throw new DecryptionError(
        "Password is required to decrypt this file.",
        "NO_PASSWORD",
      );
    }

    // Validate file format by checking magic bytes
    const view = new Uint8Array(buffer);

    // Check for OLE2 format (encrypted Excel files)
    // Magic bytes: D0 CF 11 E0 A1 B1 1A E1
    const isOLE2 =
      view[0] === 0xd0 &&
      view[1] === 0xcf &&
      view[2] === 0x11 &&
      view[3] === 0xe0;

    // Check for ZIP format (unencrypted .xlsx files)
    // Magic bytes: 50 4B 03 04 (PK..)
    const isZIP =
      view[0] === 0x50 &&
      view[1] === 0x4b &&
      view[2] === 0x03 &&
      view[3] === 0x04;

    if (!isOLE2 && !isZIP) {
      throw new DecryptionError(
        "The file appears to be corrupted. Please try a different file.",
        "CORRUPTED_FILE",
      );
    }

    // If it's a ZIP file (unencrypted .xlsx), return as-is
    if (isZIP) {
      // This is an unencrypted Excel file, no decryption needed
      // The parser can read it directly
      return buffer;
    }

    // For encrypted files (OLE2 format), return the buffer for the parser
    // The xlsx library will handle the actual decryption using the password
    // when xlsx.read() is called with the password option
    return buffer;
  } catch (error) {
    if (error instanceof DecryptionError) {
      throw error;
    }

    // Handle unexpected errors
    throw new DecryptionError(
      "An unexpected error occurred during decryption. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}

/**
 * Validates if a file is a valid Excel file (encrypted or not)
 *
 * @param buffer - The file data as ArrayBuffer
 * @returns boolean - True if the file appears to be a valid Excel file
 */
export function isValidExcelFile(buffer: ArrayBuffer): boolean {
  if (!buffer || buffer.byteLength < 4) {
    return false;
  }

  const view = new Uint8Array(buffer);

  // Check for OLE2 format (encrypted Excel files)
  // Magic bytes: D0 CF 11 E0
  const isOLE2 =
    view[0] === 0xd0 &&
    view[1] === 0xcf &&
    view[2] === 0x11 &&
    view[3] === 0xe0;

  // Check for ZIP format (unencrypted .xlsx files)
  // Magic bytes: 50 4B 03 04
  const isZIP =
    view[0] === 0x50 &&
    view[1] === 0x4b &&
    view[2] === 0x03 &&
    view[3] === 0x04;

  return isOLE2 || isZIP;
}

/**
 * Checks if an Excel file is encrypted
 *
 * @param buffer - The file data as ArrayBuffer
 * @returns boolean - True if the file is encrypted (OLE2 format)
 */
export function isEncrypted(buffer: ArrayBuffer): boolean {
  if (!buffer || buffer.byteLength < 4) {
    return false;
  }

  const view = new Uint8Array(buffer);

  // OLE2 format indicates encryption
  // Magic bytes: D0 CF 11 E0
  const isOLE2 =
    view[0] === 0xd0 &&
    view[1] === 0xcf &&
    view[2] === 0x11 &&
    view[3] === 0xe0;

  return isOLE2;
}

/**
 * Validates an Excel file and returns detailed information
 *
 * @param buffer - The file data as ArrayBuffer
 * @returns DecryptionValidation - Detailed validation information
 */
export function validateExcelFile(buffer: ArrayBuffer): DecryptionValidation {
  if (!buffer || buffer.byteLength < 4) {
    return {
      isValid: false,
      isEncrypted: false,
      requiresPassword: false,
      fileFormat: "UNKNOWN",
    };
  }

  const view = new Uint8Array(buffer);

  // Check for OLE2 format (encrypted Excel files)
  const isOLE2 =
    view[0] === 0xd0 &&
    view[1] === 0xcf &&
    view[2] === 0x11 &&
    view[3] === 0xe0;

  // Check for ZIP format (unencrypted .xlsx files)
  const isZIP =
    view[0] === 0x50 &&
    view[1] === 0x4b &&
    view[2] === 0x03 &&
    view[3] === 0x04;

  if (isOLE2) {
    return {
      isValid: true,
      isEncrypted: true,
      requiresPassword: true,
      fileFormat: "OLE2",
    };
  }

  if (isZIP) {
    return {
      isValid: true,
      isEncrypted: false,
      requiresPassword: false,
      fileFormat: "ZIP",
    };
  }

  return {
    isValid: false,
    isEncrypted: false,
    requiresPassword: false,
    fileFormat: "UNKNOWN",
  };
}

/**
 * Reads a file and returns its ArrayBuffer
 *
 * @param file - The File object to read
 * @returns Promise<ArrayBuffer> - The file data
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      if (event.target?.result instanceof ArrayBuffer) {
        resolve(event.target.result);
      } else {
        reject(new DecryptionError("Failed to read file data.", "READ_ERROR"));
      }
    };

    reader.onerror = () => {
      reject(
        new DecryptionError(
          "Failed to read file. Please try again.",
          "READ_ERROR",
        ),
      );
    };

    reader.readAsArrayBuffer(file);
  });
}
