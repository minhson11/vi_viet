export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "https://vi-viet.onrender.com/api/v1",
  appOrigin: process.env.NEXT_PUBLIC_APP_ORIGIN || "http://localhost:3000",
  isProduction: process.env.NODE_ENV === "production",
};

