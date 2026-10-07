import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Calendar, Clock, FileText, ArrowRight } from "lucide-react";
import type { TodayAttendance } from "@/lib/attendance";

export const Route = createFileRoute("/clock-in-success")({
  component: ClockInSuccessPage,
});

interface SuccessData {
  attendance?: TodayAttendance;
  quotes?: string;
}

function ClockInSuccessPage() {
  const navigate = useNavigate();
  const [data] = useState<SuccessData | null>(() => {
    try {
      const stored = sessionStorage.getItem("last_clock_in_result");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error("Error reading last clock in data:", e);
      return null;
    }
  });

  const attendance = data?.attendance;
  const quote = data?.quotes || "Setiap pagi adalah kesempatan baru untuk memulai yang terbaik!";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden p-6 sm:p-8 text-center space-y-6">
        {/* Animated Success Badge */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3 shadow-sm animate-in zoom-in-75 duration-300">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Clock In Berhasil!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kehadiran Anda telah tercatat ke dalam sistem
          </p>
        </div>

        {/* Inspirational Quote Card */}
        <div className="bg-gradient-to-br from-fuchsia-50 via-pink-50 to-rose-50 border border-fuchsia-100 p-4 rounded-2xl">
          <p className="text-xs italic text-fuchsia-900 leading-relaxed font-medium">
            "{quote}"
          </p>
        </div>

        {/* Attendance Summary Card */}
        {attendance && (
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Rincian Kehadiran
            </h2>

            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Tanggal
              </span>
              <span className="font-semibold text-slate-800">
                {attendance.date || "-"}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Waktu Masuk
              </span>
              <span className="font-semibold text-slate-800">
                {attendance.clock_in_time || attendance.clock_in_at || "-"}
              </span>
            </div>

            {attendance.clock_in_note && (
              <div className="text-xs py-1">
                <span className="text-slate-500 flex items-center gap-1.5 mb-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Catatan
                </span>
                <p className="font-medium text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                  {attendance.clock_in_note}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Back to Home Button */}
        <div>
          <button
            onClick={() => navigate({ to: "/" })}
            className="w-full py-3.5 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white rounded-xl font-bold text-xs shadow-md shadow-fuchsia-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Kembali ke Beranda</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
