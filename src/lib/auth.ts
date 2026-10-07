/**
 * Authentication utilities and types
 */

export interface LoginCredentials {
  username: string;
  password: string;
  fcm_token?: string;
}

export interface EmployeeUser {
  id?: number | string;
  employee_id?: string;
  name?: string;
  photo?: string;
  active_career?: {
    job_title?: {
      name?: string;
    };
    [key: string]: unknown;
  };
  office?: {
    id?: number;
    name?: string;
    latitude?: number | string;
    longitude?: number | string;
    radius?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface LoginResponse {
  message: string;
  error: boolean;
  code: number;
  data?: {
    id: number;
    username: string;
    employee?: EmployeeUser;
    employee_id?: number | string;
    [key: string]: unknown;
  };
}

export interface AuthUser {
  id: number;
  username: string;
  employee?: EmployeeUser;
  employee_id?: number | string;
  [key: string]: unknown;
}

const AUTH_STORAGE_KEY = "magenta_activity_auth";

/**
 * Save user data to localStorage
 */
export const saveAuthData = (user: AuthUser): void => {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("Failed to save auth data:", error);
  }
};

/**
 * Get user data from localStorage
 */
export const getAuthData = (): AuthUser | null => {
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to get auth data:", error);
    return null;
  }
};

/**
 * Remove user data from localStorage
 */
export const clearAuthData = (): void => {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear auth data:", error);
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return getAuthData() !== null;
};
