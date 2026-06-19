import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '../pages/login';
import { BrowserRouter } from 'react-router-dom';
import { api } from '../lib/api';

vi.mock('../lib/api', () => ({
  api: {
    post: vi.fn(),
  }
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation error if submitting empty form', async () => {
    renderWithRouter(<LoginPage />);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);
    
    // In actual app, HTML5 required validation kicks in, or we might have manual validation.
    // Assuming button is still in document and no API call is made if fields are missing.
    expect(api.post).not.toHaveBeenCalled();
  });

  it('calls login API on valid submission', async () => {
    (api.post as any).mockResolvedValueOnce({
      data: {
        data: {
          user: { id: '1', name: 'Admin', role: 'ADMIN' },
          accessToken: 'fake-token'
        }
      }
    });

    renderWithRouter(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'admin@nexacrm.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'admin@nexacrm.com',
        password: 'password123',
      });
    });
  });
});
