export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    password.length <= 128 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

export function sanitizeText(text: string): string {
  // Strip null bytes and control characters, but don't HTML-encode.
  // React handles HTML escaping on render. Encoding here causes
  // double-encoding (&amp;lt; displayed to users).
  return text
    .replace(/\0/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .trim();
}

export function isValidCategory(category: string): boolean {
  return ['clean', 'green', 'fix', 'feed', 'build', 'serve'].includes(category);
}

export function isValidLatLng(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
