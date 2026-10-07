import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Clock,
  Calendar,
  MapPin,
  FileText,
  Camera,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  X,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  fetchAttendanceDetail,
  fetchMonthlyAttendances,
  type AttendanceDetailData,
} from "../lib/attendance";

interface AttendanceDetailSearch {
  attendance_id?: string;
  employee_id?: string;
  date?: string;
}

export const Route = createFileRoute("/attendance-detail")({
  component: AttendanceDetailPage,
  validateSearch: (search: Record<string, unknown>): AttendanceDetailSearch => {
    return {
      attendance_id: (search.attendance_id as string) || undefined,
      employee_id: (search.employee_id as string) || undefined,
      date: (search.date as string) || undefined,
    };
  },
});

function AttendanceDetailPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/attendance-detail" });
  const { attendance_id, employee_id, date } = search;

  const [detail, setDetail] = useState<AttendanceDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (attendance_id) {
        const res = await fetchAttendanceDetail(attendance_id);
        if (res) {
          setDetail(res);
          setLoading(false);
          return;
        }
      }

      // Fallback: If attendance_id is empty or detail endpoint failed, load monthly attendances for that day
      if (employee_id && date) {
        const monthStr = date.slice(0, 7); // "YYYY-MM"
        const monthly = await fetchMonthlyAttendances(employee_id, monthStr);
        const match = monthly.attendances.find((a) => a.date === date);
        if (match) {
          // If match has attendance_id, try fetching with that id
          if (match.attendance_id && String(match.attendance_id) !== attendance_id) {
            const res = await fetchAttendanceDetail(match.attendance_id);
            if (res) {
              setDetail(res);
              setLoading(false);
              return;
            }
          }

          // Otherwise construct detail from monthly attendance record
          setDetail({
            id: match.attendance_id || undefined,
            date: match.date,
            clock_in_time: match.clock_in_time,
            clock_in_note: match.clock_in_note,
            clock_out_time: match.clock_out_time,
            clock_out_note: match.clock_out_note,
            time_late: match.time_late,
            is_long_shift: match.is_long_shift,
            status: match.attendance || "hadir",
          });
        }
      }
    } catch (err) {
      console.error("Error loading attendance detail:", err);
    } finally {
      setLoading(false);
    }
  }, [attendance_id, employee_id, date]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const displayDate = detail?.date || date || format(new Date(), "yyyy-MM-dd");
  const formattedDate = format(new Date(displayDate), "EEEE, d MMMM yyyy", {
    locale: idLocale,
  });

  const timeLate = Number(detail?.time_late) || 0;
  const isLate = timeLate > 0;

  const openInMap = (lat?: string | null, lng?: string | null) => {
    if (!lat || !lng) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-fuchsia-50/30">
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl flex flex-col">
        {/* Top Header */}
        <div className="bg-gradient-to-br from-fuchsia-600 via-fuchsia-700 to-pink-600 text-white px-5 pt-8 pb-6 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-2xl transform translate-x-12 -translate-y-12" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() =>
                  navigate({
                    to: "/attendance",
                    search: { employee_id: employee_id || "", month: date?.slice(0, 7) || "" },
                  })
                }
                className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center hover:bg-white/25 active:scale-95 transition-all"
                title="Kembali"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>

              <h1 className="text-lg font-bold text-white">Detail Kehadiran</h1>

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

            {/* Date and Status Banner */}
            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <p className="text-xs text-white/80 font-medium">Tanggal</p>
                  <p className="text-sm font-bold text-white capitalize">
                    {formattedDate}
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-md flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Hadir</span>
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 space-y-4">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs text-gray-500 font-medium">
                Mengambil data detail kehadiran...
              </p>
            </div>
          ) : !detail ? (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border border-gray-200 p-6">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-gray-800">
                Detail Kehadiran Tidak Ditemukan
              </h3>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                Tidak ada data absensi yang tercatat untuk tanggal ini.
              </p>
              <button
                onClick={() =>
                  navigate({
                    to: "/attendance",
                    search: { employee_id: employee_id || "", month: date?.slice(0, 7) || "" },
                  })
                }
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
              >
                Kembali ke Kalender
              </button>
            </div>
          ) : (
            <>
              {/* Late / Punctual Status Alert */}
              {isLate ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center space-x-3 text-amber-800">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">Terlambat Masuk</h4>
                    <p className="text-[11px] text-amber-700">
                      Anda tercatat terlambat selama {timeLate} menit dari jam jadwal masuk.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center space-x-3 text-emerald-800">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">Hadir Tepat Waktu</h4>
                    <p className="text-[11px] text-emerald-700">
                      Kehadiran Anda tercatat sesuai jadwal kerja yang berlaku.
                    </p>
                  </div>
                </div>
              )}

              {/* Clock In Card */}
              <div className="bg-white rounded-2xl border border-emerald-200/80 p-4 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Clock In</h3>
                      <p className="text-[10px] text-gray-500">Masuk Kerja</p>
                    </div>
                  </div>

                  <span className="text-sm font-black text-emerald-600">
                    {detail.clock_in_time || "-"}
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Notes */}
                  <div className="flex items-start space-x-2.5">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold text-gray-500">Catatan</p>
                      <p className="text-xs text-gray-800 font-medium">
                        {detail.clock_in_note || "Tidak ada catatan"}
                      </p>
                    </div>
                  </div>

                  {/* Photo Attachment */}
                  {detail.clock_in_attachment && (
                    <div className="flex items-start space-x-2.5">
                      <Camera className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-[11px] font-semibold text-gray-500 mb-1.5">
                          Foto Bukti
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedPhoto(detail.clock_in_attachment || null)}
                          className="group relative rounded-xl overflow-hidden border border-gray-200 block shadow-sm"
                        >
                          <img
                            src={detail.clock_in_attachment}
                            alt="Clock In Attachment"
                            className="w-28 h-28 object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-medium">
                            Perbesar
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Coordinates / Map */}
                  {detail.clock_in_latitude && detail.clock_in_longitude && (
                    <div className="flex items-start space-x-2.5">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-[11px] font-semibold text-gray-500">Lokasi</p>
                        <p className="text-xs text-gray-800 font-mono">
                          {detail.clock_in_latitude}, {detail.clock_in_longitude}
                        </p>
                        <button
                          onClick={() =>
                            openInMap(detail.clock_in_latitude, detail.clock_in_longitude)
                          }
                          className="mt-1 text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                        >
                          <span>Buka di Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Clock Out Card */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-fuchsia-600 text-white flex items-center justify-center shadow-sm">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Clock Out</h3>
                      <p className="text-[10px] text-gray-500">Pulang Kerja</p>
                    </div>
                  </div>

                  <span
                    className={`text-sm font-black ${
                      detail.clock_out_time ? "text-fuchsia-600" : "text-gray-400"
                    }`}
                  >
                    {detail.clock_out_time || "Belum Clock Out"}
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Notes */}
                  <div className="flex items-start space-x-2.5">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold text-gray-500">Catatan</p>
                      <p className="text-xs text-gray-800 font-medium">
                        {detail.clock_out_note || "Tidak ada catatan"}
                      </p>
                    </div>
                  </div>

                  {/* Photo Attachment */}
                  {detail.clock_out_attachment && (
                    <div className="flex items-start space-x-2.5">
                      <Camera className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-[11px] font-semibold text-gray-500 mb-1.5">
                          Foto Bukti
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedPhoto(detail.clock_out_attachment || null)
                          }
                          className="group relative rounded-xl overflow-hidden border border-gray-200 block shadow-sm"
                        >
                          <img
                            src={detail.clock_out_attachment}
                            alt="Clock Out Attachment"
                            className="w-28 h-28 object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-medium">
                            Perbesar
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Coordinates / Map */}
                  {detail.clock_out_latitude && detail.clock_out_longitude && (
                    <div className="flex items-start space-x-2.5">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-[11px] font-semibold text-gray-500">Lokasi</p>
                        <p className="text-xs text-gray-800 font-mono">
                          {detail.clock_out_latitude}, {detail.clock_out_longitude}
                        </p>
                        <button
                          onClick={() =>
                            openInMap(
                              detail.clock_out_latitude,
                              detail.clock_out_longitude
                            )
                          }
                          className="mt-1 text-xs text-fuchsia-600 hover:text-fuchsia-700 font-semibold flex items-center gap-1"
                        >
                          <span>Buka di Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Meta / Shift Info */}
              {(detail.is_long_shift || detail.employee?.name) && (
                <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 text-xs space-y-2">
                  <h4 className="font-bold text-gray-800 mb-1">
                    Informasi Tambahan
                  </h4>
                  {detail.employee?.name && (
                    <div className="flex justify-between text-gray-600">
                      <span>Karyawan:</span>
                      <span className="font-semibold text-gray-900">
                        {detail.employee.name}
                      </span>
                    </div>
                  )}
                  {detail.is_long_shift && (
                    <div className="flex justify-between text-gray-600">
                      <span>Status Shift:</span>
                      <span className="font-semibold text-amber-600">
                        Long Shift
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Photo Lightbox Modal */}
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative max-w-sm w-full bg-black rounded-2xl overflow-hidden shadow-2xl">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={selectedPhoto}
                alt="Enlarged Attachment"
                className="w-full h-auto max-h-[80vh] object-contain mx-auto"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
