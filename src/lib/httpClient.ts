import axios, { AxiosError } from "axios";
import { getApiBaseUrl, EXTERNAL_APIS } from "./api";

/**
 * Custom ApiError containing detailed and human-readable error information
 */
export class ApiError extends Error {
  public statusCode?: number;
  public errorCode?: string;
  public originalError?: unknown;
  public isNetworkError: boolean;
  public isTimeout: boolean;
  public isAuthError: boolean;
  public isValidationError: boolean;
  public details?: unknown;

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      errorCode?: string;
      originalError?: unknown;
      isNetworkError?: boolean;
      isTimeout?: boolean;
      isAuthError?: boolean;
      isValidationError?: boolean;
      details?: unknown;
    }
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = options?.statusCode;
    this.errorCode = options?.errorCode;
    this.originalError = options?.originalError;
    this.isNetworkError = options?.isNetworkError ?? false;
    this.isTimeout = options?.isTimeout ?? false;
    this.isAuthError = options?.isAuthError ?? false;
    this.isValidationError = options?.isValidationError ?? false;
    this.details = options?.details;
  }
}

/**
 * Safely extracts server message from various backend error response formats
 */
function extractServerMessage(data: unknown): string | null {
  if (!data) return null;

  if (typeof data === "string") {
    // If response body is HTML (e.g. 502/504 Bad Gateway from nginx), do not show raw html
    if (data.trim().startsWith("<")) return null;
    return data;
  }

  if (typeof data === "object") {
    const record = data as Record<string, unknown>;

    // Common message fields
    if (typeof record.message === "string" && record.message.trim() !== "") {
      return record.message;
    }
    if (typeof record.msg === "string" && record.msg.trim() !== "") {
      return record.msg;
    }
    if (typeof record.error === "string" && record.error.trim() !== "") {
      return record.error;
    }
    if (typeof record.detail === "string" && record.detail.trim() !== "") {
      return record.detail;
    }

    // Validation errors object / array
    if (record.errors) {
      if (Array.isArray(record.errors)) {
        const msgs = record.errors
          .map((item) => {
            if (typeof item === "string") return item;
            if (item && typeof item === "object") {
              const obj = item as Record<string, unknown>;
              return obj.message || obj.msg || obj.detail || JSON.stringify(item);
            }
            return String(item);
          })
          .filter(Boolean);
        if (msgs.length > 0) return msgs.join(", ");
      } else if (typeof record.errors === "object") {
        const errorEntries = Object.entries(record.errors as Record<string, unknown>);
        const msgs = errorEntries.map(([field, value]) => {
          if (Array.isArray(value)) {
            return `${field}: ${value.join(", ")}`;
          }
          return `${field}: ${String(value)}`;
        });
        if (msgs.length > 0) return msgs.join("; ");
      }
    }
  }

  return null;
}

/**
 * Converts any error into a detailed, human-readable Indonesian error message
 */
export function formatApiErrorMessage(
  error: unknown,
  fallbackMessage = "Terjadi kesalahan pada sistem. Silakan coba beberapa saat lagi."
): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  // Check browser offline status
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return "Tidak ada koneksi internet. Pastikan perangkat Anda terhubung ke Wi-Fi atau data seluler.";
  }

  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError;
    const { code, response, message: rawMsg } = axiosErr;

    // Timeout errors
    if (code === "ECONNABORTED" || rawMsg?.toLowerCase().includes("timeout")) {
      return "Batas waktu koneksi habis (timeout). Server membutuhkan waktu terlalu lama untuk merespons. Periksa koneksi internet Anda dan coba lagi.";
    }

    // Network disconnection / unreachable server
    if (code === "ERR_NETWORK" || (!response && code !== "ERR_CANCELED")) {
      return "Gagal terhubung ke server. Pastikan server aktif atau periksa koneksi internet Anda.";
    }

    // Request canceled
    if (axios.isCancel(error) || code === "ERR_CANCELED") {
      return "Permintaan dibatalkan.";
    }

    // HTTP Responses with status codes
    if (response) {
      const status = response.status;
      const serverMessage = extractServerMessage(response.data);

      switch (status) {
        case 400:
          return serverMessage
            ? `Permintaan tidak valid: ${serverMessage}`
            : "Permintaan tidak valid (400). Mohon periksa kembali kelengkapan data yang dimasukkan.";
        case 401:
          return serverMessage || "Sesi masuk Anda telah berakhir atau belum terautentikasi (401). Silakan login kembali.";
        case 403:
          return serverMessage
            ? `Akses ditolak: ${serverMessage}`
            : "Akses ditolak (403). Anda tidak memiliki izin untuk melakukan tindakan ini.";
        case 404:
          return serverMessage
            ? `Data tidak ditemukan: ${serverMessage}`
            : "Data atau layanan yang diminta tidak ditemukan di server (404).";
        case 405:
          return "Metode pengiriman permintaan tidak diizinkan oleh server (405).";
        case 408:
          return "Waktu permintaan habis pada server (408). Silakan coba kirim kembali.";
        case 409:
          return serverMessage
            ? `Terjadi konflik data: ${serverMessage}`
            : "Terjadi konflik data (409). Data mungkin sudah pernah dicatat atau telah diperbarui.";
        case 413:
          return "Ukuran foto atau data yang diunggah terlalu besar (413). Silakan pilih file dengan ukuran lebih kecil.";
        case 422:
          return serverMessage
            ? `Validasi gagal: ${serverMessage}`
            : "Data yang dikirimkan tidak memenuhi ketentuan server (422).";
        case 429:
          return "Terlalu banyak permintaan dalam waktu singkat (429). Mohon tunggu beberapa saat sebelum mencoba kembali.";
        case 500:
          return serverMessage
            ? `Terjadi kendala pada server (500): ${serverMessage}`
            : "Terjadi kesalahan internal pada server (500). Silakan coba lagi nanti atau hubungi administrator.";
        case 502:
          return "Server sedang tidak dapat dijangkau (Bad Gateway 502). Kemungkinan server sedang dalam proses restart atau pembaruan.";
        case 503:
          return "Layanan server sedang tidak tersedia atau dalam pemeliharaan (503). Silakan coba beberapa saat lagi.";
        case 504:
          return "Koneksi gateway server mengalami batas waktu (Gateway Timeout 504). Server perantara gagal menerima respon tepat waktu.";
        default:
          if (status >= 500) {
            return serverMessage
              ? `Terjadi gangguan server (Error ${status}): ${serverMessage}`
              : `Terjadi gangguan pada server (Kode status: ${status}). Silakan coba lagi nanti.`;
          }
          if (status >= 400) {
            return serverMessage
              ? `Permintaan tidak dapat diproses: ${serverMessage}`
              : `Permintaan tidak dapat diproses oleh server (Kode status: ${status}).`;
          }
      }
    }
  }

  if (error instanceof Error) {
    const msg = error.message;
    if (
      msg.toLowerCase().includes("failed to fetch") ||
      msg.toLowerCase().includes("networkerror") ||
      msg.toLowerCase().includes("load failed")
    ) {
      return "Gagal menghubungkan ke jaringan. Periksa koneksi internet Anda.";
    }
    return msg;
  }

  return fallbackMessage;
}

/**
 * Convenience alias for formatApiErrorMessage
 */
export const getErrorMessage = formatApiErrorMessage;

/**
 * Centralized Axios instance configured for API calls
 */
export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000, // 30 seconds
  headers: {
    Accept: "application/json",
  },
});

// Interceptor to transform errors and handle custom API error flags (e.g. { error: true, message: "..." })
apiClient.interceptors.response.use(
  (response) => {
    // If backend returns HTTP 200 with error: true flag
    if (
      response.data &&
      typeof response.data === "object" &&
      response.data.error === true
    ) {
      const message =
        extractServerMessage(response.data) ||
        "Permintaan gagal diproses oleh server.";
      return Promise.reject(
        new ApiError(message, {
          statusCode: (response.data.code as number) || response.status,
          details: response.data,
        })
      );
    }
    return response;
  },
  (error: unknown) => {
    const humanMessage = formatApiErrorMessage(error);
    let statusCode: number | undefined;
    let errorCode: string | undefined;
    let details: unknown;

    if (axios.isAxiosError(error)) {
      statusCode = error.response?.status;
      errorCode = error.code;
      details = error.response?.data;
    }

    const isTimeout =
      errorCode === "ECONNABORTED" ||
      (error instanceof Error && error.message.toLowerCase().includes("timeout"));
    const isNetwork =
      errorCode === "ERR_NETWORK" ||
      (axios.isAxiosError(error) && !error.response);
    const isAuth = statusCode === 401 || statusCode === 403;
    const isValidation = statusCode === 400 || statusCode === 422;

    const apiError = new ApiError(humanMessage, {
      statusCode,
      errorCode,
      originalError: error,
      isNetworkError: isNetwork,
      isTimeout,
      isAuthError: isAuth,
      isValidationError: isValidation,
      details,
    });

    return Promise.reject(apiError);
  }
);

/**
 * Fetch public IP address with timeout and safe fallback
 */
export async function fetchPublicIp(): Promise<string> {
  try {
    const res = await axios.get<{ ip?: string }>(EXTERNAL_APIS.IPIFY, {
      timeout: 4000,
    });
    return res.data?.ip || "";
  } catch (err) {
    console.warn("Gagal mendapatkan IP publik:", err);
    return "";
  }
}

/**
 * Reverse geocoding via Nominatim with timeout and safe fallback
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ address: string; road: string }> {
  const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  try {
    const url = `${EXTERNAL_APIS.NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lng}`;
    const res = await axios.get<{
      display_name?: string;
      address?: {
        road?: string;
        pedestrian?: string;
        suburb?: string;
        city?: string;
      };
    }>(url, {
      timeout: 6000,
    });

    const data = res.data;
    const road =
      data.address?.road ||
      data.address?.pedestrian ||
      data.address?.suburb ||
      data.address?.city ||
      "Lokasi Terdeteksi";

    return {
      address: data.display_name || fallbackAddress,
      road,
    };
  } catch (err) {
    console.warn("Gagal melakukan reverse geocode:", err);
    return {
      address: fallbackAddress,
      road: "Lokasi Terdeteksi",
    };
  }
}

