// resources/js/lib/googleMapsLoader.js
//
// Loader Google Maps TERPUSAT untuk seluruh aplikasi.
// Sebelumnya Dashboard.jsx dan Rute.jsx masing-masing bikin <script>
// Google Maps sendiri dengan parameter `libraries` yang berbeda
// (geometry vs places). Kalau halaman A dibuka lebih dulu, halaman B
// mengira window.google.maps sudah "siap" padahal library yang B
// butuhkan belum ke-load -> crash.
//
// Sekarang: SATU promise dibagi ke seluruh komponen. Semua yang minta
// loadGoogleMaps() akan menunggu proses yang sama, dan library yang
// di-request selalu digabung (places + geometry) supaya semua halaman
// aman pakai fungsi apapun dari Google Maps.

let loaderPromise = null;

export function loadGoogleMaps(apiKey, libraries = ['places', 'geometry']) {
  if (!apiKey) {
    return Promise.reject(new Error('API Key tidak ditemukan'));
  }

  // Kalau semua library yang diminta sudah tersedia, langsung resolve
  const hasAllLibraries = libraries.every((lib) => !!window.google?.maps?.[lib]);
  if (hasAllLibraries) {
    return Promise.resolve(window.google);
  }

  // Kalau sudah ada proses loading yang berjalan, ikut proses itu saja
  if (loaderPromise) {
    return loaderPromise;
  }

  loaderPromise = new Promise((resolve, reject) => {
    // Buang script Google Maps lama kalau ada, karena library-nya
    // mungkin tidak lengkap (misal cuma geometry, tanpa places).
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );
    if (existingScript) {
      existingScript.remove();
    }

    const callbackName = '__googleMapsLoaderCallback';
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries.join(
      ','
    )}&loading=async&callback=${callbackName}`;
    script.async = true;
    script.defer = true;

    window[callbackName] = () => {
      delete window[callbackName];
      resolve(window.google);
    };

    script.onerror = () => {
      loaderPromise = null; // biar percobaan berikutnya bisa retry
      reject(new Error('Gagal memuat Google Maps'));
    };

    document.head.appendChild(script);
  });

  return loaderPromise;
}