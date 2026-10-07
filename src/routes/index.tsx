import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "../stores/authStore";
import {
  Activity,
  User,
  LogOut,
  Calendar,
  Clock,
  MapPin,
  History,
  LogIn,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { getApiBaseUrl } from "../lib/api";
import {
  fetchEmployeeDetail,
  calculateTimeLate,
  type EmployeeDetail,
} from "../lib/attendance";

export const Route = createFileRoute("/")({
  component: HomePage,
});

interface ActiveActivity {
  id: number;
  date: string;
  check_in_time: string;
  check_in_location: string;
  check_in_note: string;
  check_in_attachment?: string;
}

function HomePage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [activeActivity, setActiveActivity] = useState<ActiveActivity | null>(null);
  const [employeeDetail, setEmployeeDetail] = useState<EmployeeDetail | null>(null);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const employeeId = user?.employee_id || user?.employee?.id;

  // Live digital clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const handleActivityClick = () => {
    if (employeeId) {
      const currentDate = new Date().toISOString().split("T")[0];
      navigate({
        to: "/activity-check",
        search: {
          employee_id: String(employeeId),
          date: currentDate,
        },
      });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 17) return "Selamat Siang";
    return "Selamat Malam";
  };

  const formattedDate = currentTime.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = currentTime.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Fetch active activity and employee details
  useEffect(() => {
    const fetchActiveActivity = async () => {
      if (!employeeId) return;

      try {
        const today = new Date();
        const currentDateStr = today.toISOString().split("T")[0];
        const apiBaseUrl = getApiBaseUrl();
        const response = await fetch(
          `${apiBaseUrl}/activities/active-activity?employee_id=${employeeId}&date=${currentDateStr}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            setActiveActivity(data.data);
          } else {
            setActiveActivity(null);
          }
        } else {
          setActiveActivity(null);
        }
      } catch (error) {
        console.error("Error fetching active activity:", error);
        setActiveActivity(null);
      }
    };

    const loadAttendance = async () => {
      if (!employeeId) return;
      setIsLoadingAttendance(true);
      const detail = await fetchEmployeeDetail(employeeId);
      setEmployeeDetail(detail);
      setIsLoadingAttendance(false);
    };

    fetchActiveActivity();
    loadAttendance();
  }, [employeeId]);

  const handleCheckoutClick = () => {
    if (employeeId) {
      navigate({
        to: "/checkout",
        search: {
          employee_id: String(employeeId),
        },
      });
    }
  };

  // Today's attendance computations
  const todayAttendance = employeeDetail?.today_attendance;
  const hasClockedIn = Boolean(todayAttendance?.clock_in_time);
  const hasClockedOut = Boolean(todayAttendance?.clock_out_time);
  const timeLate = calculateTimeLate(employeeDetail?.today_clock_in_time);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-fuchsia-50">
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl flex flex-col justify-between">
        <div>
          {/* Header with Avatar and Name */}
          <div className="bg-gradient-to-br from-fuchsia-600 via-fuchsia-700 to-pink-600 px-6 pt-12 pb-8 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
            </div>

            <div className="relative z-10">
              {/* Welcome Message */}
              <div className="mb-6">
                <p className="text-fuchsia-100 text-sm font-medium mb-1">
                  {getGreeting()}
                </p>
                <h1 className="text-2xl font-bold text-white leading-tight">
                  {user?.employee?.name || user?.username || "Pengguna"}
                </h1>
              </div>

              {/* User Profile Card */}
              <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="relative">
                  {user?.employee?.photo ? (
                    <img
                      src={user.employee.photo}
                      alt={user.employee.name || "User"}
                      className="w-16 h-16 rounded-full border-3 border-white shadow-xl object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full border-3 border-white shadow-xl bg-gradient-to-br from-fuchsia-400 to-fuchsia-500 flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-400 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  {user?.employee?.active_career?.job_title?.name && (
                    <p className="text-white/90 text-sm font-medium truncate">
                      {user.employee.active_career.job_title.name}
                    </p>
                  )}
                  {user?.employee?.employee_id && (
                    <p className="text-white/70 text-xs mt-0.5">
                      ID: {user.employee.employee_id}
                    </p>
                  )}
                  {employeeDetail?.working_pattern_name && (
                    <p className="text-fuchsia-200 text-xs mt-1 font-medium truncate">
                      Pola Kerja: {employeeDetail.working_pattern_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Date & Time Display */}
              <div className="mt-4 flex items-center justify-between text-white/90 text-xs font-medium">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <p>{formattedDate}</p>
                </div>
                <div className="flex items-center space-x-1 font-mono text-sm bg-white/15 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  <span>{formattedTime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Kehadiran (Clock In / Clock Out) Hero Card */}
          <div className="px-6 -mt-4 relative z-20">
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-fuchsia-100 flex items-center justify-center text-fuchsia-600">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Kehadiran Hari Ini
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {hasClockedIn && hasClockedOut
                        ? "Absensi telah lengkap"
                        : hasClockedIn
                        ? "Sudah clock in, belum clock out"
                        : "Belum melakukan absensi"}
                    </p>
                  </div>
                </div>

                {hasClockedIn && hasClockedOut && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Selesai
                  </span>
                )}
              </div>

              {/* Late alert banner if not clocked in and time is past */}
              {!hasClockedIn && timeLate > 0 && (
                <div className="mb-3.5 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-amber-800 text-xs animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="flex-1 font-medium">
                    Telat <span className="font-bold">{timeLate} menit</span>, clock in sekarang!
                  </p>
                </div>
              )}

              {/* Attendance Details Grid if already clocked in */}
              {hasClockedIn && (
                <div className="grid grid-cols-2 gap-2.5 mb-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                      Clock In
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {todayAttendance?.clock_in_time || "-"}
                    </span>
                    {todayAttendance?.clock_in_note && (
                      <p className="text-slate-500 text-[11px] truncate mt-0.5">
                        {todayAttendance.clock_in_note}
                      </p>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                      Clock Out
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {todayAttendance?.clock_out_time || "-"}
                    </span>
                    {todayAttendance?.clock_out_note && (
                      <p className="text-slate-500 text-[11px] truncate mt-0.5">
                        {todayAttendance.clock_out_note}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons for Clock In / Clock Out */}
              <div>
                {!hasClockedIn ? (
                  <button
                    onClick={() => navigate({ to: "/clock-in" })}
                    disabled={isLoadingAttendance}
                    className="w-full py-3 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white font-bold text-xs rounded-xl shadow-md shadow-fuchsia-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Clock In Sekarang</span>
                  </button>
                ) : !hasClockedOut ? (
                  <button
                    onClick={() => navigate({ to: "/clock-out" })}
                    disabled={isLoadingAttendance}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Clock Out Sekarang</span>
                  </button>
                ) : (
                  <div className="w-full py-2.5 text-center text-xs font-semibold text-slate-500 bg-slate-100 rounded-xl">
                    Kehadiran Anda hari ini telah tuntas
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu Section */}
          <div className="px-6 py-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900 mb-0.5">Menu Utama</h2>
              <p className="text-xs text-gray-500">Pilih menu untuk melanjutkan</p>
            </div>

            <div className="space-y-3">
              {/* Menu Kehadiran */}
              <button
                onClick={() => {
                  if (employeeId) {
                    navigate({
                      to: "/attendance",
                      search: {
                        employee_id: String(employeeId),
                      },
                    });
                  } else {
                    navigate({ to: "/attendance" });
                  }
                }}
                className="group w-full bg-white border border-gray-200 rounded-2xl p-4 flex items-center space-x-4 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-all">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-900 text-sm mb-0.5">
                    Menu Kehadiran
                  </h3>
                  <p className="text-xs text-gray-500">
                    Lihat kalender & riwayat kehadiran bulanan
                  </p>
                </div>
                <div className="text-gray-400 group-hover:text-emerald-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Aktifitas Menu */}
              <button
                onClick={handleActivityClick}
                className="group w-full bg-white border border-gray-200 rounded-2xl p-4 flex items-center space-x-4 hover:border-fuchsia-300 hover:shadow-lg hover:shadow-fuchsia-100 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-all">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-900 text-sm mb-0.5">
                    Buat Aktifitas
                  </h3>
                  <p className="text-xs text-gray-500">
                    Cek dan kelola status aktivitas harian Anda
                  </p>
                </div>
                <div className="text-gray-400 group-hover:text-fuchsia-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Riwayat Menu */}
              <button
                onClick={() => {
                  if (employeeId) {
                    navigate({
                      to: "/activity-history",
                      search: {
                        employee_id: String(employeeId),
                      },
                    });
                  }
                }}
                className="group w-full bg-white border border-gray-200 rounded-2xl p-4 flex items-center space-x-4 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-all">
                  <History className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-900 text-sm mb-0.5">
                    Riwayat Aktifitas
                  </h3>
                  <p className="text-xs text-gray-500">
                    Lihat riwayat aktivitas bulanan Anda
                  </p>
                </div>
                <div className="text-gray-400 group-hover:text-blue-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          {/* Active Activity Section */}
          {activeActivity && (
            <div className="px-6 pb-6">
              <div className="mb-3">
                <h2 className="text-base font-bold text-gray-900 mb-0.5">
                  Aktifitas yang Sedang Aktif
                </h2>
                <p className="text-xs text-gray-500">
                  Anda sedang dalam sesi aktifitas
                </p>
              </div>

              <div className="bg-gradient-to-br from-fuchsia-50 to-pink-50 border-2 border-fuchsia-200 rounded-2xl p-4 shadow-sm">
                <div className="space-y-3">
                  {/* Check-in Time */}
                  <div className="flex items-start space-x-3">
                    <div className="w-9 h-9 bg-fuchsia-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-fuchsia-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-gray-500 font-medium">Check-in Time</p>
                      <p className="text-xs font-semibold text-gray-900">
                        {activeActivity.check_in_time || "-"}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  {activeActivity.check_in_location && (
                    <div className="flex items-start space-x-3">
                      <div className="w-9 h-9 bg-fuchsia-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-fuchsia-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-500 font-medium">Lokasi</p>
                        <p className="text-xs text-gray-900 line-clamp-2">
                          {activeActivity.check_in_location}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Note */}
                  {activeActivity.check_in_note && (
                    <div className="flex items-start space-x-3">
                      <div className="w-9 h-9 bg-fuchsia-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Activity className="w-4 h-4 text-fuchsia-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-500 font-medium">Catatan</p>
                        <p className="text-xs text-gray-900 line-clamp-2">
                          {activeActivity.check_in_note}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Photo Preview */}
                  {activeActivity.check_in_attachment && (
                    <div className="mt-2">
                      <img
                        src={activeActivity.check_in_attachment}
                        alt="Check-in photo"
                        className="w-full h-40 object-cover rounded-xl border border-fuchsia-200"
                      />
                    </div>
                  )}

                  {/* Check-out Button */}
                  <button
                    onClick={handleCheckoutClick}
                    className="w-full mt-2 bg-gradient-to-r from-fuchsia-600 to-fuchsia-700 hover:from-fuchsia-700 hover:to-fuchsia-800 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-fuchsia-500/30 text-xs active:scale-98"
                  >
                    Check Out Aktifitas
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="px-6 py-6 border-t border-slate-100 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full bg-white border border-red-200 rounded-2xl p-3.5 flex items-center justify-center space-x-2 hover:bg-red-50 hover:border-red-300 transition-all text-xs font-semibold text-red-600 shadow-sm active:scale-98"
          >
            <LogOut className="w-4 h-4 text-red-600" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
}
