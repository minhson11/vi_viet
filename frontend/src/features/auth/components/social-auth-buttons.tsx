'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { httpClient } from '@/lib/http/client';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { useAuth } from '../context/auth-context';

interface SocialAuthButtonsProps {
  redirectTarget?: string | null;
  rememberMe?: boolean;
}

type SocialProvider = 'google' | 'facebook';

export function SocialAuthButtons({
  redirectTarget,
  rememberMe = true,
}: SocialAuthButtonsProps) {
  const router = useRouter();
  const { setSession } = useAuth();
  const [loadingProvider, setLoadingProvider] =
    useState<SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const login = async (providerName: SocialProvider) => {
    setLoadingProvider(providerName);
    setError(null);

    try {
      const provider =
        providerName === 'google'
          ? new GoogleAuthProvider()
          : new FacebookAuthProvider();
      provider.addScope('email');
      const credential = await signInWithPopup(getFirebaseAuth(), provider);
      const idToken = await credential.user.getIdToken(true);
      const session = await httpClient.post<{
        access_token: string;
        refresh_token: string;
        user: Parameters<typeof setSession>[2];
      }>('/auth/firebase', { idToken });

      setSession(
        session.access_token,
        session.refresh_token,
        session.user,
        rememberMe,
      );
      router.push(redirectTarget || '/tai-khoan');
    } catch (caught) {
      const code =
        typeof caught === 'object' && caught && 'code' in caught
          ? String(caught.code)
          : '';
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request'
      ) {
        return;
      }
      if (code === 'auth/account-exists-with-different-credential') {
        setError(
          'Email này đã dùng phương thức đăng nhập khác. Hãy đăng nhập bằng phương thức cũ trước.',
        );
      } else if (code === 'auth/unauthorized-domain') {
        setError('Tên miền hiện tại chưa được cho phép trong Firebase.');
      } else {
        setError(
          caught instanceof Error
            ? caught.message
            : 'Không thể đăng nhập bằng mạng xã hội.',
        );
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
        <span className="h-px flex-1 bg-border" />
        Hoặc tiếp tục với
        <span className="h-px flex-1 bg-border" />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => login('google')}
          disabled={loadingProvider !== null}
          className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-white text-sm font-semibold text-ink transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleIcon />
          {loadingProvider === 'google' ? 'Đang kết nối...' : 'Google'}
        </button>
        <button
          type="button"
          onClick={() => login('facebook')}
          disabled={loadingProvider !== null}
          className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-white text-sm font-semibold text-ink transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FacebookIcon />
          {loadingProvider === 'facebook' ? 'Đang kết nối...' : 'Facebook'}
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="#4285F4" d="M22.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.8h3.6c2.1-2 3.3-4.8 3.3-8.2Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.6l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-2-6.2-4.6H2.2V17A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.2a11 11 0 0 0 0 9.8l3.6-2.8Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.6l3.2-3.1A10.7 10.7 0 0 0 12 1a11 11 0 0 0-9.8 6.1l3.6 2.8c.9-2.6 3.3-4.5 6.2-4.5Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="#1877F2" d="M24 12.1A12 12 0 1 0 10.1 24v-8.4h-3v-3.5h3V9.5c0-3 1.8-4.7 4.6-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9v2.2h3.3l-.5 3.5h-2.8V24A12 12 0 0 0 24 12.1Z" />
    </svg>
  );
}
