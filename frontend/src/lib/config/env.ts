export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000/api/v1",
  appOrigin: process.env.NEXT_PUBLIC_APP_ORIGIN || "http://localhost:3000",
  isProduction: process.env.NODE_ENV === "production",
};

