import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/api";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export const Route = createFileRoute("/activity-check")({
  component: ActivityCheckPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      employee_id: (search.employee_id as string) || "",
      date: (search.date as string) || "",
    };
  },
});

function ActivityCheckPage() {
  const { employee_id, date } = useSearch({ from: "/activity-check" });
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  // Helper function to validate employee_id
  const isValidEmployeeId = (id: unknown): boolean => {
    if (!id) return false;
    const idString = String(id);
    return idString.trim() !== "" && idString !== "null";
  };

  useEffect(() => {
    const fetchCurrentState = async () => {
      // Validate employee_id
      if (!isValidEmployeeId(employee_id)) {
        setError(
          "Employee ID tidak ditemukan. Pastikan URL memiliki parameter employee_id."
        );
        return;
      }

      try {
        // Get current date if not provided
        const currentDate = date || new Date().toISOString().split("T")[0];

        // Fetch current activity state
        const apiBaseUrl = getApiBaseUrl();
        const url = new URL(`${apiBaseUrl}/activities/current-state`);
        url.searchParams.append("employee_id", String(employee_id));
        url.searchParams.append("date", currentDate);

        const response = await fetch(url.toString());

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }

        const result = await response.json();
        const currentState = result.data?.toString() || result.data;

        // Redirect based on current state
        if (currentState === "check_in") {
          navigate({
            to: "/checkin",
            search: { employee_id: String(employee_id) },
          });
        } else if (currentState === "check_out") {
          navigate({
            to: "/checkout",
            search: { employee_id: String(employee_id) },
          });
        } else {
          setError(
            `Status aktivitas tidak dikenal: ${currentState}. Silakan hubungi administrator.`
          );
        }
      } catch (err) {
        console.error("Error fetching current state:", err);
        setError(
          `Gagal mengambil status aktivitas: ${
            err instanceof Error ? err.message : "Terjadi kesalahan"
          }`
        );
      }
    };

    fetchCurrentState();
  }, [employee_id, date, navigate]);

  if (error) {
    return (
      <div className="min-h-screen w-full max-w-md mx-auto flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-sm w-full">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Terjadi Kesalahan
          </h2>
          <p className="text-gray-700 mb-6 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-md mx-auto flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {/* Lottie Animation Placeholder - Replace with actual Lottie component when installed */}
        {/* <div className="mb-6">
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 border-4 border-[hsl(320,70%,50%)] border-t-transparent rounded-full animate-spin"></div>
            <div
              className="absolute inset-4 border-4 border-[hsl(320,70%,50%)] border-b-transparent rounded-full animate-spin"
              style={{
                animationDirection: "reverse",
                animationDuration: "0.8s",
              }}
            ></div>
          </div>
        </div> */}
        <DotLottieReact
          src="https://lottie.host/3d7a770a-44a1-40fe-b92e-b85b070bb6df/Kek9CxO29W.lottie"
          loop
          autoplay
        />
        <p className="text-gray-600 text-lg">Memeriksa status aktivitas...</p>
        {/* 
        TODO: Replace the spinner above with Lottie animation when lottie-react is installed:
        
        import Lottie from "lottie-react";
        import loadingAnimation from "@/assets/loading.json"; // or your Lottie JSON file
        
        <Lottie 
          animationData={loadingAnimation} 
          loop={true} 
          className="w-64 h-64 mx-auto"
        />
        */}
      </div>
    </div>
  );
}
