import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import JobsPage from '../pages/jobs/JobsPage';

const toastError = vi.fn();
const toastSuccess = vi.fn();

type MockUser = { id: string; subscription_tier: string } | null;
type MockJob = {
  id: string;
  title: string;
  company: string;
  description: string;
  tier_requirement: string;
  status: string;
  [key: string]: unknown;
};

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

vi.mock('../utils/companyLogos', () => ({
  getCompanyLogo: () => null,
  getCompanyInitials: (company: string) => company.slice(0, 2).toUpperCase(),
  getCompanyGradient: () => 'from-gray-600 to-gray-800',
}));

let mockUser: MockUser = null;
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

let mockJobs: MockJob[] = [];
let mockTotalCount = 0;

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table !== 'jobs') {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: vi.fn((_columns: string, options?: { head?: boolean }) => {
          if (options?.head) {
            return {
              eq: vi.fn().mockResolvedValue({ count: mockTotalCount, error: null }),
            };
          }

          return {
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockJobs, error: null }),
            }),
          };
        }),
      };
    }),
  },
}));

describe('JobsPage', () => {
  beforeEach(() => {
    mockJobs = [];
    mockTotalCount = 0;
    mockUser = null;
    toastError.mockReset();
    toastSuccess.mockReset();
  });

  function renderJobsPage() {
    render(
      <MemoryRouter>
        <JobsPage />
      </MemoryRouter>
    );
  }

  it('shows available free-tier jobs to anonymous visitors', async () => {
    mockJobs = [
      { id: '1', title: 'Junior Associate', company: 'Firm A', description: 'Role 1', tier_requirement: 'free', status: 'active' },
      { id: '2', title: 'Senior Counsel', company: 'Firm B', description: 'Role 2', tier_requirement: 'free', status: 'active' },
      { id: '3', title: 'Exclusive Partner Role', company: 'Firm C', description: 'Role 3', tier_requirement: 'gold', status: 'active' },
    ];
    mockTotalCount = 3;

    renderJobsPage();

    await waitFor(() => {
      expect(screen.getByText('Junior Associate')).toBeInTheDocument();
    });

    expect(screen.queryByText('Exclusive Partner Role')).not.toBeInTheDocument();
    expect(await screen.findByText(/Viewing 2 of 3\+ jobs/i)).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
  });

  it('shows higher-tier roles for subscribed users', async () => {
    mockUser = { id: 'user-1', subscription_tier: 'gold' };
    mockJobs = [
      { id: '1', title: 'Associate', company: 'Firm A', description: 'Role 1', tier_requirement: 'free', status: 'active' },
      { id: '2', title: 'Premium Counsel', company: 'Firm B', description: 'Role 2', tier_requirement: 'gold', status: 'active' },
      { id: '3', title: 'Partner Track', company: 'Firm C', description: 'Role 3', tier_requirement: 'platinum', status: 'active' },
    ];
    mockTotalCount = mockJobs.length;

    renderJobsPage();

    await waitFor(() => {
      expect(screen.getByText('Premium Counsel')).toBeInTheDocument();
    });

    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
    expect(screen.queryByText(/Viewing/)).not.toBeInTheDocument();
  });
});
