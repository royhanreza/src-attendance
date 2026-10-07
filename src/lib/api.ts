/**
 * API Configuration
 * Centralized location for all API endpoints and base URLs
 */

// Base API URL - can be configured via environment variables
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// External API URLs
export const EXTERNAL_APIS = {
  NOMINATIM: "https://nominatim.openstreetmap.org",
} as const;

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Check-in endpoints
  CHECKIN: {
    CREATE: `${API_BASE_URL}/checkin`,
    GET_ALL: `${API_BASE_URL}/checkin`,
    GET_BY_ID: (id: string) => `${API_BASE_URL}/checkin/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/checkin/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/checkin/${id}`,
  },

  // Check-out endpoints
  CHECKOUT: {
    CREATE: `${API_BASE_URL}/checkout`,
    GET_ALL: `${API_BASE_URL}/checkout`,
    GET_BY_ID: (id: string) => `${API_BASE_URL}/checkout/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/checkout/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/checkout/${id}`,
  },

  // Activity endpoints
  ACTIVITY: {
    CREATE: `${API_BASE_URL}/activity`,
    GET_ALL: `${API_BASE_URL}/activity`,
    GET_BY_ID: (id: string) => `${API_BASE_URL}/activity/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/activity/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/activity/${id}`,
    GET_BY_CHECKIN: (checkinId: string) =>
      `${API_BASE_URL}/activity?checkinId=${checkinId}`,
    GET_BY_CHECKOUT: (checkoutId: string) =>
      `${API_BASE_URL}/activity?checkoutId=${checkoutId}`,
    CURRENT_STATE: `${API_BASE_URL}/activities/current-state`,
    GET_ACTIVE: `${API_BASE_URL}/activities/get-active-activity`,
  },

  // Reverse geocoding (using external API)
  GEOCODING: {
    REVERSE: (lat: number, lng: number) =>
      `${EXTERNAL_APIS.NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lng}`,
  },

  // Attendance endpoints
  ATTENDANCE: {
    CLOCK_IN: `${API_BASE_URL}/attendances/action/clockin-v2`,
    CLOCK_OUT: `${API_BASE_URL}/attendances/action/clockout-v2`,
    WORKING_PATTERNS: `${API_BASE_URL}/working-patterns`,
    PERMISSION_CATEGORIES: `${API_BASE_URL}/permission-categories`,
    PERMISSION_NOTES: `${API_BASE_URL}/permission-notes`,
    EMPLOYEE_DETAIL: (employeeId: string | number) =>
      `${API_BASE_URL}/employees/detail-v2/${employeeId}`,
    MONTHLY_ATTENDANCES: (employeeId: string | number) =>
      `${API_BASE_URL}/employees/${employeeId}/monthly-attendances`,
    DETAIL: (attendanceId: string | number) =>
      `${API_BASE_URL}/attendances/${attendanceId}`,
  },

  // Authentication endpoints
  AUTH: {
    LOGIN_EMPLOYEE: `${API_BASE_URL}/auth/mobile/employee`,
  },
} as const;

/**
 * Helper function to build full API URL
 */
export const buildApiUrl = (endpoint: string): string => {
  return endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
};

/**
 * Get base API URL
 */
export const getApiBaseUrl = (): string => {
  return API_BASE_URL;
};
