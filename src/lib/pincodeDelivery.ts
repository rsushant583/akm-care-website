export function isValidIndianPincode(pin: string): boolean {
  return /^\d{6}$/.test(pin.trim());
}

/** Mock: deterministic availability from pincode (no external API). */
export function mockDeliveryAvailable(pin: string): boolean {
  if (!isValidIndianPincode(pin)) return false;
  const digits = pin.trim().split("").map(Number);
  const sum = digits.reduce((a, b) => a + b, 0);
  return sum % 3 !== 0;
}
