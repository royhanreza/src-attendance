import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/checkout-success")({
  component: CheckoutSuccessPage,
});

function CheckoutSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full max-w-md mx-auto flex items-center justify-center bg-gray-50">
      <div className="text-center px-6 w-full">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-16 h-16 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Check-out Berhasil
        </h1>

        {/* Subtitle */}
        <p className="text-gray-600 text-base leading-relaxed mb-8">
          Boleh keluar dari halaman ini
        </p>

        {/* Back Button */}
        <button
          onClick={() => navigate({ to: "/" })}
          className="w-full max-w-xs mx-auto bg-gradient-to-r from-fuchsia-600 to-fuchsia-700 hover:from-fuchsia-700 hover:to-fuchsia-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-fuchsia-500/30"
        >
          Kembali ke Beranda
        </button>
      </div>
    </div>
  );
}
