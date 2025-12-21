import { Metadata } from 'next';
import { Suspense } from 'react';
import LoginPage from '@/features/auth/pages/login-page';

export const metadata: Metadata = {
  title: 'Login - TaskFlow',
  description: 'Sign in to your TaskFlow account',
};

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPage />
    </Suspense>
  );
}


