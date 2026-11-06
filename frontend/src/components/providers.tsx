"use client";

import React, { Suspense } from "react";
import { AuthProvider } from "@/features/auth/context/auth-context";
import { CinematicIntro } from "@/features/home/components/cinematic-intro";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Suspense fallback={null}>
        <CinematicIntro />
      </Suspense>
      {children}
    </AuthProvider>
  );
}
