/**
 * Utility functions for number formatting and conversion
 */

/**
 * Converts an integer to hexadecimal string (uppercase)
 */
export function int2Hex(value: number): string {
  return ("0" + value.toString(16).toUpperCase()).slice(-2);
}

/**
 * Converts a buffer to hexadecimal string representation
 */
export function bufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Rounds a number to a specified number of decimals
 */
export function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Handles two's complement conversion for signed integers
 */
export function twosComplement(value: number, bits: number = 16): number {
  const maxValue = Math.pow(2, bits - 1);
  return value > maxValue - 1 ? value - Math.pow(2, bits) : value;
}
