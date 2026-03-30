export const AUTH_MIN_LENGTH = 3;

export function validateUsername(username: string): string | null {
  if (username.trim().length < AUTH_MIN_LENGTH) {
    return `Username must be at least ${AUTH_MIN_LENGTH} characters`;
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < AUTH_MIN_LENGTH) {
    return `Password must be at least ${AUTH_MIN_LENGTH} characters`;
  }
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) {
    return "Email is required";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return "Invalid email format";
  }

  return null;
}