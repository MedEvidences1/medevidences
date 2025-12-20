import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API, SUPPORTED_LANGUAGES } from "@/lib/constants";

// =============================================================================
// LANGUAGE HOOK
// =============================================================================

const TRANSLATIONS = {
  en: {
    dashboard: "Dashboard",
    forecast: "AI Forecast",
    deep_forecast: "Deep Forecast",
    investment_suite: "Investment Banking Suite",
    disasters: "Disasters",
    astrology: "Vedic Astrology",
    tabular: "Probability Streams",
    holographic: "3D Visualization",
    accuracy: "Accuracy",
    admin: "Admin Panel",
    chat: "AI Chat",
    login: "Login",
    logout: "Logout",
    welcome: "Welcome to Plutus Predict",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    save: "Save",
    delete: "Delete",
    share: "Share",
    send: "Send",
    clear: "Clear",
    export: "Export",
    team: "Team",
    security: "Security",
    emails: "Emails",
    documents: "Documents",
    payments: "Payments",
    settings: "Settings",
    overview: "Overview",
    analytics: "Analytics",
  },
  es: {
    dashboard: "Panel de Control",
    forecast: "Pronóstico IA",
    deep_forecast: "Pronóstico Profundo",
    investment_suite: "Suite de Banca de Inversión",
    disasters: "Desastres",
    astrology: "Astrología Védica",
    tabular: "Flujos de Probabilidad",
    holographic: "Visualización 3D",
    accuracy: "Precisión",
    admin: "Panel de Admin",
    chat: "Chat IA",
    login: "Iniciar Sesión",
    logout: "Cerrar Sesión",
    welcome: "Bienvenido a Plutus Predict",
    loading: "Cargando...",
    error: "Error",
    success: "Éxito",
    save: "Guardar",
    delete: "Eliminar",
    share: "Compartir",
    send: "Enviar",
    clear: "Limpiar",
    export: "Exportar",
    team: "Equipo",
    security: "Seguridad",
    emails: "Correos",
    documents: "Documentos",
    payments: "Pagos",
    settings: "Configuración",
    overview: "Resumen",
    analytics: "Análisis",
  },
  fr: {
    dashboard: "Tableau de Bord",
    forecast: "Prévision IA",
    deep_forecast: "Prévision Approfondie",
    investment_suite: "Suite Banque d'Investissement",
    disasters: "Catastrophes",
    astrology: "Astrologie Védique",
    tabular: "Flux de Probabilité",
    holographic: "Visualisation 3D",
    accuracy: "Précision",
    admin: "Panneau Admin",
    chat: "Chat IA",
    login: "Connexion",
    logout: "Déconnexion",
    welcome: "Bienvenue sur Plutus Predict",
    loading: "Chargement...",
    error: "Erreur",
    success: "Succès",
    save: "Sauvegarder",
    delete: "Supprimer",
    share: "Partager",
    send: "Envoyer",
    clear: "Effacer",
    export: "Exporter",
    team: "Équipe",
    security: "Sécurité",
    emails: "Emails",
    documents: "Documents",
    payments: "Paiements",
    settings: "Paramètres",
    overview: "Aperçu",
    analytics: "Analytique",
  },
  ar: {
    dashboard: "لوحة التحكم",
    forecast: "توقعات الذكاء الاصطناعي",
    deep_forecast: "توقعات عميقة",
    investment_suite: "جناح الخدمات المصرفية",
    disasters: "الكوارث",
    astrology: "علم التنجيم الفيدي",
    tabular: "تدفقات الاحتمالات",
    holographic: "تصور ثلاثي الأبعاد",
    accuracy: "الدقة",
    admin: "لوحة الإدارة",
    chat: "دردشة الذكاء الاصطناعي",
    login: "تسجيل الدخول",
    logout: "تسجيل الخروج",
    welcome: "مرحباً بك في بلوتس بريديكت",
    loading: "جاري التحميل...",
    error: "خطأ",
    success: "نجاح",
    save: "حفظ",
    delete: "حذف",
    share: "مشاركة",
    send: "إرسال",
    clear: "مسح",
    export: "تصدير",
    team: "الفريق",
    security: "الأمان",
    emails: "البريد الإلكتروني",
    documents: "المستندات",
    payments: "المدفوعات",
    settings: "الإعدادات",
    overview: "نظرة عامة",
    analytics: "التحليلات",
  },
  id: {
    dashboard: "Dasbor",
    forecast: "Prakiraan AI",
    deep_forecast: "Prakiraan Mendalam",
    investment_suite: "Suite Perbankan Investasi",
    disasters: "Bencana",
    astrology: "Astrologi Veda",
    tabular: "Aliran Probabilitas",
    holographic: "Visualisasi 3D",
    accuracy: "Akurasi",
    admin: "Panel Admin",
    chat: "Obrolan AI",
    login: "Masuk",
    logout: "Keluar",
    welcome: "Selamat Datang di Plutus Predict",
    loading: "Memuat...",
    error: "Kesalahan",
    success: "Berhasil",
    save: "Simpan",
    delete: "Hapus",
    share: "Bagikan",
    send: "Kirim",
    clear: "Bersihkan",
    export: "Ekspor",
    team: "Tim",
    security: "Keamanan",
    emails: "Email",
    documents: "Dokumen",
    payments: "Pembayaran",
    settings: "Pengaturan",
    overview: "Ringkasan",
    analytics: "Analitik",
  },
  sw: {
    dashboard: "Dashibodi",
    forecast: "Utabiri wa AI",
    deep_forecast: "Utabiri wa Kina",
    investment_suite: "Suti ya Benki ya Uwekezaji",
    disasters: "Maafa",
    astrology: "Unajimu wa Veda",
    tabular: "Mtiririko wa Uwezekano",
    holographic: "Taswira ya 3D",
    accuracy: "Usahihi",
    admin: "Paneli ya Msimamizi",
    chat: "Mazungumzo ya AI",
    login: "Ingia",
    logout: "Ondoka",
    welcome: "Karibu Plutus Predict",
    loading: "Inapakia...",
    error: "Hitilafu",
    success: "Mafanikio",
    save: "Hifadhi",
    delete: "Futa",
    share: "Shiriki",
    send: "Tuma",
    clear: "Safisha",
    export: "Hamisha",
    team: "Timu",
    security: "Usalama",
    emails: "Barua Pepe",
    documents: "Nyaraka",
    payments: "Malipo",
    settings: "Mipangilio",
    overview: "Muhtasari",
    analytics: "Uchambuzi",
  },
};

export const useLanguage = () => {
  const [language, setLanguage] = useState(() => localStorage.getItem("language") || "en");

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const t = useCallback(
    (key) => {
      return TRANSLATIONS[language]?.[key] || TRANSLATIONS["en"]?.[key] || key;
    },
    [language]
  );

  const isRTL = SUPPORTED_LANGUAGES[language]?.rtl || false;

  return { language, setLanguage, t, isRTL, SUPPORTED_LANGUAGES };
};

// =============================================================================
// AUTH HOOK
// =============================================================================

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password });
      setToken(res.data.token);
      setUser(res.data);
      localStorage.setItem("token", res.data.token);
      return res.data;
    } catch (error) {
      throw error.response?.data?.detail || "Login failed";
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await axios.post(`${API}/auth/register`, { name, email, password });
      setToken(res.data.token);
      setUser(res.data);
      localStorage.setItem("token", res.data.token);
      return res.data;
    } catch (error) {
      throw error.response?.data?.detail || "Registration failed";
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
  };

  const getHeaders = () => ({
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return { user, setUser, token, login, register, logout, getHeaders };
};
