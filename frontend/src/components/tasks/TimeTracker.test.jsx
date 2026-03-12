import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TimeTracker from './TimeTracker';
import { taskService } from '../../../services/taskService';
import { SnackbarProvider } from 'notistack';

vi.mock('../../../services/taskService');

describe('TimeTracker Component', () => {
  const onUpdateMock = vi.fn();
  const defaultProps = {
    taskId: 'task-123',
    estimatedHours: 10,
    loggedHours: 4.5,
    onUpdate: onUpdateMock
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProviders = (ui) => {
    return render(
      <SnackbarProvider maxSnack={3}>
        {ui}
      </SnackbarProvider>
    );
  };

  it('renders estimated and logged hours correctly', () => {
    renderWithProviders(<TimeTracker {...defaultProps} />);
    
    expect(screen.getByText('4.5h logged')).toBeInTheDocument();
    expect(screen.getByText('10h estimated')).toBeInTheDocument();
  });

  it('handles logging new time correctly', async () => {
    taskService.logTime.mockResolvedValue({});
    renderWithProviders(<TimeTracker {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Hours (e.g., 2.5)');
    const button = screen.getByRole('button', { name: /log/i });
    
    fireEvent.change(input, { target: { value: '2' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(taskService.logTime).toHaveBeenCalledWith('task-123', 2);
      expect(onUpdateMock).toHaveBeenCalled();
    });
  });

  it('disables button when input is empty', () => {
    renderWithProviders(<TimeTracker {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /log/i });
    expect(button).toBeDisabled();
    
    const input = screen.getByPlaceholderText('Hours (e.g., 2.5)');
    fireEvent.change(input, { target: { value: '1' } });
    expect(button).not.toBeDisabled();
  });
});
