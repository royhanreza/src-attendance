import { API_ENDPOINTS } from "./api";
import { apiClient } from "./httpClient";

export interface Office {
  id?: number;
  name?: string;
  latitude: number | string;
  longitude: number | string;
  radius?: number;
  [key: string]: unknown;
}

export interface TodayAttendance {
  id?: number;
  date?: string;
  clock_in_time?: string;
  clock_in_at?: string;
  clock_in_note?: string;
  clock_in_latitude?: string;
  clock_in_longitude?: string;
  clock_in_is_inside_office_radius?: number;
  clock_in_attachment?: string;
  clock_out_time?: string;
  clock_out_at?: string;
  clock_out_note?: string;
  clock_out_latitude?: string;
  clock_out_longitude?: string;
  clock_out_is_inside_office_radius?: number;
  clock_out_attachment?: string;
  is_long_shift?: boolean | number;
  [key: string]: unknown;
}

export interface EmployeeDetail {
  id: number;
  name: string;
  photo?: string;
  office?: Office | null;
  active_working_pattern_id?: number | string | null;
  working_pattern_name?: string | null;
  is_aerplus_employee?: boolean;
  is_src_cleaning_service?: boolean;
  is_src_security?: boolean;
  today_clock_in_time?: string | null;
  today_attendance?: TodayAttendance | null;
  [key: string]: unknown;
}

export interface WorkingPattern {
  id: number | string;
  name: string;
  division?: string;
  [key: string]: unknown;
}

export interface PermissionCategory {
  id: number | string;
  name: string;
  [key: string]: unknown;
}

export interface PermissionNote {
  id: number | string;
  note: string;
  [key: string]: unknown;
}

export interface AttendanceActionResponse {
  message?: string;
  data: TodayAttendance;
  quotes?: string;
  error?: boolean;
}

/**
 * Calculate distance between two coordinate points in meters (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Determine if current coordinates are inside office radius (default: 30 meters)
 */
export function isInsideOfficeRadius(
  userLat: number,
  userLng: number,
  officeLat: number,
  officeLng: number,
  radiusMeters = 30
): boolean {
  if (officeLat === 0 && officeLng === 0) return false;
  const distance = calculateDistance(userLat, userLng, officeLat, officeLng);
  return distance <= radiusMeters;
}

/**
 * Calculate late time in minutes based on today_clock_in_time
 */
export function calculateTimeLate(todayClockInTimeStr?: string | null): number {
  if (!todayClockInTimeStr) return 0;
  try {
    const clockInTime = new Date(todayClockInTimeStr);
    const now = new Date();
    const diffMs = now.getTime() - clockInTime.getTime();
    return Math.floor(diffMs / (1000 * 60));
  } catch {
    return 0;
  }
}

/**
 * Fetch detailed employee info including office and today's attendance
 */
export async function fetchEmployeeDetail(
  employeeId: string | number
): Promise<EmployeeDetail | null> {
  const response = await apiClient.get<{ data?: EmployeeDetail }>(
    API_ENDPOINTS.ATTENDANCE.EMPLOYEE_DETAIL(employeeId)
  );
  return response.data?.data || null;
}

/**
 * Fetch dynamic working patterns for special divisions
 */
export async function fetchWorkingPatterns(
  division: string,
  employeeId: string | number
): Promise<WorkingPattern[]> {
  const response = await apiClient.get<{ data?: WorkingPattern[] }>(
    API_ENDPOINTS.ATTENDANCE.WORKING_PATTERNS,
    {
      params: {
        division,
        employee_id: String(employeeId),
      },
    }
  );
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

/**
 * Fetch permission categories (e.g. Izin Telat)
 */
export async function fetchPermissionCategories(): Promise<
  PermissionCategory[]
> {
  const response = await apiClient.get<{ data?: PermissionCategory[] }>(
    API_ENDPOINTS.ATTENDANCE.PERMISSION_CATEGORIES
  );
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

/**
 * Fetch common permission notes / reasons
 */
export async function fetchPermissionNotes(): Promise<PermissionNote[]> {
  const response = await apiClient.get<{ data?: PermissionNote[] }>(
    API_ENDPOINTS.ATTENDANCE.PERMISSION_NOTES
  );
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export interface CalendarEvent {
  id?: number | string;
  name: string;
  [key: string]: unknown;
}

export interface MonthlyAttendance {
  date: string;
  iso_date?: string;
  day: string;
  day_status: "workday" | "dayoff" | "holiday" | string;
  attendance?: "hadir" | "sakit" | "cuti" | "off" | "holiday" | string | null;
  attendance_id?: number | string | null;
  clock_in_time?: string | null;
  clock_out_time?: string | null;
  clock_in_note?: string | null;
  clock_out_note?: string | null;
  time_late?: number | string | null;
  is_long_shift?: boolean | number | null;
  long_shift_status?: string | null;
  events?: CalendarEvent[];
  [key: string]: unknown;
}

export interface MonthlyAttendanceStatistic {
  total_work_day: number;
  total_present: number;
  total_sick: number;
  total_leave: number;
  total_time_late: number;
}

export interface AttendanceDetailData {
  id?: number | string;
  date: string;
  clock_in_time?: string | null;
  clock_in_at?: string | null;
  clock_in_ip_address?: string | null;
  clock_in_device_detail?: string | null;
  clock_in_latitude?: string | null;
  clock_in_longitude?: string | null;
  clock_in_is_inside_office_radius?: boolean | number | null;
  clock_in_office_latitude?: string | null;
  clock_in_office_longitude?: string | null;
  clock_in_working_pattern_time?: string | null;
  clock_in_attachment?: string | null;
  clock_in_note?: string | null;
  clock_out_time?: string | null;
  clock_out_at?: string | null;
  clock_out_ip_address?: string | null;
  clock_out_device_detail?: string | null;
  clock_out_latitude?: string | null;
  clock_out_longitude?: string | null;
  clock_out_is_inside_office_radius?: boolean | number | null;
  clock_out_office_latitude?: string | null;
  clock_out_office_longitude?: string | null;
  clock_out_working_pattern_time?: string | null;
  clock_out_attachment?: string | null;
  clock_out_note?: string | null;
  status?: string | null;
  time_late?: number | string | null;
  early_leaving?: number | string | null;
  overtime?: number | string | null;
  approval_status?: string | null;
  is_long_shift?: boolean | number | null;
  employee_id?: number | string;
  employee?: {
    id: number | string;
    name: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Fetch monthly attendances and compute monthly statistics
 */
export async function fetchMonthlyAttendances(
  employeeId: string | number,
  month: string // format "YYYY-MM"
): Promise<{ attendances: MonthlyAttendance[]; statistics: MonthlyAttendanceStatistic }> {
  const response = await apiClient.get<{ data?: MonthlyAttendance[] }>(
    API_ENDPOINTS.ATTENDANCE.MONTHLY_ATTENDANCES(employeeId),
    {
      params: {
        month,
      },
    }
  );

  const data: MonthlyAttendance[] = Array.isArray(response.data?.data)
    ? response.data.data
    : [];

  let totalWorkDay = 0;
  let totalTimeLate = 0;
  let totalSick = 0;
  let totalLeave = 0;
  let totalPresent = 0;

  for (const item of data) {
    const late = Number(item.time_late) || 0;
    if (late > 0) {
      totalTimeLate += late;
    }
    if (item.day_status === "workday") {
      totalWorkDay += 1;
    }
    if (item.attendance === "hadir") {
      totalPresent += 1;
    }
    if (item.attendance === "sakit") {
      totalSick += 1;
    }
    if (item.attendance === "cuti") {
      totalLeave += 1;
    }
  }

  return {
    attendances: data,
    statistics: {
      total_work_day: totalWorkDay,
      total_present: totalPresent,
      total_sick: totalSick,
      total_leave: totalLeave,
      total_time_late: totalTimeLate,
    },
  };
}

/**
 * Fetch single attendance detail record
 */
export async function fetchAttendanceDetail(
  attendanceId: string | number
): Promise<AttendanceDetailData | null> {
  const response = await apiClient.get<{ data?: AttendanceDetailData }>(
    API_ENDPOINTS.ATTENDANCE.DETAIL(attendanceId)
  );
  return response.data?.data || null;
}

