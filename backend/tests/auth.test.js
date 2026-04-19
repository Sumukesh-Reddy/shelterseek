const jwt = require('jsonwebtoken');
const generateToken = require('../src/utils/generateToken');

describe('Auth Utilities Unit Tests', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  it('should generate a valid JWT token', () => {
    const userId = '123456789';
    const token = generateToken(userId);
    
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); 

    const decoded = jwt.verify(token, 'test_secret');
    expect(decoded.id).toBe(userId);
  });

  it('should fail verification with wrong secret', () => {
    const token = generateToken('123');
    expect(() => jwt.verify(token, 'wrong_secret')).toThrow();
  });

  it('should fail with malformed token', () => {
    expect(() => jwt.verify('malformed.token.here', 'test_secret')).toThrow();
  });

  describe('Credential Validation', () => {
    const validateCredentials = (email, password) => {
        return email && email.includes('@') && password && password.length >= 6;
    };

    it('should validate correct credentials', () => expect(validateCredentials('test@test.com', '123456')).toBe(true));
    it('should fail with missing email', () => expect(validateCredentials(null, '123456')).toBe(false));
    it('should fail with short password', () => expect(validateCredentials('test@test.com', '123')).toBe(false));
    it('should fail with empty strings', () => expect(validateCredentials('', '')).toBe(false));
  });

  describe('Account Roles', () => {
    const roles = ['host', 'traveler', 'admin'];
    const isValidRole = (role) => roles.includes(role);

    it('should allow host', () => expect(isValidRole('host')).toBe(true));
    it('should allow traveler', () => expect(isValidRole('traveler')).toBe(true));
    it('should allow admin', () => expect(isValidRole('admin')).toBe(true));
    it('should reject guest', () => expect(isValidRole('guest')).toBe(false));
    it('should reject manager', () => expect(isValidRole('manager')).toBe(false));
  });
});

