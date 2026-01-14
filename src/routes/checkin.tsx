import {
  createFileRoute,
  useSearch,
  useNavigate,
} from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getApiBaseUrl } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

// Fix for default marker icon in React Leaflet
const defaultIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to update map center when location changes
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);
  return null;
}

export const Route = createFileRoute("/checkin")({
  component: CheckinPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      employee_id: (search.employee_id as string) || "",
    };
  },
});

interface Location {
  lat: number;
  lng: number;
  name: string;
}

function CheckinPage() {
  const { employee_id } = useSearch({ from: "/checkin" });
  const navigate = useNavigate();
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Compute validation error based on current state
  const getValidationError = (): string => {
    if (!photo && (!notes || notes.trim() === "")) {
      return "Foto dan catatan harus diisi";
    }
    if (!photo) {
      return "Foto harus diisi";
    }
    if (!notes || notes.trim() === "") {
      return "Catatan harus diisi";
    }
    return "";
  };

  const validationError = getValidationError();

  // Helper function to validate employee_id
  const isValidEmployeeId = (id: unknown): boolean => {
    if (!id) return false;
    const idString = String(id);
    return idString.trim() !== "" && idString !== "null";
  };

  useEffect(() => {
    // Get current location
    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // Reverse geocoding untuk mendapatkan nama lokasi
            fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            )
              .then((res) => res.json())
              .then((data) => {
                const locationName =
                  data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                setLocation({ lat, lng, name: locationName });
                setLoading(false);
              })
              .catch(() => {
                // Fallback jika reverse geocoding gagal
                setLocation({
                  lat,
                  lng,
                  name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                });
                setLoading(false);
              });
          },
          (err) => {
            let errorMessage = "Gagal mendapatkan lokasi.";

            if (err.code === err.PERMISSION_DENIED) {
              errorMessage =
                "Akses lokasi ditolak. Silakan aktifkan izin lokasi di pengaturan browser Anda.";
            } else if (err.code === err.POSITION_UNAVAILABLE) {
              errorMessage =
                "Informasi lokasi tidak tersedia. Pastikan GPS atau lokasi diaktifkan.";
            } else if (err.code === err.TIMEOUT) {
              errorMessage =
                "Waktu permintaan lokasi habis. Silakan coba lagi.";
            } else {
              errorMessage =
                "Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.";
            }

            setError(errorMessage);
            setLoading(false);
            setLocation(null);
          }
        );
      } else {
        setError(
          "Browser tidak mendukung geolocation. Silakan gunakan browser yang lebih baru."
        );
        setLoading(false);
        setLocation(null);
      }
    };

    getLocation();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("File harus berupa gambar");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran file maksimal 5MB");
        return;
      }

      setPhoto(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    // Reset file input
    const fileInput = document.getElementById(
      "photo-input"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleSaveClick = () => {
    if (!isValidEmployeeId(employee_id)) {
      setError(
        "Employee ID tidak ditemukan. Pastikan URL memiliki parameter employee_id."
      );
      return;
    }

    // Validate photo and notes
    if (!photo || !notes || notes.trim() === "") {
      return; // Validation error will be shown by alert
    }

    setIsDialogOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!location) return;
    if (!isValidEmployeeId(employee_id)) {
      setIsDialogOpen(false);
      setError(
        "Employee ID tidak ditemukan. Pastikan URL memiliki parameter employee_id."
      );
      alert(
        "Employee ID tidak ditemukan. Pastikan URL memiliki parameter employee_id."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current date and time
      const now = new Date();
      const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
      const time = now.toTimeString().split(" ")[0]; // HH:MM:SS

      // Get device details
      const deviceDetail = navigator.userAgent;

      // Get IP address (try to fetch from external service, fallback to empty)
      let ipAddress = "";
      try {
        const ipResponse = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip || "";
      } catch (err) {
        console.warn("Failed to get IP address:", err);
      }

      // Create FormData
      const formData = new FormData();
      formData.append("date", date);
      formData.append("time", time);
      formData.append("check_in_ip_address", ipAddress);
      formData.append("check_in_device_detail", deviceDetail);
      formData.append("check_in_latitude", location.lat.toString());
      formData.append("check_in_longitude", location.lng.toString());
      formData.append("check_in_location", location.name);
      formData.append("check_in_is_inside_office_radius", "0"); // TODO: Implement office radius check (0 = false, 1 = true)
      formData.append("note", notes || "");
      formData.append("employee_id", String(employee_id));

      // Add attachment if exists
      if (photo) {
        formData.append("attachment", photo);
      }

      // Send POST request
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/activities/check-in`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      // Parse response to ensure it's valid JSON
      await response.json();

      // Close dialog
      setIsDialogOpen(false);

      // Navigate to success page
      navigate({
        to: "/checkin-success",
        replace: true,
      });
    } catch (err) {
      console.error("Error submitting check-in:", err);
      // Close confirmation dialog
      setIsDialogOpen(false);
      // Set error message and open error dialog
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan check-in"
      );
      setIsErrorDialogOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validate employee_id
  const employeeIdError = !isValidEmployeeId(employee_id)
    ? "Employee ID tidak ditemukan. Pastikan URL memiliki parameter employee_id."
    : null;

  if (loading) {
    return (
      <div className="min-h-screen w-full max-w-md mx-auto flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Mengambil lokasi...</p>
        </div>
      </div>
    );
  }

  // Show error if employee_id is missing
  if (employeeIdError) {
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
            Employee ID Tidak Ditemukan
          </h2>
          <p className="text-gray-700 mb-6 leading-relaxed">
            {employeeIdError}
          </p>
        </div>
      </div>
    );
  }

  if (error || !location) {
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
            Lokasi Tidak Tersedia
          </h2>
          <p className="text-gray-700 mb-6 leading-relaxed">
            {error || "Lokasi tidak tersedia. Pastikan izin lokasi diaktifkan."}
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <p className="text-sm font-medium text-blue-900 mb-2">
              Cara mengaktifkan lokasi:
            </p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Buka pengaturan browser Anda</li>
              <li>Aktifkan izin lokasi untuk situs ini</li>
              <li>Pastikan GPS atau lokasi diaktifkan di perangkat</li>
              <li>Refresh halaman setelah mengaktifkan izin</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-md mx-auto bg-white flex flex-col">
      {/* Appbar */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => navigate({ to: "/" })}
            className="mr-3 p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Check In</h1>
        </div>
      </div>

      {/* Bagian atas - Maps (3/8 dari tinggi layar) */}
      <div className="h-[37.5vh] w-full relative">
        <MapContainer
          center={[location.lat, location.lng]}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[location.lat, location.lng]} icon={defaultIcon} />
          <MapUpdater center={[location.lat, location.lng]} />
        </MapContainer>
      </div>

      {/* Bagian bawah - Form (5/8 dari tinggi layar) */}
      <div className="flex-1 flex flex-col p-4 overflow-y-auto">
        {/* Nama Lokasi */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lokasi Saat Ini
          </label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm text-gray-900">{location.name}</p>
          </div>
        </div>

        {/* Input Foto */}
        <div className="mb-4">
          <label
            htmlFor="photo-input"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Foto
          </label>
          {!photoPreview ? (
            <label
              htmlFor="photo-input"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-12 h-12 mb-3 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Klik untuk ambil foto</span>
                </p>
              </div>
              <input
                id="photo-input"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </label>
          ) : (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg border border-gray-300"
              />
              <button
                onClick={handleRemovePhoto}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
                type="button"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Field Catatan */}
        <div className="mb-6 flex-1">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Catatan
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tulis catatan Anda di sini..."
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </div>

        {/* Validation Error Alert */}
        {validationError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <svg
                className="w-5 h-5 text-red-500 mt-0.5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-red-700 break-words">
                {validationError}
              </p>
            </div>
          </div>
        )}

        {/* Tombol Check In */}
        <div className="mb-4">
          <button
            onClick={handleSaveClick}
            disabled={!photo || !notes || notes.trim() === ""}
            className="w-full bg-[hsl(320,70%,50%)] hover:bg-[hsl(320,70%,45%)] text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[hsl(320,70%,50%)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[hsl(320,70%,50%)]"
          >
            Check In
          </button>
        </div>
      </div>

      {/* Dialog Konfirmasi */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Check-in</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin melakukan check-in?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Lokasi:
                </span>
                <p className="text-sm text-gray-900">{location.name}</p>
              </div>
              {photoPreview && (
                <div>
                  <span className="text-sm font-medium text-gray-700 block mb-2">
                    Foto:
                  </span>
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border border-gray-300"
                  />
                </div>
              )}
              {notes && (
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Catatan:
                  </span>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {notes}
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Batal
            </button>
            <button
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-[hsl(320,70%,50%)] rounded-lg hover:bg-[hsl(320,70%,45%)] focus:outline-none focus:ring-2 focus:ring-[hsl(320,70%,50%)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Menyimpan..." : "Check-in"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Error */}
      <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <DialogContent className="max-w-md overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-red-600">Error Check-in</DialogTitle>
            <DialogDescription>
              Terjadi kesalahan saat melakukan check-in
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 overflow-hidden">
            <div className="flex items-start space-x-3 min-w-0">
              <svg
                className="w-6 h-6 text-red-500 mt-0.5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-gray-700 leading-relaxed break-words min-w-0 flex-1">
                {errorMessage}
              </p>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsErrorDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium text-white bg-[hsl(320,70%,50%)] rounded-lg hover:bg-[hsl(320,70%,45%)] focus:outline-none focus:ring-2 focus:ring-[hsl(320,70%,50%)] focus:ring-offset-2"
            >
              Tutup
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
