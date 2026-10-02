async function deriveKey(code, saltB64) {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey(
    'raw',
    enc.encode(code),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: fromB64(saltB64),
      iterations: 120000,
      hash: 'SHA-256'
    },
    base,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );
}

function toB64(buf) {
  const bytes = new Uint8Array(buf);
  let str = '';

  for (const b of bytes) {
    str += String.fromCharCode(b);
  }

  return btoa(str);
}

function fromB64(s) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);

  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }

  return out;
}

async function encryptText(text) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(state.code, toB64(salt));
  const cipher = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    new TextEncoder().encode(text)
  );

  return {
    ciphertext: toB64(cipher),
    iv: toB64(iv),
    salt: toB64(salt)
  };
}

async function decryptItem(item) {
  try {
    const key = await deriveKey(state.code, item.salt);
    const plain = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: fromB64(item.iv)
      },
      key,
      fromB64(item.ciphertext)
    );

    return new TextDecoder().decode(plain);
  } catch {
    return '[Unable to decrypt this item]';
  }
}
