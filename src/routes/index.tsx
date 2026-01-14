import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "../stores/authStore";
import { Activity, User, LogOut, Calendar, Clock, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { getApiBaseUrl } from "../lib/api";

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
  const [activeActivity, setActiveActivity] = useState<ActiveActivity | null>(
    null
  );

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const handleActivityClick = () => {
    if (user?.employee_id) {
      const currentDate = new Date().toISOString().split("T")[0];
      navigate({
        to: "/activity-check",
        search: {
          employee_id: String(user.employee_id),
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

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Fetch active activity
  useEffect(() => {
    const fetchActiveActivity = async () => {
      if (!user?.employee_id) {
        return;
      }

      try {
        const today = new Date();
        const currentDateStr = today.toISOString().split("T")[0];
        const apiBaseUrl = getApiBaseUrl();
        const response = await fetch(
          `${apiBaseUrl}/activities/active-activity?employee_id=${user.employee_id}&date=${currentDateStr}`
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

    fetchActiveActivity();
  }, [user?.employee_id]);

  const handleCheckoutClick = () => {
    if (user?.employee_id) {
      navigate({
        to: "/checkout",
        search: {
          employee_id: String(user.employee_id),
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-fuchsia-50">
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl">
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
              </div>
            </div>

            {/* Date Display */}
            <div className="mt-4 flex items-center space-x-2 text-white/80">
              <Calendar className="w-4 h-4" />
              <p className="text-xs font-medium">{formattedDate}</p>
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="px-6 py-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Menu Utama</h2>
            <p className="text-sm text-gray-500">
              Pilih menu untuk melanjutkan
            </p>
          </div>

          <div className="space-y-4">
            {/* Aktifitas Menu */}
            <button
              onClick={handleActivityClick}
              className="group w-full bg-white border border-gray-200 rounded-2xl p-5 flex items-center space-x-4 hover:border-fuchsia-300 hover:shadow-lg hover:shadow-fuchsia-100 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900 text-base mb-1">
                  Buat Aktifitas
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Cek dan kelola status aktivitas harian Anda
                </p>
              </div>
              <div className="text-gray-400 group-hover:text-fuchsia-600 transition-colors">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* Active Activity Section */}
        {activeActivity && (
          <div className="px-6 pb-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Aktifitas yang Sedang Aktif
              </h2>
              <p className="text-sm text-gray-500">
                Anda sedang dalam sesi aktifitas
              </p>
            </div>

            <div className="bg-gradient-to-br from-fuchsia-50 to-pink-50 border-2 border-fuchsia-200 rounded-2xl p-5 shadow-sm">
              <div className="space-y-4">
                {/* Check-in Time */}
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-fuchsia-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-fuchsia-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-medium mb-1">
                      Check-in Time
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {activeActivity.check_in_time || "-"}
                    </p>
                  </div>
                </div>

                {/* Location */}
                {activeActivity.check_in_location && (
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-fuchsia-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-fuchsia-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-medium mb-1">
                        Lokasi
                      </p>
                      <p className="text-sm text-gray-900 line-clamp-2">
                        {activeActivity.check_in_location}
                      </p>
                    </div>
                  </div>
                )}

                {/* Note */}
                {activeActivity.check_in_note && (
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-fuchsia-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Activity className="w-5 h-5 text-fuchsia-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-medium mb-1">
                        Catatan
                      </p>
                      <p className="text-sm text-gray-900 line-clamp-3">
                        {activeActivity.check_in_note}
                      </p>
                    </div>
                  </div>
                )}

                {/* Photo Preview */}
                {activeActivity.check_in_attachment && (
                  <div className="mt-3">
                    <img
                      src={activeActivity.check_in_attachment}
                      alt="Check-in photo"
                      className="w-full h-48 object-cover rounded-xl border-2 border-fuchsia-200"
                    />
                  </div>
                )}

                {/* Check-out Button */}
                <button
                  onClick={handleCheckoutClick}
                  className="w-full mt-4 bg-gradient-to-r from-fuchsia-600 to-fuchsia-700 hover:from-fuchsia-700 hover:to-fuchsia-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-fuchsia-500/30"
                >
                  Check Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className="px-6 pb-8">
          <button
            onClick={handleLogout}
            className="w-full bg-white border-2 border-red-200 rounded-2xl p-4 flex items-center justify-center space-x-3 hover:bg-red-50 hover:border-red-300 transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <LogOut className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-red-600">Keluar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
