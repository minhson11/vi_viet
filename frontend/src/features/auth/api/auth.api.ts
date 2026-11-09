import { httpClient } from "@/lib/http/client";

export const authApi = {
  forgotPassword: async (email: string) => {
    return httpClient.post<{ message: string }>("/auth/forgot-password", { email });
  },

  resetPassword: async (token: string, new_password: string) => {
    return httpClient.post<{ message: string }>("/auth/reset-password", {
      token,
      new_password,
    });
  },

  verifyEmail: async (token: string) => {
    return httpClient.post<{ message: string }>("/auth/verify-email", { token });
  },

  resendVerification: async () => {
    return httpClient.post<{ message: string; already_verified?: boolean }>(
      "/auth/resend-verification",
    );
  },
};
