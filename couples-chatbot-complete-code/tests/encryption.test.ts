import { encrypt, decrypt } from '../utils/encryption';

describe('Encryption Utility', () => {
  test('should encrypt and decrypt a message correctly', () => {
    const originalText = 'Hello, this is a secret message!';
    const encryptedText = encrypt(originalText);
    expect(encryptedText).not.toBe(originalText);

    const decryptedText = decrypt(encryptedText);
    expect(decryptedText).toBe(originalText);
  });

  test('should return empty string when decrypting invalid cipher', () => {
    const decryptedText = decrypt('invalid-cipher');
    expect(decryptedText).toBe('');
  });
});
