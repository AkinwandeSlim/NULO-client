// /**
//  * Admin Validation Tests
//  * Simple test cases for admin signup validation
//  */

// import { adminSignupSchema, validateAdminSignupField, getPasswordStrength } from '../admin';

// // Test data
// const validAdminData = {
//   fullName: 'John Doe',
//   email: 'admin@nuloafrica.com',
//   password: 'SecurePass123!',
//   confirmPassword: 'SecurePass123!',
//   adminCode: 'NULO2026ADMIN'
// };

// describe('Admin Signup Validation', () => {
//   test('should validate correct admin data', () => {
//     const result = adminSignupSchema.safeParse(validAdminData);
//     expect(result.success).toBe(true);
//   });

//   test('should reject invalid email', () => {
//     const invalidData = { ...validAdminData, email: 'invalid-email' };
//     const result = adminSignupSchema.safeParse(invalidData);
//     expect(result.success).toBe(false);
//   });

//   test('should reject weak password', () => {
//     const invalidData = { ...validAdminData, password: 'weak' };
//     const result = adminSignupSchema.safeParse(invalidData);
//     expect(result.success).toBe(false);
//   });

//   test('should reject mismatched passwords', () => {
//     const invalidData = { ...validAdminData, confirmPassword: 'different' };
//     const result = adminSignupSchema.safeParse(invalidData);
//     expect(result.success).toBe(false);
//   });

//   test('should reject invalid admin code', () => {
//     const invalidData = { ...validAdminData, adminCode: 'INVALID' };
//     const result = adminSignupSchema.safeParse(invalidData);
//     expect(result.success).toBe(false);
//   });
// });

// describe('Password Strength', () => {
//   test('should calculate password strength correctly', () => {
//     const weakPassword = getPasswordStrength('weak');
//     expect(weakPassword.score).toBeLessThanOrEqual(2);
//     expect(weakPassword.label).toMatch(/Very Weak|Weak/);

//     const strongPassword = getPasswordStrength('SecurePass123!');
//     expect(strongPassword.score).toBeGreaterThanOrEqual(4);
//     expect(strongPassword.label).toMatch(/Strong|Very Strong/);
//   });
// });

// export {};
