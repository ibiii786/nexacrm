import { useState } from 'react';
import { api } from '../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      if (err.response?.data?.error?.message) {
        setError(err.response.data.error.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reset Password</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Enter your email to receive a reset link</p>
        </div>

        {error && (
          <div data-testid="forgot-password-error" className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div data-testid="forgot-password-success" className="mb-6 rounded-md bg-green-50 p-4 text-sm text-green-600 dark:bg-green-950/50 dark:text-green-400">
            If an account exists, a password reset link has been sent.
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-900 dark:text-slate-200" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              data-testid="forgot-password-email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:border-slate-700 dark:focus:ring-indigo-400 dark:text-white"
              placeholder="admin@company.com"
            />
          </div>

          <button
            type="submit"
            data-testid="forgot-password-submit-button"
            disabled={isLoading || success}
            className="w-full flex justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/login" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
}
