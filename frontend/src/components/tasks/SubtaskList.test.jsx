import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SubtaskList from './SubtaskList';
import { taskService } from '../../../services/taskService';
import { SnackbarProvider } from 'notistack';

vi.mock('../../../services/taskService');

describe('SubtaskList Component', () => {
  const onUpdateMock = vi.fn();
  const subtasks = [
    { id: '1', title: 'First subtask', isCompleted: true },
    { id: '2', title: 'Second subtask', isCompleted: false },
  ];

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

  it('renders subtasks correctly', () => {
    renderWithProviders(<SubtaskList taskId="task-1" subtasks={subtasks} onUpdate={onUpdateMock} />);
    
    expect(screen.getByText('First subtask')).toBeInTheDocument();
    expect(screen.getByText('Second subtask')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('handles adding a new subtask', async () => {
    taskService.addSubtask.mockResolvedValue({});
    renderWithProviders(<SubtaskList taskId="task-1" subtasks={subtasks} onUpdate={onUpdateMock} />);
    
    const input = screen.getByPlaceholderText('Add an item');
    const form = input.closest('form');
    
    fireEvent.change(input, { target: { value: 'New Task' } });
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(taskService.addSubtask).toHaveBeenCalledWith('task-1', 'New Task');
      expect(onUpdateMock).toHaveBeenCalled();
    });
  });

  it('handles toggling a subtask', async () => {
    taskService.toggleSubtask.mockResolvedValue({});
    renderWithProviders(<SubtaskList taskId="task-1" subtasks={subtasks} onUpdate={onUpdateMock} />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    // Toggle the second checkbox (uncompleted one)
    fireEvent.click(checkboxes[1]);
    
    await waitFor(() => {
      expect(taskService.toggleSubtask).toHaveBeenCalledWith('2');
      expect(onUpdateMock).toHaveBeenCalled();
    });
  });

  it('handles deleting a subtask', async () => {
    taskService.deleteSubtask.mockResolvedValue({});
    renderWithProviders(<SubtaskList taskId="task-1" subtasks={subtasks} onUpdate={onUpdateMock} />);
    
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(taskService.deleteSubtask).toHaveBeenCalledWith('1');
      expect(onUpdateMock).toHaveBeenCalled();
    });
  });
});
