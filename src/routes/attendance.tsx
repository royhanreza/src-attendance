import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuthStore } from "../stores/authStore";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Coffee,
  HeartPulse,
  Briefcase,
  ExternalLink,
  RotateCcw,
  LogIn,
  LogOut,
} from "lucide-react";
import {
  format,
  getDaysInMonth,
  startOfMonth,
  addMonths,
  subMonths,
  isSameDay,
  isToday,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  fetchMonthlyAttendances,
  type MonthlyAttendance,
  type MonthlyAttendanceStatistic,
} from "../lib/attendance";

interface AttendanceSearch {
  employee_id?: string;
  month?: string;
}

export const Route = createFileRoute("/attendance")({
  component: AttendanceCalendarPage,
  validateSearch: (search: Record<string, unknown>): AttendanceSearch => {
    return {
      employee_id: (search.employee_id as string) || undefined,
      month: (search.month as string) || undefined,
    };
  },
});

function AttendanceCalendarPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/attendance" });
  const authUser = useAuthStore((state) => state.user);

  const employeeId =
    search.employee_id ||
    authUser?.employee_id ||
    authUser?.employee?.id ||
    "";

  // Current view date (year & month)
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (search.month && /^\d{4}-\d{2}$/.test(search.month)) {
      const [y, m] = search.month.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });

  const [attendances, setAttendances] = useState<MonthlyAttendance[]>([]);
  const [stats, setStats] = useState<MonthlyAttendanceStatistic>({
    total_work_day: 0,
    total_present: 0,
    total_sick: 0,
    total_leave: 0,
    total_time_late: 0,
  });
  const [loading, setLoading] = useState(true);

  const formattedMonthParam = format(currentDate, "yyyy-MM");

  // Load monthly attendances from API
  const loadData = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const result = await fetchMonthlyAttendances(employeeId, formattedMonthParam);
      setAttendances(result.attendances);
      setStats(result.statistics);
    } catch (err) {
      console.error("Failed to load monthly attendances:", err);
      setAttendances([]);
    } finally {
      setLoading(false);
    }
  }, [employeeId, formattedMonthParam]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => addMonths(prev, 1));
  };

  const handleTodayClick = () => {
    setCurrentDate(new Date());
  };

  // Map attendances by date string "YYYY-MM-DD" for fast lookup
  const attendanceMap = useMemo(() => {
    const map = new Map<string, MonthlyAttendance>();
    for (const item of attendances) {
      if (item.date) {
        // Normalize date to YYYY-MM-DD
        const dStr = item.date.split("T")[0];
        map.set(dStr, item);
      }
    }
    return map;
  }, [attendances]);

  // Compute calendar grid days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const totalDays = getDaysInMonth(monthStart);

    // Day of week: 0 for Monday ... 6 for Sunday (Indonesian standard)
    // Date.prototype.getDay() returns 0 for Sunday, 1 for Monday...
    const rawStartDay = monthStart.getDay();
    const startDayOffset = (rawStartDay + 6) % 7; // Monday = 0, Sunday = 6

    const days: Array<{
      dayNumber: number;
      dateStr: string;
      dateObj: Date;
      attendance?: MonthlyAttendance;
      isCurrentMonth: boolean;
    }> = [];

    // Empty offset slots
    for (let i = 0; i < startDayOffset; i++) {
      days.push({
        dayNumber: 0,
        dateStr: "",
        dateObj: new Date(0),
        isCurrentMonth: false,
      });
    }

    // Days in current month
    for (let day = 1; day <= totalDays; day++) {
      const dateObj = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      const dateStr = format(dateObj, "yyyy-MM-dd");
      const attendance = attendanceMap.get(dateStr);

      days.push({
        dayNumber: day,
        dateStr,
        dateObj,
        attendance,
        isCurrentMonth: true,
      });
    }

    return days;
  }, [currentDate, attendanceMap]);

  // Handle clicking on a calendar cell or card
  const handleAttendanceClick = (item?: MonthlyAttendance, dateStr?: string) => {
    if (!item && !dateStr) return;

    // Navigate to detail if it has an attendance record or attendance is 'hadir'
    if (item?.attendance_id || item?.attendance === "hadir") {
      navigate({
        to: "/attendance-detail",
        search: {
          attendance_id: item.attendance_id ? String(item.attendance_id) : "",
          employee_id: String(employeeId),
          date: item.date || dateStr || "",
        },
      });
    }
  };

  // Today's attendance computations
  const todayDateObj = new Date();
  const todayStr = format(todayDateObj, "yyyy-MM-dd");
  const todayAttendance = attendanceMap.get(todayStr);
  const isTodayPresent = todayAttendance?.attendance === "hadir";
  const isTodaySick = todayAttendance?.attendance === "sakit";
  const isTodayLeave = todayAttendance?.attendance === "cuti";
  const isTodayLate = Number(todayAttendance?.time_late) > 0;

  const dayHeaders = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-fuchsia-50/30">
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl flex flex-col">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-fuchsia-600 via-fuchsia-700 to-pink-600 text-white px-5 pt-8 pb-6 relative overflow-hidden shadow-lg">
          {/* Decorative background shapes */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-2xl transform translate-x-12 -translate-y-12" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-400/15 rounded-full blur-xl transform -translate-x-10 translate-y-10" />

          <div className="relative z-10">
            {/* Top Bar with back button */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigate({ to: "/" })}
                className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center hover:bg-white/25 active:scale-95 transition-all"
                title="Kembali"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>

              <h1 className="text-lg font-bold tracking-tight text-white">
                Daftar Kehadiran
              </h1>

              <button
                onClick={loadData}
                disabled={loading}
                className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center hover:bg-white/25 active:scale-95 transition-all"
                title="Muat Ulang"
              >
                <RotateCcw
                  className={`w-4 h-4 text-white ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            {/* Month Filter Selector */}
            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-2 flex items-center justify-between shadow-sm">
              <button
                onClick={handlePrevMonth}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-2 text-center">
                <CalendarIcon className="w-4 h-4 text-emerald-200" />
                <span className="font-semibold text-sm capitalize">
                  {format(currentDate, "MMMM yyyy", { locale: idLocale })}
                </span>
              </div>

              <button
                onClick={handleNextMonth}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Return to Today Button (if not in current month) */}
            {!isSameDay(startOfMonth(currentDate), startOfMonth(new Date())) && (
              <div className="mt-2 text-center">
                <button
                  onClick={handleTodayClick}
                  className="text-xs bg-white/20 hover:bg-white/30 text-white font-medium px-3 py-1 rounded-full transition-all"
                >
                  Kembali ke Bulan Ini
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Statistic Cards */}
        <div className="px-4 py-4 bg-slate-50/80 border-b border-gray-100">
          <div className="grid grid-cols-4 gap-2">
            {/* Hadir */}
            <div className="bg-white rounded-xl p-2.5 border border-emerald-100 shadow-sm flex flex-col items-center text-center">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-base font-extrabold text-emerald-600">
                {stats.total_present}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">Hadir</span>
            </div>

            {/* Keterlambatan */}
            <div className="bg-white rounded-xl p-2.5 border border-amber-100 shadow-sm flex flex-col items-center text-center">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-1">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-base font-extrabold text-amber-600">
                {stats.total_time_late}
                <span className="text-[10px] font-normal ml-0.5">m</span>
              </span>
              <span className="text-[10px] text-gray-500 font-medium">Telat</span>
            </div>

            {/* Sakit */}
            <div className="bg-white rounded-xl p-2.5 border border-rose-100 shadow-sm flex flex-col items-center text-center">
              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center mb-1">
                <HeartPulse className="w-4 h-4" />
              </div>
              <span className="text-base font-extrabold text-rose-600">
                {stats.total_sick}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">Sakit</span>
            </div>

            {/* Cuti */}
            <div className="bg-white rounded-xl p-2.5 border border-blue-100 shadow-sm flex flex-col items-center text-center">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-1">
                <Coffee className="w-4 h-4" />
              </div>
              <span className="text-base font-extrabold text-blue-600">
                {stats.total_leave}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">Cuti</span>
            </div>
          </div>
        </div>

        {/* Kehadiran Hari Ini (Ditempatkan di Atas Kalender) */}
        <div className="px-4 pt-4">
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white border border-emerald-200/90 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    Kehadiran Hari Ini
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </h3>
                  <p className="text-[11px] text-gray-500 capitalize">
                    {format(todayDateObj, "EEEE, d MMMM yyyy", { locale: idLocale })}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              {isTodayPresent ? (
                <span className="px-2.5 py-1 bg-emerald-500 text-white text-[11px] font-bold rounded-full shadow-sm flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Hadir</span>
                </span>
              ) : isTodaySick ? (
                <span className="px-2.5 py-1 bg-rose-500 text-white text-[11px] font-bold rounded-full shadow-sm">
                  Sakit
                </span>
              ) : isTodayLeave ? (
                <span className="px-2.5 py-1 bg-blue-500 text-white text-[11px] font-bold rounded-full shadow-sm">
                  Cuti
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-gray-200 text-gray-700 text-[11px] font-medium rounded-full">
                  Belum Absen
                </span>
              )}
            </div>

            {/* Clock In & Clock Out details */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-emerald-100/80">
              <div className="bg-white/90 rounded-xl p-2.5 border border-emerald-100 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                  <span className="flex items-center gap-1">
                    <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                    Clock In
                  </span>
                  {isTodayLate && (
                    <span className="text-[9px] text-rose-600 font-bold bg-rose-50 px-1 rounded">
                      +{todayAttendance?.time_late}m
                    </span>
                  )}
                </div>
                <p className="text-sm font-extrabold text-gray-900">
                  {todayAttendance?.clock_in_time || "-"}
                </p>
              </div>

              <div className="bg-white/90 rounded-xl p-2.5 border border-emerald-100 shadow-2xs">
                <div className="flex items-center gap-1 text-[11px] text-gray-500 mb-1">
                  <LogOut className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Clock Out</span>
                </div>
                <p className="text-sm font-extrabold text-gray-900">
                  {todayAttendance?.clock_out_time || "-"}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {isTodayPresent || todayAttendance?.attendance_id ? (
              <button
                onClick={() =>
                  handleAttendanceClick(
                    todayAttendance,
                    todayStr
                  )
                }
                className="w-full mt-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98 transition-all"
              >
                <span>Lihat Detail Kehadiran Hari Ini</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            ) : !todayAttendance?.clock_in_time ? (
              <button
                onClick={() => navigate({ to: "/clock-in" })}
                className="w-full mt-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Clock In Sekarang</span>
              </button>
            ) : !todayAttendance?.clock_out_time ? (
              <button
                onClick={() => navigate({ to: "/clock-out" })}
                className="w-full mt-3 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-fuchsia-600/20 active:scale-98 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Clock Out Pulang</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Big Calendar Section */}
        <div className="p-4 flex-1">
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden p-3.5">
            {/* Header: Legend */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 text-[11px] font-medium text-gray-600">
              <span className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-fuchsia-600" />
                Kalender Kerja
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Hadir
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  Telat
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  Sakit/Cuti
                </span>
              </div>
            </div>

            {/* Day Names Header */}
            <div className="grid grid-cols-7 gap-1.5 mb-2 text-center">
              {dayHeaders.map((header, idx) => (
                <div
                  key={header}
                  className={`text-[11px] font-bold py-1 ${
                    idx >= 5 ? "text-rose-500" : "text-gray-500"
                  }`}
                >
                  {header}
                </div>
              ))}
            </div>

            {/* Calendar Grid (Big Tiles) */}
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs text-gray-500 font-medium">
                  Memuat data kehadiran...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((cell, idx) => {
                  if (!cell.isCurrentMonth) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="min-h-[82px] rounded-xl bg-slate-50/50 border border-transparent"
                      />
                    );
                  }

                  const att = cell.attendance;
                  const isPresent = att?.attendance === "hadir";
                  const isSick = att?.attendance === "sakit";
                  const isLeave = att?.attendance === "cuti";
                  const isHoliday =
                    att?.day_status === "holiday" ||
                    (att?.events && att.events.length > 0);
                  const isWeekend =
                    cell.dateObj.getDay() === 0 || cell.dateObj.getDay() === 6;
                  const currentIsToday = isToday(cell.dateObj);
                  const timeLateNum = Number(att?.time_late) || 0;

                  // Green highlight for hadir as requested: "jika hadir diwarnai hijau"
                  let cellStyle =
                    "bg-white border border-gray-200/80 text-gray-700 hover:border-gray-300";

                  if (isPresent) {
                    // Prominent Vibrant Green Theme
                    cellStyle =
                      "bg-gradient-to-br from-emerald-500 to-green-600 text-white border-emerald-400 shadow-sm shadow-emerald-500/25 hover:from-emerald-600 hover:to-green-700 active:scale-98";
                  } else if (isSick) {
                    cellStyle =
                      "bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100";
                  } else if (isLeave) {
                    cellStyle =
                      "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100";
                  } else if (isHoliday || (isWeekend && !isPresent)) {
                    cellStyle =
                      "bg-slate-50 border-gray-100 text-gray-400";
                  }

                  if (currentIsToday) {
                    cellStyle += " ring-2 ring-fuchsia-500 ring-offset-1";
                  }

                  return (
                    <button
                      key={cell.dateStr}
                      onClick={() => handleAttendanceClick(att, cell.dateStr)}
                      className={`min-h-[84px] p-1.5 rounded-xl flex flex-col justify-between items-start transition-all relative group text-left cursor-pointer ${cellStyle}`}
                    >
                      {/* Top Row: Date Number & Badges */}
                      <div className="w-full flex items-center justify-between">
                        <span
                          className={`text-xs font-bold leading-none ${
                            isPresent
                              ? "text-white"
                              : currentIsToday
                              ? "text-fuchsia-600"
                              : isWeekend
                              ? "text-rose-500"
                              : "text-gray-700"
                          }`}
                        >
                          {cell.dayNumber}
                        </span>

                        {/* Presence or Late indicator badge */}
                        {isPresent && (
                          <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </span>
                        )}

                        {timeLateNum > 0 && !isPresent && (
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                        )}
                      </div>

                      {/* Middle/Bottom: Time or Status Detail */}
                      <div className="w-full mt-auto">
                        {isPresent ? (
                          <div className="space-y-0.5">
                            <div className="text-[9px] font-semibold tracking-tight text-emerald-100 truncate">
                              {att?.clock_in_time ? att.clock_in_time.slice(0, 5) : "Hadir"}
                            </div>
                            {timeLateNum > 0 ? (
                              <div className="text-[8px] bg-red-600/80 px-1 py-0.5 rounded text-white font-medium inline-block leading-none">
                                +{timeLateNum}m
                              </div>
                            ) : (
                              <div className="text-[8px] text-emerald-100/90 font-medium leading-none">
                                Tepat
                              </div>
                            )}
                          </div>
                        ) : isSick ? (
                          <span className="text-[9px] font-semibold text-rose-600 bg-rose-100/80 px-1 py-0.5 rounded block truncate">
                            Sakit
                          </span>
                        ) : isLeave ? (
                          <span className="text-[9px] font-semibold text-blue-600 bg-blue-100/80 px-1 py-0.5 rounded block truncate">
                            Cuti
                          </span>
                        ) : isHoliday ? (
                          <span className="text-[9px] font-medium text-rose-400 truncate block">
                            Libur
                          </span>
                        ) : (
                          <span className="text-[9px] text-gray-300 font-medium">
                            -
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
