import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from '../components/layout/Sidebar';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

// Mock zustand store
vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Sidebar Permission Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hides admin routes from regular USER', () => {
    // Mock user as USER
    (useAuthStore as any).mockImplementation((selector: any) => {
      const mockState = {
        user: { role: 'USER' },
        settings: {
          isPayrollEnabled: 'true',
          isFbAccountsEnabled: 'true',
        }
      };
      return selector(mockState);
    });

    renderWithRouter(<Sidebar isOpen={true} onClose={() => {}} />);
    
    // Normal user routes should be there
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
    
    // Admin routes should NOT be there
    expect(screen.queryByText('Announcements')).not.toBeInTheDocument();
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
    expect(screen.queryByText('Policies')).not.toBeInTheDocument();
    expect(screen.queryByText('Audit Log')).not.toBeInTheDocument();
  });

  it('shows admin routes for ADMIN', () => {
    (useAuthStore as any).mockImplementation((selector: any) => {
      const mockState = {
        user: { role: 'ADMIN' },
        settings: {}
      };
      return selector(mockState);
    });

    renderWithRouter(<Sidebar isOpen={true} onClose={() => {}} />);
    
    expect(screen.getByText('Announcements')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    // Audit log should still be hidden (only for SUPER_ADMIN)
    expect(screen.queryByText('Audit Log')).not.toBeInTheDocument();
  });

  it('shows Audit Log for SUPER_ADMIN', () => {
    (useAuthStore as any).mockImplementation((selector: any) => {
      const mockState = {
        user: { role: 'SUPER_ADMIN' },
        settings: {}
      };
      return selector(mockState);
    });

    renderWithRouter(<Sidebar isOpen={true} onClose={() => {}} />);
    
    expect(screen.getByText('Audit Log')).toBeInTheDocument();
  });

  it('respects module toggles for Payroll and FB Accounts', () => {
    (useAuthStore as any).mockImplementation((selector: any) => {
      const mockState = {
        user: { role: 'ADMIN' },
        settings: {
          isPayrollEnabled: 'false',
          isFbAccountsEnabled: 'false',
        }
      };
      return selector(mockState);
    });

    renderWithRouter(<Sidebar isOpen={true} onClose={() => {}} />);
    
    expect(screen.queryByText('Payroll')).not.toBeInTheDocument();
    expect(screen.queryByText('FB Accounts')).not.toBeInTheDocument();
  });
});
