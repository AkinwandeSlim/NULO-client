/**
 * Admin Validation Schemas
 * Zod schemas for admin signup and profile validation
 */

import { z } from 'zod';

// Admin signup form schema
export const adminSignupSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[@$!%*?&]/, 'Password must contain at least one special character (@$!%*?&)'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
  adminCode: z
    .string()
    .min(1, 'Admin authorization code is required')
    .length(13, 'Admin authorization code must be exactly 13 characters')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Type inference from schema
export type AdminSignupFormData = z.infer<typeof adminSignupSchema>;

// Admin profile schema
export const adminProfileSchema = z.object({
  user_id: z
    .string()
    .min(1, 'User ID is required'),
  email: z
    .string()
    .email('Please enter a valid email address'),
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must be less than 50 characters'),
  role_level: z
    .number()
    .int('Role level must be an integer')
    .min(1, 'Role level must be at least 1')
    .max(10, 'Role level cannot exceed 10'),
  permissions: z.object({
    all: z.boolean(),
    tenant_verification: z.boolean(),
    landlord_verification: z.boolean(),
    property_verification: z.boolean(),
    user_management: z.boolean(),
    system_settings: z.boolean(),
  }),
});

// Type inference from profile schema
export type AdminProfileFormData = z.infer<typeof adminProfileSchema>;

// Validation helpers
export const validateAdminSignup = (data: unknown): AdminSignupFormData => {
  return adminSignupSchema.parse(data);
};

export const validateAdminProfile = (data: unknown): AdminProfileFormData => {
  return adminProfileSchema.parse(data);
};

// Partial validation for form field validation
export const validateAdminSignupField = (
  field: keyof AdminSignupFormData,
  value: unknown
): { valid: boolean; error?: string } => {
  try {
    // Validate by parsing entire object with the field
    const testData = {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      adminCode: '',
      [field]: value
    };
    adminSignupSchema.parse(testData);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message };
    }
    return { valid: false, error: 'Validation failed' };
  }
};

// Password strength calculator
export const getPasswordStrength = (password: string): {
  score: number;
  label: string;
  color: string;
  width: string;
} => {
  if (!password) return { score: 0, label: '', color: 'bg-gray-200', width: '0%' };
  
  let score = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  };
  
  Object.values(checks).forEach(passed => {
    if (passed) score++;
  });
  
  const strengthMap = {
    0: { label: 'Very Weak', color: 'bg-red-500' },
    1: { label: 'Weak', color: 'bg-red-400' },
    2: { label: 'Fair', color: 'bg-yellow-500' },
    3: { label: 'Good', color: 'bg-yellow-400' },
    4: { label: 'Strong', color: 'bg-green-500' },
    5: { label: 'Very Strong', color: 'bg-green-600' },
  };
  
  const strength = strengthMap[score as keyof typeof strengthMap] || strengthMap[0];
  
  return {
    score,
    label: strength.label,
    color: strength.color,
    width: `${(score / 5) * 100}%`,
  };
};

export default adminSignupSchema;
