import { Metadata } from 'next';
import RegisterPage from '@/features/auth/pages/register-page';

export const metadata: Metadata = {
  title: 'Register - TaskFlow',
  description: 'Create your TaskFlow account',
};

export default function Page() {
  return <RegisterPage />;
}






