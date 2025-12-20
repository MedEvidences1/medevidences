// API Configuration
export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Multi-language Support
export const SUPPORTED_LANGUAGES = {
  en: { name: "English", native: "English", rtl: false, flag: "🇺🇸" },
  es: { name: "Spanish", native: "Español", rtl: false, flag: "🇪🇸" },
  fr: { name: "French", native: "Français", rtl: false, flag: "🇫🇷" },
  ar: { name: "Arabic", native: "العربية", rtl: true, flag: "🇸🇦" },
  id: { name: "Indonesian", native: "Bahasa", rtl: false, flag: "🇮🇩" },
  sw: { name: "Swahili", native: "Kiswahili", rtl: false, flag: "🇰🇪" },
};

// Forecast Categories
export const FORECAST_CATEGORIES = [
  { id: "all", label: "All Categories", icon: "Globe" },
  { id: "economics", label: "Economics", icon: "DollarSign" },
  { id: "geopolitical", label: "Geopolitical", icon: "Globe" },
  { id: "technology", label: "Technology", icon: "Cpu" },
  { id: "finance", label: "Finance & Markets", icon: "TrendingUp" },
  { id: "politics", label: "Politics", icon: "Users" },
  { id: "corporate", label: "Corporate", icon: "Building2" },
  { id: "health", label: "Health & Pandemic", icon: "Activity" },
  { id: "energy", label: "Energy & Climate", icon: "Cloud" },
  { id: "space", label: "Space", icon: "Star" },
];
