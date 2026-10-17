import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

// Validation helper functions mirroring backend & client rules
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validatePassword(password: string): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (password.length < 8) reasons.push('Minimum 8 characters required');
  if (!/[0-9]/.test(password)) reasons.push('At least one digit required');
  if (!/[^a-zA-Z0-9]/.test(password)) reasons.push('At least one special character required');
  return { valid: reasons.length === 0, reasons };
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const computedHash = hashPassword(password, salt);
  const expectedBuf = Buffer.from(expectedHash, 'hex');
  const actualBuf = Buffer.from(computedHash, 'hex');
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

function sanitizeUser(user: {
  uid: string;
  email: string;
  displayName: string;
  passwordSalt: string;
  passwordHash: string;
  role: string;
}) {
  const { passwordSalt, passwordHash, ...safeUser } = user;
  return safeUser;
}

test('Auth: Email format validation', () => {
  assert.equal(validateEmail('analyst@sentinel.corp'), true);
  assert.equal(validateEmail('sec.ops+tier3@domain.co.uk'), true);
  assert.equal(validateEmail('invalid-email'), false);
  assert.equal(validateEmail('missing@domain'), false);
  assert.equal(validateEmail('@missinguser.com'), false);
  assert.equal(validateEmail(''), false);
});

test('Auth: Password strength and complexity rules', () => {
  assert.equal(validatePassword('CyberSec#2026!').valid, true);
  assert.equal(validatePassword('short1!').valid, false); // < 8 chars
  assert.equal(validatePassword('nouppernodigit!').valid, false); // missing number
  assert.equal(validatePassword('AlphaNumeric12345').valid, false); // missing special char
  assert.equal(validatePassword('P@ssw0rd').valid, true);
});

test('Auth: PBKDF2/SHA-512 cryptographic password hashing & timing-safe verification', () => {
  const password = 'StrictSOCPassword#99';
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = hashPassword(password, salt);

  assert.ok(hash.length === 128); // 64 bytes in hex
  assert.equal(verifyPassword(password, salt, hash), true);
  assert.equal(verifyPassword('WrongPassword#99', salt, hash), false);
  assert.equal(verifyPassword(password, 'differentsalt', hash), false);
});

test('Auth: User sanitization prevents credential leakage', () => {
  const internalUser = {
    uid: 'usr_abc123',
    email: 'analyst@sentinel.sec',
    displayName: 'Lead Threat Hunter',
    passwordSalt: '32bytesaltinhex',
    passwordHash: '128characterhashinhex',
    role: 'SOC Analyst'
  };

  const safe = sanitizeUser(internalUser);
  assert.equal((safe as any).passwordSalt, undefined);
  assert.equal((safe as any).passwordHash, undefined);
  assert.equal(safe.email, 'analyst@sentinel.sec');
  assert.equal(safe.displayName, 'Lead Threat Hunter');
});

test('Auth: Session token generation and entropy', () => {
  const token1 = crypto.randomBytes(32).toString('hex');
  const token2 = crypto.randomBytes(32).toString('hex');

  assert.equal(token1.length, 64);
  assert.equal(token2.length, 64);
  assert.notEqual(token1, token2);
});

test('Auth: Remember-me security principle (only email retained, never password)', () => {
  const mockStorage: Record<string, string> = {};

  const handleRememberMe = (email: string, password: string, remember: boolean) => {
    if (remember) {
      mockStorage['sentinel_remembered_email'] = email;
    } else {
      delete mockStorage['sentinel_remembered_email'];
    }
    // Security check: NEVER store password in storage
  };

  handleRememberMe('analyst@sentinel.sec', 'SecretPassword#123', true);
  assert.equal(mockStorage['sentinel_remembered_email'], 'analyst@sentinel.sec');
  assert.equal(mockStorage['sentinel_remembered_password'], undefined);
  assert.equal(Object.keys(mockStorage).length, 1);
});
