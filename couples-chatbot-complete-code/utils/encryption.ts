import CryptoJS from 'crypto-js';
import config from './config';

const SECRET = config.messageSecret || 'fallback_secret';

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, SECRET).toString();
}

export function decrypt(cipher: string): string {
  const bytes = CryptoJS.AES.decrypt(cipher, SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
}
