/**
 * Browser-side Web Crypto API (AES-GCM) encryption helper
 * Encrypts sensitive user API keys locally before storing in localStorage
 */

const ENCRYPTION_SALT = 'kyros-ai-secure-byok-key-v1';

async function getCryptoKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(ENCRYPTION_SALT),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('kyros-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptApiKey(plainText: string): Promise<string> {
  if (!plainText) return '';
  try {
    const key = await getCryptoKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();

    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(plainText)
    );

    const buffer = new Uint8Array(encryptedContent);
    const combined = new Uint8Array(iv.length + buffer.length);
    combined.set(iv);
    combined.set(buffer, iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch {
    return plainText;
  }
}

export async function decryptApiKey(cipherText: string): Promise<string> {
  if (!cipherText) return '';
  try {
    const key = await getCryptoKey();
    const combined = Uint8Array.from(atob(cipherText), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decryptedContent);
  } catch {
    return cipherText;
  }
}
