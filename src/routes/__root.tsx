import {
  createRootRoute,
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useAuthStore } from "../stores/authStore";
import { useEffect, useState } from "react";

// Conditionally load devtools only in development
function DevTools() {
  const [Devtools, setDevtools] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    if (import.meta.env.DEV) {
      import("@tanstack/router-devtools").then((module) => {
        setDevtools(() => module.TanStackRouterDevtools);
      });
    }
  }, []);

  if (!Devtools) return null;
  return <Devtools />;
}

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isLoginPage = location.pathname === "/login";
  const isHomePage = location.pathname === "/";
  const isCheckinPage = location.pathname === "/checkin";
  const isCheckoutPage = location.pathname === "/checkout";
  const isActivityCheckPage = location.pathname === "/activity-check";
  const isCheckinSuccessPage = location.pathname === "/checkin-success";
  const isCheckoutSuccessPage = location.pathname === "/checkout-success";
  const isActivityHistoryPage = location.pathname === "/activity-history";
  const isActivityDetailPage = location.pathname === "/activity-detail";
  const isAttendancePage = location.pathname === "/attendance";
  const isAttendanceDetailPage = location.pathname === "/attendance-detail";
  const isClockInPage = location.pathname === "/clock-in";
  const isClockOutPage = location.pathname === "/clock-out";
  const isClockInSuccessPage = location.pathname === "/clock-in-success";
  const isClockOutSuccessPage = location.pathname === "/clock-out-success";
  const hideHeader =
    isLoginPage ||
    isHomePage ||
    isCheckinPage ||
    isCheckoutPage ||
    isActivityCheckPage ||
    isCheckinSuccessPage ||
    isCheckoutSuccessPage ||
    isActivityHistoryPage ||
    isActivityDetailPage ||
    isAttendancePage ||
    isAttendanceDetailPage ||
    isClockInPage ||
    isClockOutPage ||
    isClockInSuccessPage ||
    isClockOutSuccessPage;

  // Redirect to login if not authenticated (except on login page)
  useEffect(() => {
    if (!isAuthenticated && !isLoginPage) {
      navigate({ to: "/login" });
    }
    // Redirect to home if authenticated and on login page
    if (isAuthenticated && isLoginPage) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, isLoginPage, navigate]);

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  // Don't render protected content if not authenticated
  if (!isAuthenticated && !isLoginPage) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen w-full">
        {!hideHeader && (
          <nav className="border-b bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <Link
                    to="/"
                    className="text-xl font-bold text-gray-900 hover:text-gray-700"
                  >
                    Magenta Activity
                  </Link>
                </div>
                <div className="flex items-center space-x-4">
                  <Link
                    to="/"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    activeProps={{
                      className: "text-gray-900 font-semibold",
                    }}
                  >
                    Home
                  </Link>
                  <Link
                    to="/checkin"
                    search={(prev) => ({ ...prev, employee_id: "" })}
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    activeProps={{
                      className: "text-gray-900 font-semibold",
                    }}
                  >
                    Check-in
                  </Link>
                  <Link
                    to="/checkout"
                    search={(prev) => ({ ...prev, employee_id: "" })}
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    activeProps={{
                      className: "text-gray-900 font-semibold",
                    }}
                  >
                    Check-out
                  </Link>
                  <Link
                    to="/about"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    activeProps={{
                      className: "text-gray-900 font-semibold",
                    }}
                  >
                    About
                  </Link>
                  {user && (
                    <div className="flex items-center space-x-2 border-l pl-4 ml-4">
                      <span className="text-sm text-gray-600">
                        {user.employee?.name || user.username}
                      </span>
                      <button
                        onClick={handleLogout}
                        className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </nav>
        )}
        <main>
          <Outlet />
        </main>
      </div>
      <DevTools />
    </>
  );
}
