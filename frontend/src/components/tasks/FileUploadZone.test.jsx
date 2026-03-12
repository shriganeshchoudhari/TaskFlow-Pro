import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FileUploadZone from './FileUploadZone';

describe('FileUploadZone Component', () => {
  it('renders correctly', () => {
    const mockOnUpload = vi.fn();
    render(<FileUploadZone onUpload={mockOnUpload} />);
    
    expect(screen.getByText(/Drag & drop files here, or click to select/i)).toBeInTheDocument();
  });

  it('shows uploading state', () => {
    const mockOnUpload = vi.fn();
    render(<FileUploadZone onUpload={mockOnUpload} isUploading={true} />);
    
    expect(screen.getByText(/Uploading.../i)).toBeInTheDocument();
  });
});
