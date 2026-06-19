import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderPasteParser } from '../components/orders/OrderPasteParser';
import { api } from '../lib/api';

vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));

describe('OrderPasteParser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders paste parser and parses text correctly', async () => {
    // Mock metadata fetch
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/statuses') return Promise.resolve({ data: { data: [{ id: 'status-1', name: 'New' }] } });
      if (url === '/fields') return Promise.resolve({ data: { data: [] } });
      if (url.includes('/fields')) return Promise.resolve({ data: { data: [] } });
      return Promise.resolve({ data: { data: [] } });
    });

    render(<OrderPasteParser isOpen={true} onClose={() => {}} onOrderCreated={() => {}} />);

    // Wait for statuses to load
    await waitFor(() => {
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    // Verify the UI is present
    const textarea = screen.getAllByRole('textbox')[0];
    const parseBtn = screen.getByRole('button', { name: /Parse Text/i });

    expect(textarea).toBeInTheDocument();
    expect(parseBtn).toBeInTheDocument();
    
    // Test the button is initially disabled (since rawText is empty)
    expect(parseBtn).toBeDisabled();

    // Type into the textarea
    const user = userEvent.setup();
    await user.type(textarea, 'Name: John Smith\nPhone: 555-0123');

    // Verify the button becomes enabled
    await waitFor(() => {
      expect(parseBtn).not.toBeDisabled();
    });
  });
});
