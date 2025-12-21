'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Missing token.');
      return;
    }

    // Simulate email verification API call
    const verifyEmail = async () => {
      try {
        console.log('Verifying email with token:', token);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulate success (in real app, this would be based on API response)
        const success = Math.random() > 0.3; // 70% success rate for demo

        if (success) {
          setStatus('success');
          setMessage('Your email has been successfully verified! You can now sign in to your account.');
        } else {
          setStatus('error');
          setMessage('The verification link is invalid or has expired. Please request a new one.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Failed to verify email. Please try again or contact support.');
      }
    };

    verifyEmail();
  }, [token]);

  const handleResendVerification = async () => {
    setStatus('loading');
    try {
      // Simulate resend API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStatus('success');
      setMessage('A new verification email has been sent to your email address.');
    } catch (error) {
      setStatus('error');
      setMessage('Failed to resend verification email. Please try again.');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-700';
      case 'success':
        return 'text-green-700';
      case 'error':
        return 'text-red-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      <Card className="w-full max-w-md relative z-10 bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
            {getStatusIcon()}
          </div>
          <CardTitle className={`text-2xl font-bold ${getStatusColor()}`}>
            {status === 'loading' && 'Verifying your email'}
            {status === 'success' && 'Email verified!'}
            {status === 'error' && 'Verification failed'}
          </CardTitle>
          <CardDescription className="text-white/70">
            {email && (
              <div className="mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                {email}
              </div>
            )}
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 text-blue-300 rounded-lg">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait while we verify your email...
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="bg-green-500/20 backdrop-blur-sm border border-green-400/30 p-4 rounded-lg">
                <div className="flex items-center text-green-300">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">Verification successful!</span>
                </div>
                <p className="text-sm text-green-200 mt-1">
                  Your account is now active and you can start using TaskFlow.
                </p>
              </div>

              <Button 
                onClick={() => router.push('/login')} 
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/50"
              >
                Continue to sign in
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 p-4 rounded-lg">
                <div className="flex items-center text-red-300">
                  <XCircle className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">Verification failed</span>
                </div>
                <p className="text-sm text-red-200 mt-1">
                  {message}
                </p>
              </div>

              <div className="space-y-2">
                <Button onClick={handleResendVerification} variant="outline" className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend verification email
                </Button>

                <Button onClick={() => router.push('/login')} variant="outline" className="w-full">
                  Back to sign in
                </Button>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-white/10">
            <p className="text-sm text-white/60 text-center">
              Need help?{' '}
              <button
                onClick={() => router.push('/settings')}
                className="text-purple-300 hover:text-purple-200 underline transition-colors"
              >
                Contact support
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

