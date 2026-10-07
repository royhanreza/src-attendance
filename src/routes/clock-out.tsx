import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft,
  Camera,
  MapPin,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  AlertTriangle,
  RotateCcw,
  AlertCircle,
  Check,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { API_ENDPOINTS, EXTERNAL_APIS } from "@/lib/api";
import { compressImage } from "@/lib/utils";
import {
  fetchEmployeeDetail,
  isInsideOfficeRadius,
  type EmployeeDetail,
} from "@/lib/attendance";
import { SlideButton } from "@/components/SlideButton";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Leaflet marker icon
const userMarkerIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapPanController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 17);
  }, [center, map]);
  return null;
}

export const Route = createFileRoute("/clock-out")({
  component: ClockOutPage,
});

function ClockOutPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Employee details
  const [employeeDetail, setEmployeeDetail] = useState<EmployeeDetail | null>(null);

  // Location states
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentStreet, setCurrentStreet] = useState<string>("");
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Photo & Note states
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [note, setNote] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Long shift state for Aerplus
  const [isLongShift, setIsLongShift] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation modal state
  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: "Ada yang kurang nih",
    message: "",
  });

  // Error modal state
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    message: string;
  }>({
    isOpen: false,
    message: "",
  });

  const employeeId = user?.employee_id || user?.employee?.id;

  // Office info
  const officeLat = Number(employeeDetail?.office?.latitude || 0);
  const officeLng = Number(employeeDetail?.office?.longitude || 0);
  const officeRadius = Number(employeeDetail?.office?.radius || 30);
  const hasOffice = officeLat !== 0 || officeLng !== 0;

  const isInsideCircle = userLocation && hasOffice
    ? isInsideOfficeRadius(userLocation.lat, userLocation.lng, officeLat, officeLng, officeRadius)
    : false;

  // 1. Fetch employee details
  useEffect(() => {
    if (!employeeId) return;

    const loadData = async () => {
      const detail = await fetchEmployeeDetail(employeeId);
      setEmployeeDetail(detail);
    };

    loadData();
  }, [employeeId]);

  // 2. Geolocation & Reverse Geocode
  const determineLocation = useCallback(() => {
    setIsLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Browser Anda tidak mendukung geolokasi.");
      setIsLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });

        // Reverse geocoding via Nominatim
        try {
          const res = await fetch(
            `${EXTERNAL_APIS.NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          if (res.ok) {
            const data = await res.json();
            const road =
              data.address?.road ||
              data.address?.pedestrian ||
              data.address?.suburb ||
              "Lokasi Kamu";
            setCurrentStreet(road);
            setCurrentAddress(data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          } else {
            setCurrentStreet("Lokasi Terdeteksi");
            setCurrentAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          }
        } catch {
          setCurrentStreet("Lokasi Terdeteksi");
          setCurrentAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        } finally {
          setIsLocationLoading(false);
        }
      },
      (err) => {
        setIsLocationLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError("Izin lokasi ditolak. Silakan aktifkan izin lokasi di browser Anda.");
        } else {
          setLocationError("Gagal mendeteksi lokasi saat ini. Pastikan GPS aktif.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  useEffect(() => {
    determineLocation();
  }, [determineLocation]);

  // Photo handlers
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setValidationModal({
        isOpen: true,
        title: "File tidak sesuai",
        message: "File yang dipilih harus berupa gambar.",
      });
      return;
    }

    try {
      const compressed = await compressImage(file, 1200, 1200, 0.6);
      setPhoto(compressed);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(compressed);
    } catch (err) {
      console.error("Compression error:", err);
      setValidationModal({
        isOpen: true,
        title: "Gagal memproses foto",
        message: "Silakan coba ambil foto kembali.",
      });
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Validation & Submit
  const handleSaveClockOut = async () => {
    // 1. Photo validation
    if (!photo) {
      setValidationModal({
        isOpen: true,
        title: "Ada yang kurang nih",
        message: "Harus ambil foto",
      });
      return;
    }

    // 2. Note validation if outside office radius
    if (!isInsideCircle && (!note || note.trim() === "")) {
      setValidationModal({
        isOpen: true,
        title: "Ada yang kurang nih",
        message: "Harus isi catatan kalau kamu telat atau di luar area kantor",
      });
      return;
    }

    if (!userLocation) {
      setValidationModal({
        isOpen: true,
        title: "Lokasi belum terdeteksi",
        message: "Harap tunggu lokasi terdeteksi sebelum melakukan Clock Out.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const date = `${year}-${month}-${day}`;

      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const clockOutTime = `${hours}:${minutes}:${seconds}`;
      const clockOutAt = `${date} ${clockOutTime}`;

      // IP address
      let ipAddress = "";
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        ipAddress = ipData.ip || "";
      } catch {
        ipAddress = "";
      }

      const formData = new FormData();
      formData.append("date", date);
      formData.append("clock_out_time", clockOutTime);
      formData.append("clock_out_at", clockOutAt);
      formData.append("clock_out_ip_address", ipAddress);
      formData.append("clock_out_device_detail", navigator.userAgent);
      formData.append("clock_out_latitude", String(userLocation.lat));
      formData.append("clock_out_longitude", String(userLocation.lng));
      formData.append("clock_out_is_inside_office_radius", isInsideCircle ? "1" : "0");
      formData.append("clock_out_office_latitude", String(officeLat));
      formData.append("clock_out_office_longitude", String(officeLng));
      formData.append("clock_out_note", note.trim());
      formData.append("employee_id", String(employeeId));
      formData.append(
        "working_pattern_id",
        String(employeeDetail?.active_working_pattern_id || "")
      );

      if (isLongShift) {
        formData.append("is_long_shift", "1");
      }

      if (photo) {
        formData.append("clock_out_attachment", photo);
      }

      const response = await fetch(API_ENDPOINTS.ATTENDANCE.CLOCK_OUT, {
        method: "POST",
        body: formData,
      });

      const resData = await response.json();

      if (!response.ok || resData.error) {
        throw new Error(resData.message || "Gagal menyimpan absensi pulang.");
      }

      // Success: Save in sessionStorage for the success screen display
      sessionStorage.setItem(
        "last_clock_out_result",
        JSON.stringify({
          attendance: resData.data,
        })
      );

      navigate({ to: "/clock-out-success" });
    } catch (err: unknown) {
      console.error("Clock Out failed:", err);
      const msg = err instanceof Error ? err.message : "Kehadiran pulang kamu gagal disimpan. Silakan coba lagi.";
      setErrorModal({
        isOpen: true,
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto relative shadow-2xl overflow-x-hidden">
      {/* Top Map Section */}
      <div className="relative h-[42vh] w-full bg-slate-200 overflow-hidden">
        {userLocation ? (
          <MapContainer
            center={[userLocation.lat, userLocation.lng]}
            zoom={17}
            zoomControl={false}
            attributionControl={false}
            className="w-full h-full z-0"
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapPanController center={[userLocation.lat, userLocation.lng]} />

            {/* Current user marker */}
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userMarkerIcon} />

            {/* Office radius circle if office coordinates exist */}
            {hasOffice && (
              <Circle
                center={[officeLat, officeLng]}
                radius={officeRadius}
                pathOptions={{
                  color: "#2563eb",
                  fillColor: "#3b82f6",
                  fillOpacity: 0.25,
                  weight: 2,
                }}
              />
            )}
          </MapContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200 text-slate-500">
            {isLocationLoading ? (
              <>
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                <p className="text-xs font-medium">Mendeteksi lokasi GPS...</p>
              </>
            ) : (
              <>
                <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
                <p className="text-xs font-medium px-6 text-center text-slate-600">
                  {locationError || "Lokasi belum tersedia"}
                </p>
                <button
                  onClick={determineLocation}
                  className="mt-3 px-4 py-1.5 text-xs bg-white text-blue-600 rounded-full font-semibold shadow-sm border border-blue-200"
                >
                  Coba Lagi
                </button>
              </>
            )}
          </div>
        )}

        {/* Top Floating Action Bar */}
        <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between gap-2">
          {/* Back button */}
          <button
            onClick={() => navigate({ to: "/" })}
            className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-full shadow-md flex items-center justify-center text-slate-700 hover:text-slate-900 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Long Shift Toggle for Aerplus Employee */}
          {employeeDetail?.is_aerplus_employee && (
            <button
              onClick={() => setIsLongShift(!isLongShift)}
              className={`px-4 py-2 rounded-full shadow-md text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all ${
                isLongShift
                  ? "bg-blue-600 text-white"
                  : "bg-white/95 text-blue-600 border border-blue-300"
              }`}
            >
              {isLongShift ? (
                <Check className="w-3.5 h-3.5 text-white" />
              ) : (
                <div className="w-3 h-3 rounded-full border border-blue-600" />
              )}
              <span>Long Shift</span>
            </button>
          )}

          {/* Refresh Location Button */}
          <button
            onClick={determineLocation}
            className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-full shadow-md flex items-center justify-center text-slate-700 hover:text-slate-900 active:scale-95 transition-all"
          >
            <MapPin className="w-5 h-5 text-blue-600" />
          </button>
        </div>
      </div>

      {/* Bottom Sheet Card Section */}
      <div className="flex-1 bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] -mt-6 z-10 px-5 pt-6 pb-6 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-4">
          {/* Header Row: Location text & Camera box */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-1">
                Lokasimu saat ini
              </span>
              <h2 className="text-base font-bold text-slate-900 leading-snug line-clamp-1">
                {currentStreet || "Mencari alamat..."}
              </h2>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {currentAddress || "Sedang memuat alamat lengkap lokasi Anda..."}
              </p>
            </div>

            {/* Selfie / Camera Box */}
            <div className="flex-shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handlePhotoCapture}
                className="hidden"
                id="camera-clockout-input"
              />

              {photoPreview ? (
                <div className="relative group w-20 h-20 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-md">
                  <img
                    src={photoPreview}
                    alt="Selfie"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={handleRemovePhoto}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 transition-all active:scale-95 group shadow-sm"
                >
                  <Camera className="w-6 h-6 group-hover:scale-110 transition-transform mb-1" />
                  <span className="text-[10px] font-medium">Foto</span>
                </button>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex flex-wrap gap-2 pt-1">
            {!hasOffice ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5" />
                Kamu belum ada kantor
              </span>
            ) : isInsideCircle ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Kamu di dalam area kantor
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                <XCircle className="w-3.5 h-3.5" />
                Kamu di luar area kantor
              </span>
            )}
          </div>

          {/* Notes Input Field */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Catatan {!isInsideCircle ? "(Wajib jika di luar kantor)" : "(Opsional)"}
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tulis catatan jika diperlukan..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800 placeholder-slate-400 bg-slate-50/50 resize-none transition-all"
            />
          </div>
        </div>

        {/* Swipe to Clock Out Slider */}
        <div className="pt-6">
          <SlideButton
            label="Geser untuk clock out"
            themeColor="blue"
            isLoading={isSubmitting}
            disabled={isLocationLoading || !userLocation}
            onSuccess={handleSaveClockOut}
          />
        </div>
      </div>

      {/* Modal: Validation Notice */}
      <Dialog
        open={validationModal.isOpen}
        onOpenChange={(open) =>
          setValidationModal((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent className="max-w-xs sm:max-w-sm rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                {validationModal.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-600 mt-1 leading-relaxed">
                {validationModal.message}
              </DialogDescription>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <button
              onClick={() =>
                setValidationModal((prev) => ({ ...prev, isOpen: false }))
              }
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95"
            >
              Oke
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Error on save with Retry */}
      <Dialog
        open={errorModal.isOpen}
        onOpenChange={(open) =>
          setErrorModal((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent className="max-w-xs sm:max-w-sm rounded-2xl p-5">
          <div className="text-center py-2">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <XCircle className="w-8 h-8" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900 mb-1">
              Oops!
            </DialogTitle>
            <p className="text-xs text-slate-500 mb-3">
              Kehadiran pulang kamu gagal disimpan
            </p>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-left mb-4">
              <p className="text-xs text-rose-700 leading-relaxed font-medium">
                {errorModal.message}
              </p>
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2">
            <button
              onClick={() => {
                setErrorModal((prev) => ({ ...prev, isOpen: false }));
                handleSaveClockOut();
              }}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              Kirim Ulang
            </button>
            <button
              onClick={() => setErrorModal((prev) => ({ ...prev, isOpen: false }))}
              className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Tutup
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
