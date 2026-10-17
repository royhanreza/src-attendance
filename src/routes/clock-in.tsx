import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft,
  Camera,
  MapPin,
  Clock,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  AlertTriangle,
  RotateCcw,
  LogIn,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { API_ENDPOINTS, EXTERNAL_APIS } from "@/lib/api";
import { compressImage } from "@/lib/utils";
import {
  fetchEmployeeDetail,
  fetchWorkingPatterns,
  fetchPermissionCategories,
  fetchPermissionNotes,
  isInsideOfficeRadius,
  calculateTimeLate,
  type EmployeeDetail,
  type WorkingPattern,
  type PermissionCategory,
  type PermissionNote,
} from "@/lib/attendance";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Leaflet marker icons
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

export const Route = createFileRoute("/clock-in")({
  component: ClockInPage,
});

function ClockInPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Employee & Config states
  const [employeeDetail, setEmployeeDetail] = useState<EmployeeDetail | null>(null);
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(true);

  // Dynamic Shift & Permission states
  const [workingPatterns, setWorkingPatterns] = useState<WorkingPattern[]>([]);
  const [selectedWorkingPatternId, setSelectedWorkingPatternId] = useState<string>("");
  const [selectedWorkingPatternName, setSelectedWorkingPatternName] = useState<string>("Pilih Shift");
  const [isWorkingPatternModalOpen, setIsWorkingPatternModalOpen] = useState(false);

  const [permissionCategories, setPermissionCategories] = useState<PermissionCategory[]>([]);
  const [selectedPermissionCategoryId, setSelectedPermissionCategoryId] = useState<string>("");
  const [selectedPermissionCategoryName, setSelectedPermissionCategoryName] = useState<string>("Ajukan Izin");
  const [isPermissionCategoryModalOpen, setIsPermissionCategoryModalOpen] = useState(false);

  const [permissionNotes, setPermissionNotes] = useState<PermissionNote[]>([]);
  const [selectedPermissionNote, setSelectedPermissionNote] = useState<string>("");

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

  // Time & Status computations
  const [timeLate, setTimeLate] = useState<number>(0);
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

  // Confirm modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const employeeId = user?.employee_id || user?.employee?.id;

  // Determine office info
  const officeLat = Number(employeeDetail?.office?.latitude || 0);
  const officeLng = Number(employeeDetail?.office?.longitude || 0);
  const officeRadius = Number(employeeDetail?.office?.radius || 30);
  const hasOffice = officeLat !== 0 || officeLng !== 0;

  const isInsideCircle = userLocation && hasOffice
    ? isInsideOfficeRadius(userLocation.lat, userLocation.lng, officeLat, officeLng, officeRadius)
    : false;

  const isSpecialDivision = Boolean(
    employeeDetail?.is_aerplus_employee ||
      employeeDetail?.is_src_cleaning_service ||
      employeeDetail?.is_src_security
  );

  const hasWorkingPattern = Boolean(
    employeeDetail?.active_working_pattern_id || selectedWorkingPatternId
  );

  // Determine if note is mandatory
  const isNoteRequired = !isInsideCircle || timeLate > 0 || selectedPermissionCategoryId !== "";

  // 1. Fetch employee details and initial configs
  useEffect(() => {
    if (!employeeId) return;

    const loadData = async () => {
      setIsLoadingEmployee(true);
      const detail = await fetchEmployeeDetail(employeeId);
      setEmployeeDetail(detail);

      if (detail) {
        // Late calculation
        const lateMins = calculateTimeLate(detail.today_clock_in_time);
        setTimeLate(lateMins);

        // Active working pattern fallback
        if (detail.active_working_pattern_id) {
          setSelectedWorkingPatternId(String(detail.active_working_pattern_id));
          if (detail.working_pattern_name) {
            setSelectedWorkingPatternName(detail.working_pattern_name);
          }
        }

        // Fetch dynamic working patterns if special division
        if (detail.is_aerplus_employee) {
          const wp = await fetchWorkingPatterns("aerplus", employeeId);
          setWorkingPatterns(wp);
        } else if (detail.is_src_cleaning_service) {
          const wp = await fetchWorkingPatterns("cleaning_service_src", employeeId);
          setWorkingPatterns(wp);
        } else if (detail.is_src_security) {
          const wp = await fetchWorkingPatterns("security_src", employeeId);
          setWorkingPatterns(wp);
        }
      }

      // Fetch permission categories and notes
      const [categories, pNotes] = await Promise.all([
        fetchPermissionCategories(),
        fetchPermissionNotes(),
      ]);
      setPermissionCategories(categories);
      setPermissionNotes(pNotes);

      setIsLoadingEmployee(false);
    };

    loadData();
  }, [employeeId]);

  // 2. Fetch User Geolocation & Reverse Geocode
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

  // Validation & Open Confirmation Modal
  const handleClockInClick = () => {
    // 1. Division shift validation
    const workingPatternIdToUse = isSpecialDivision
      ? selectedWorkingPatternId
      : employeeDetail?.active_working_pattern_id || selectedWorkingPatternId;

    if (isSpecialDivision && (!workingPatternIdToUse || workingPatternIdToUse === "")) {
      setValidationModal({
        isOpen: true,
        title: "Ada yang kurang nih",
        message: "Kamu belum pilih shift kerja",
      });
      return;
    }

    // 2. Photo validation
    if (!photo) {
      setValidationModal({
        isOpen: true,
        title: "Ada yang kurang nih",
        message: "Harus ambil foto",
      });
      return;
    }

    // 3. Permission reasons validation
    if (selectedPermissionCategoryId !== "" && !selectedPermissionNote) {
      setValidationModal({
        isOpen: true,
        title: "Ada yang kurang nih",
        message: "Pilih alasan izin",
      });
      return;
    }

    // 4. Permission note text validation
    if (selectedPermissionCategoryId !== "" && (!note || note.trim() === "")) {
      setValidationModal({
        isOpen: true,
        title: "Ada yang kurang nih",
        message: "Harus isi catatan kalau kamu mengajukan izin",
      });
      return;
    }

    // 5. Outside office or Late note validation
    if (!isInsideCircle && (!note || note.trim() === "")) {
      setValidationModal({
        isOpen: true,
        title: "Ada yang kurang nih",
        message: "Harus isi catatan kalau kamu telat atau di luar area kantor",
      });
      return;
    }

    if (timeLate > 0 && (!note || note.trim() === "")) {
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
        message: "Harap tunggu lokasi terdeteksi sebelum melakukan Clock In.",
      });
      return;
    }

    setIsConfirmModalOpen(true);
  };

  // Submit Clock In
  const handleSaveClockIn = async () => {
    const workingPatternIdToUse = isSpecialDivision
      ? selectedWorkingPatternId
      : employeeDetail?.active_working_pattern_id || selectedWorkingPatternId;

    if (!userLocation || !photo) {
      return;
    }

    // Build FormData
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
      const clockInTime = `${hours}:${minutes}:${seconds}`;
      const clockInAt = `${date} ${clockInTime}`;

      // IP address retrieval
      let ipAddress = "";
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        ipAddress = ipData.ip || "";
      } catch {
        ipAddress = "";
      }

      // Note formatting matching mobile: "${permissionNote}---${note}"
      let finalNote = note.trim();
      if (selectedPermissionNote) {
        finalNote = `${selectedPermissionNote}---${note.trim()}`;
      }

      const formData = new FormData();
      formData.append("date", date);
      formData.append("clock_in_time", clockInTime);
      formData.append("clock_in_at", clockInAt);
      formData.append("clock_in_ip_address", ipAddress);
      formData.append("clock_in_device_detail", navigator.userAgent);
      formData.append("clock_in_latitude", String(userLocation.lat));
      formData.append("clock_in_longitude", String(userLocation.lng));
      formData.append("clock_in_is_inside_office_radius", isInsideCircle ? "1" : "0");
      formData.append("clock_in_office_latitude", String(officeLat));
      formData.append("clock_in_office_longitude", String(officeLng));
      formData.append("clock_in_note", finalNote);
      formData.append("employee_id", String(employeeId));
      formData.append("working_pattern_id", String(workingPatternIdToUse || ""));

      if (selectedPermissionCategoryId) {
        formData.append("permission_category_id", String(selectedPermissionCategoryId));
      }

      if (photo) {
        formData.append("clock_in_attachment", photo);
      }

      const response = await fetch(API_ENDPOINTS.ATTENDANCE.CLOCK_IN, {
        method: "POST",
        body: formData,
      });

      const resData = await response.json();

      if (!response.ok || resData.error) {
        throw new Error(resData.message || "Gagal menyimpan absensi kehadiran.");
      }

      // Success: Save in sessionStorage for the success screen display
      sessionStorage.setItem(
        "last_clock_in_result",
        JSON.stringify({
          attendance: resData.data,
          quotes: resData.quotes || "Awali hari dengan semangat dan pikiran positif!",
        })
      );

      setIsConfirmModalOpen(false);
      navigate({ to: "/clock-in-success" });
    } catch (err: unknown) {
      console.error("Clock In failed:", err);
      setIsConfirmModalOpen(false);
      const msg = err instanceof Error ? err.message : "Kehadiran kamu gagal disimpan. Silakan coba lagi.";
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
      {/* Top Map Section (45% height) */}
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
                  color: "#3b82f6",
                  fillColor: "#60a5fa",
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
                <RefreshCw className="w-8 h-8 animate-spin text-fuchsia-600 mb-2" />
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
                  className="mt-3 px-4 py-1.5 text-xs bg-white text-fuchsia-600 rounded-full font-semibold shadow-sm border border-fuchsia-200"
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

          {/* Special Division Shift Selector */}
          {isSpecialDivision && (
            <button
              onClick={() => setIsWorkingPatternModalOpen(true)}
              className="px-3.5 py-2 bg-white/95 backdrop-blur-md rounded-full shadow-md border border-fuchsia-200 text-fuchsia-700 flex items-center gap-1.5 text-xs font-medium active:scale-95 transition-all truncate max-w-[140px]"
            >
              <Clock className="w-3.5 h-3.5 text-fuchsia-600 flex-shrink-0" />
              <span className="truncate">{selectedWorkingPatternName}</span>
            </button>
          )}

          {/* Late Permit / Permission Category button */}
          <button
            onClick={() => setIsPermissionCategoryModalOpen(true)}
            className="px-3.5 py-2 bg-white/95 backdrop-blur-md rounded-full shadow-md border border-amber-200 text-amber-700 flex items-center gap-1.5 text-xs font-medium active:scale-95 transition-all truncate max-w-[130px]"
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span className="truncate">{selectedPermissionCategoryName}</span>
          </button>

          {/* Refresh Location Button */}
          <button
            onClick={determineLocation}
            className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-full shadow-md flex items-center justify-center text-slate-700 hover:text-slate-900 active:scale-95 transition-all"
          >
            <MapPin className="w-5 h-5 text-fuchsia-600" />
          </button>
        </div>
      </div>

      {/* Bottom Sheet Card Section */}
      <div className="flex-1 bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] -mt-6 z-10 px-5 pt-6 pb-6 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-4">
          {/* Header Row: Location text & Camera box */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-fuchsia-600 uppercase tracking-wider block mb-1">
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
                id="camera-clockin-input"
              />

              {photoPreview ? (
                <div className="relative group w-20 h-20 rounded-2xl overflow-hidden border-2 border-fuchsia-500 shadow-md">
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
                  className="w-20 h-20 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-fuchsia-600 transition-all active:scale-95 group shadow-sm"
                >
                  <Camera className="w-6 h-6 group-hover:scale-110 transition-transform mb-1" />
                  <span className="text-[10px] font-medium">Foto</span>
                </button>
              )}
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 pt-1">
            {/* Office Radius Badge */}
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

            {/* Working Pattern Warning if none configured */}
            {!hasWorkingPattern && !isSpecialDivision && !isLoadingEmployee && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5" />
                Kamu belum ada pola kerja
              </span>
            )}

            {/* Late Badge */}
            {timeLate > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                <Clock className="w-3.5 h-3.5" />
                Telat {timeLate} menit
              </span>
            )}
          </div>

          {/* Conditional Reasons & Notes Section */}
          {isNoteRequired && (
            <div className="pt-2 space-y-3">
              {/* Permission Notes Choice Chips if permission category is chosen */}
              {selectedPermissionCategoryId !== "" && permissionNotes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">
                    Pilih Alasan Izin:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {permissionNotes.map((pn) => {
                      const isSelected = selectedPermissionNote === pn.note;
                      return (
                        <button
                          key={pn.id}
                          type="button"
                          onClick={() =>
                            setSelectedPermissionNote(isSelected ? "" : pn.note)
                          }
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                            isSelected
                              ? "bg-fuchsia-600 text-white shadow-sm"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                          }`}
                        >
                          {pn.note}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Note Text Field */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Catatan Kehadiran {!isInsideCircle || timeLate > 0 ? "(Wajib jika telat / di luar kantor)" : ""}
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    selectedPermissionCategoryId !== ""
                      ? "Tulis keterangan izin Anda..."
                      : "Tulis alasan jika berada di luar kantor atau terlambat..."
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 text-xs text-slate-800 placeholder-slate-400 bg-slate-50/50 resize-none transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tombol Konfirmasi Clock In */}
        <div className="pt-6">
          <button
            type="button"
            onClick={handleClockInClick}
            disabled={isLocationLoading || !userLocation || isSubmitting}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 active:scale-98 text-white font-bold text-sm shadow-lg shadow-fuchsia-600/25 flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <LogIn className="w-5 h-5" />
            <span>Clock In Sekarang</span>
          </button>
        </div>
      </div>

      {/* Modal: Konfirmasi Clock In */}
      <Dialog
        open={isConfirmModalOpen}
        onOpenChange={(open) => {
          if (!isSubmitting) setIsConfirmModalOpen(open);
        }}
      >
        <DialogContent className="max-w-xs sm:max-w-sm rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center flex-shrink-0">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Konfirmasi Clock In
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-600 mt-1 leading-relaxed">
                Apakah Anda yakin ingin melakukan Clock In sekarang? Pastikan data kehadiran Anda sudah sesuai.
              </DialogDescription>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Waktu:</span>
              <span className="font-semibold text-slate-900">
                {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Lokasi:</span>
              <span className={`font-semibold ${isInsideCircle ? "text-emerald-600" : "text-amber-600"}`}>
                {isInsideCircle ? "Dalam Radius Kantor" : "Luar Radius Kantor"}
              </span>
            </div>
            {timeLate > 0 && (
              <div className="flex items-center justify-between text-slate-600">
                <span>Keterlambatan:</span>
                <span className="font-semibold text-rose-600">+{timeLate} menit</span>
              </div>
            )}
            {selectedWorkingPatternName && (
              <div className="flex items-center justify-between text-slate-600">
                <span>Shift:</span>
                <span className="font-semibold text-slate-900 truncate max-w-[150px]">
                  {selectedWorkingPatternName}
                </span>
              </div>
            )}
            {selectedPermissionCategoryName && selectedPermissionCategoryId !== "" && (
              <div className="flex items-center justify-between text-slate-600">
                <span>Kategori Izin:</span>
                <span className="font-semibold text-amber-700">
                  {selectedPermissionCategoryName}
                </span>
              </div>
            )}
            {note && (
              <div className="pt-1.5 border-t border-slate-200/60 text-slate-600">
                <span className="block text-[11px] text-slate-400">Catatan:</span>
                <p className="text-slate-800 italic mt-0.5 break-words line-clamp-2">"{note}"</p>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 flex gap-2 sm:gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsConfirmModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSaveClockIn}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white text-xs font-bold transition-all shadow-md shadow-fuchsia-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Ya, Clock In</span>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Dynamic Working Patterns (Shift Selection) */}
      <Dialog open={isWorkingPatternModalOpen} onOpenChange={setIsWorkingPatternModalOpen}>
        <DialogContent className="max-w-xs sm:max-w-sm rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Pilih Shift Kerja
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pilih shift yang sesuai dengan jadwal kerja Anda hari ini.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-1.5 max-h-60 overflow-y-auto">
            {workingPatterns.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                Tidak ada shift yang tersedia.
              </p>
            ) : (
              workingPatterns.map((wp) => {
                const isSelected = String(wp.id) === selectedWorkingPatternId;
                return (
                  <button
                    key={wp.id}
                    onClick={() => {
                      setSelectedWorkingPatternId(String(wp.id));
                      setSelectedWorkingPatternName(wp.name);
                      setIsWorkingPatternModalOpen(false);
                    }}
                    className={`w-full p-3 rounded-xl text-left flex items-center justify-between text-xs transition-all ${
                      isSelected
                        ? "bg-fuchsia-50 text-fuchsia-700 font-semibold border border-fuchsia-200"
                        : "hover:bg-slate-50 text-slate-700 border border-transparent"
                    }`}
                  >
                    <span>{wp.name}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-fuchsia-600" />}
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Permission Categories */}
      <Dialog
        open={isPermissionCategoryModalOpen}
        onOpenChange={setIsPermissionCategoryModalOpen}
      >
        <DialogContent className="max-w-xs sm:max-w-sm rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Ajukan Izin Kehadiran
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pilih kategori izin jika Anda terlambat atau berhalangan sesuai prosedur.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-1.5 max-h-60 overflow-y-auto">
            {/* Option to clear permission */}
            <button
              onClick={() => {
                setSelectedPermissionCategoryId("");
                setSelectedPermissionCategoryName("Ajukan Izin");
                setSelectedPermissionNote("");
                setIsPermissionCategoryModalOpen(false);
              }}
              className="w-full p-3 rounded-xl text-left text-xs text-slate-500 hover:bg-slate-50 border border-dashed border-slate-200"
            >
              Tanpa Izin (Hadir Biasa)
            </button>

            {permissionCategories.map((pc) => {
              const isSelected = String(pc.id) === selectedPermissionCategoryId;
              return (
                <button
                  key={pc.id}
                  onClick={() => {
                    setSelectedPermissionCategoryId(String(pc.id));
                    setSelectedPermissionCategoryName(pc.name);
                    setIsPermissionCategoryModalOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl text-left flex items-center justify-between text-xs transition-all ${
                    isSelected
                      ? "bg-amber-50 text-amber-700 font-semibold border border-amber-200"
                      : "hover:bg-slate-50 text-slate-700 border border-transparent"
                  }`}
                >
                  <span>{pc.name}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Validation Notice ("Ada yang kurang nih") */}
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
              className="w-full py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-bold transition-all shadow-md shadow-fuchsia-500/20 active:scale-95"
            >
              Oke
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Error on save with Retry ("Oops! Kehadiran kamu gagal disimpan") */}
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
              Kehadiran kamu gagal disimpan
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
                handleSaveClockIn();
              }}
              className="w-full py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-fuchsia-500/20 active:scale-95"
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
