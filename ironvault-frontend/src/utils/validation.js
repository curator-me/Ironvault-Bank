// Client-side validation rules mirroring the backend constraints.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email) => EMAIL_REGEX.test(String(email).trim());

// Backend requires passwords of at least 8 characters.
export const MIN_PASSWORD_LENGTH = 8;

export const isValidPassword = (password) =>
  typeof password === 'string' && password.length >= MIN_PASSWORD_LENGTH;

// Returns a map of field -> error message for the auth forms.
export const validateAuthForm = ({ email, password }) => {
  const errors = {};

  if (!email || !email.trim()) {
    errors.email = 'Email is required.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  } else if (!isValidPassword(password)) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  return errors;
};
