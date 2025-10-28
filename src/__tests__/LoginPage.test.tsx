import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';

const toastError = vi.fn();
const toastSuccess = vi.fn();

type UserRecord = { role: string; subscription_tier: string } | null;
type SupabaseResponse<T> = { data: T; error: { message: string } | null };

vi.mock('react-toastify', () => ({
  toast: {
    error: (...args: unknown[]) => {
      toastError(...args);
    },
    success: (...args: unknown[]) => {
      toastSuccess(...args);
    },
  },
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../components/3d/ParticleBackground', () => ({
  default: () => <div data-testid="particle-bg" />,
}));

let nextSelectResponse: SupabaseResponse<UserRecord>;
let nextInsertResponse: SupabaseResponse<UserRecord>;

const supabaseMocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signInWithOAuth: vi.fn(),
  from: vi.fn<(table: string) => unknown>(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: supabaseMocks.signInWithPassword,
      signInWithOAuth: supabaseMocks.signInWithOAuth,
    },
    from: (table: string) => supabaseMocks.from(table),
  },
}));

describe('LoginPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    mockNavigate.mockReset();
    toastError.mockReset();
    toastSuccess.mockReset();
    supabaseMocks.signInWithPassword.mockReset();
    supabaseMocks.signInWithOAuth.mockReset();
    supabaseMocks.from.mockImplementation((table: string) => {
      if (table !== 'users') {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue(nextSelectResponse),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue(nextInsertResponse),
          })),
        })),
      };
    });
    nextSelectResponse = { data: null, error: null };
   nextInsertResponse = { data: null, error: null };
  });

  function renderLoginPage() {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
  }

  it('navigates to dashboard after successful login', async () => {
    supabaseMocks.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      error: null,
    });

    nextSelectResponse = {
      data: { role: 'job_seeker', subscription_tier: 'free' },
      error: null,
    };

    renderLoginPage();

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'super-secret');
    await user.click(screen.getByRole('button', { name: /sign in to your account/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    expect(toastSuccess).toHaveBeenCalledWith('Welcome back!');
  });

  it('shows error toast when credentials are invalid', async () => {
    supabaseMocks.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    });

    renderLoginPage();

    await user.type(screen.getByLabelText(/email address/i), 'bad@example.com');
    await user.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in to your account/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Invalid email or password. Please check your credentials and try again.');
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
