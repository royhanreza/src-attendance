import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getApiBaseUrl } from "@/lib/api";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Activity,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export const Route = createFileRoute("/activity-detail")({
  component: ActivityDetailPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      employee_id: (search.employee_id as string) || "",
      date: (search.date as string) || "",
    };
  },
});

interface ActivityItem {
  id: number;
  note: string;
  attachment: string | null;
}

interface ActivityDetail {
  id: number;
  date: string;
  check_in_time: string | null;
  check_in_location: string | null;
  check_in_note: string | null;
  check_in_attachment: string | null;
  check_out_time: string | null;
  check_out_location: string | null;
  check_out_note: string | null;
  check_out_attachment: string | null;
  items: ActivityItem[];
}

function ActivityDetailPage() {
  const { employee_id, date } = useSearch({ from: "/activity-detail" });
  const navigate = useNavigate();
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!employee_id || !date) {
      setError("Parameter tidak lengkap.");
      setLoading(false);
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const apiBaseUrl = getApiBaseUrl();
        const response = await fetch(
          `${apiBaseUrl}/activities/by-date?employee_id=${employee_id}&date=${date}`,
        );
        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setActivity(result.data);
          } else {
            setError("Aktivitas tidak ditemukan untuk tanggal ini.");
          }
        } else {
          setError("Gagal mengambil data aktivitas.");
        }
      } catch (err) {
        console.error("Error fetching detail:", err);
        setError("Terjadi kesalahan jaringan.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [employee_id, date]);

  const handleBack = () => {
    navigate({
      to: "/activity-history",
      search: { employee_id: String(employee_id) },
    });
  };

  const formattedDate = date
    ? format(new Date(date), "EEEE, dd MMMM yyyy", { locale: idLocale })
    : "";

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center">
      <div className="w-full max-w-md bg-[#F8FAFC] min-h-screen relative pb-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 sticky top-0 z-10 shadow-md">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl transition-all duration-200"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-white tracking-tight truncate">
                Detail Aktifitas
              </h1>
              <p className="text-xs text-blue-100 font-medium mt-0.5 truncate">
                {formattedDate}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="inline-block animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 w-10 h-10"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-5 rounded-2xl text-center border border-red-100 shadow-sm">
              <p className="font-medium">{error}</p>
            </div>
          ) : activity ? (
            <>
              {/* Check In Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 opacity-50"></div>

                <div className="flex items-center space-x-3 mb-5 relative">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Check In</h2>
                </div>

                <div className="space-y-4 relative">
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Waktu</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {activity.check_in_time || "-"}
                      </p>
                    </div>
                  </div>

                  {activity.check_in_location && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">
                          Lokasi
                        </p>
                        <p className="text-sm text-gray-800">
                          {activity.check_in_location}
                        </p>
                      </div>
                    </div>
                  )}

                  {activity.check_in_note && (
                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">
                          Catatan
                        </p>
                        <p className="text-sm text-gray-800">
                          {activity.check_in_note}
                        </p>
                      </div>
                    </div>
                  )}

                  {activity.check_in_attachment && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 font-medium mb-2">
                        Foto Check In
                      </p>
                      <img
                        src={activity.check_in_attachment}
                        alt="Check In"
                        className="w-full h-48 object-cover rounded-2xl border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Check Out Card */}
              {activity.check_out_time ? (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden mt-6">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50 rounded-full -mr-12 -mt-12 opacity-50"></div>

                  <div className="flex items-center space-x-3 mb-5 relative">
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-pink-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Check Out
                    </h2>
                  </div>

                  <div className="space-y-4 relative">
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">
                          Waktu
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {activity.check_out_time}
                        </p>
                      </div>
                    </div>

                    {activity.check_out_location && (
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">
                            Lokasi
                          </p>
                          <p className="text-sm text-gray-800">
                            {activity.check_out_location}
                          </p>
                        </div>
                      </div>
                    )}

                    {activity.check_out_note && (
                      <div className="flex items-start space-x-3">
                        <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">
                            Catatan
                          </p>
                          <p className="text-sm text-gray-800">
                            {activity.check_out_note}
                          </p>
                        </div>
                      </div>
                    )}

                    {activity.check_out_attachment && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 font-medium mb-2">
                          Foto Check Out
                        </p>
                        <img
                          src={activity.check_out_attachment}
                          alt="Check Out"
                          className="w-full h-48 object-cover rounded-2xl border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-3xl p-6 text-center border-2 border-dashed border-gray-200 mt-6">
                  <p className="text-gray-500 font-medium">
                    Belum melakukan Check Out
                  </p>
                </div>
              )}

              {/* Activity Items */}
              {activity.items && activity.items.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center space-x-3 mb-4 px-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">
                      Rincian Aktivitas
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {activity.items.map((item, index) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
                      >
                        <div className="flex items-center space-x-3 mb-3 pb-3 border-b border-gray-50">
                          <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-sm font-semibold text-gray-700">
                            Aktivitas {index + 1}
                          </span>
                        </div>

                        <p className="text-sm text-gray-800 mb-4 whitespace-pre-wrap">
                          {item.note}
                        </p>

                        {item.attachment && (
                          <div className="mt-2">
                            <img
                              src={item.attachment}
                              alt={`Aktivitas ${index + 1}`}
                              className="w-full h-40 object-cover rounded-xl border border-gray-200"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
