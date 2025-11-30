import { createError } from '../middleware/errorHandler';

export const validateEmail = (email: string): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw createError('Invalid email format', 400);
  }
};

export const validatePassword = (password: string): void => {
  if (password.length < 6) {
    throw createError('Password must be at least 6 characters', 400);
  }
};

export const validateObjectId = (id: string, fieldName: string = 'ID'): void => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!objectIdRegex.test(id)) {
    throw createError(`Invalid ${fieldName} format`, 400);
  }
};

