import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getApiBaseUrl } from "@/lib/api";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronRight,
} from "lucide-react";
import { format, getDaysInMonth, startOfMonth, addDays } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export const Route = createFileRoute("/activity-history")({
  component: ActivityHistoryPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      employee_id: (search.employee_id as string) || "",
    };
  },
});

interface ActivityHistory {
  id: number;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
}

function ActivityHistoryPage() {
  const { employee_id } = useSearch({ from: "/activity-history" });
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(
    currentDate.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    currentDate.getFullYear(),
  );

  useEffect(() => {
    if (!employee_id) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const apiBaseUrl = getApiBaseUrl();
        const response = await fetch(
          `${apiBaseUrl}/activities/history?employee_id=${employee_id}&month=${selectedMonth}&year=${selectedYear}`,
        );
        if (response.ok) {
          const result = await response.json();
          setActivities(result.data || []);
        } else {
          setActivities([]);
        }
      } catch (error) {
        console.error("Error fetching history:", error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [employee_id, selectedMonth, selectedYear]);

  const handleBack = () => {
    navigate({ to: "/" });
  };

  const currentMonthDate = new Date(selectedYear, selectedMonth - 1, 1);
  const daysInMonth = getDaysInMonth(currentMonthDate);
  const days = Array.from({ length: daysInMonth }, (_, i) =>
    addDays(startOfMonth(currentMonthDate), i),
  );

  // Options for months and years
  const months = [
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 sticky top-0 z-10 shadow-md">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl transition-all duration-200"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Riwayat Aktifitas
            </h1>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4 mb-6 relative z-0">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Pilih Periode
                </h2>
                <p className="text-xs text-gray-500">
                  Tampilkan riwayat berdasarkan bulan
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">
                  Bulan
                </label>
                <div className="relative">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 appearance-none font-medium"
                  >
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">
                  Tahun
                </label>
                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 appearance-none font-medium"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 w-8 h-8"></div>
                <p className="mt-3 text-sm text-gray-500 font-medium opacity-70">
                  Memuat data...
                </p>
              </div>
            ) : (
              days.map((day, index) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const dayActivities = activities.filter(
                  (a) => a.date === dateStr,
                );
                const hasActivity = dayActivities.length > 0;
                const latestActivity = dayActivities[0]; // Since it's ordered by ID or similar
                const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;
                const isFuture = day > new Date();

                return (
                  <button
                    key={index}
                    disabled={isFuture && !hasActivity}
                    onClick={() => {
                      if (hasActivity || !isFuture) {
                        navigate({
                          to: "/activity-detail",
                          search: {
                            employee_id: String(employee_id),
                            date: dateStr,
                          },
                        });
                      }
                    }}
                    className={`w-full flex items-center p-4 rounded-2xl border transition-all duration-200 text-left
                      ${
                        isFuture && !hasActivity
                          ? "bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed"
                          : hasActivity
                            ? "bg-white border-blue-100 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5"
                            : "bg-white border-gray-100 hover:bg-gray-50"
                      }
                    `}
                  >
                    {/* Date Bubble */}
                    <div
                      className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 mr-4 shadow-sm
                        ${
                          isToday
                            ? "bg-blue-600 text-white"
                            : hasActivity
                              ? "bg-blue-50 text-blue-700"
                              : "bg-gray-100 text-gray-500"
                        }
                      `}
                    >
                      <span className="text-xs font-semibold uppercase tracking-wider mb-0.5">
                        {format(day, "EEE", { locale: idLocale })}
                      </span>
                      <span className="text-lg font-bold leading-none">
                        {format(day, "dd")}
                      </span>
                    </div>

                    {/* Status Content */}
                    <div className="flex-1 min-w-0">
                      {hasActivity ? (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {latestActivity.check_out_time
                                ? "Selesai"
                                : "Sedang Berjalan"}
                            </p>
                            {dayActivities.length > 1 && (
                              <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                {dayActivities.length} Sesi
                              </span>
                            )}
                          </div>
                          <div className="flex items-center text-xs text-gray-500 font-medium">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                            Check In: {latestActivity.check_in_time || "-"}
                            {latestActivity.check_out_time && (
                              <>
                                <span className="mx-2 text-gray-300">•</span>
                                Check Out: {latestActivity.check_out_time}
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-gray-400">
                            {isFuture
                              ? "Belum tersedia"
                              : "Tidak ada aktivitas"}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="ml-3 flex-shrink-0">
                      <ChevronRight
                        className={`w-5 h-5 ${hasActivity ? "text-blue-400" : "text-gray-300"}`}
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
