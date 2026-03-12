import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const FileUploadZone = ({ onFileUpload, isUploading }) => {
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0 && !isUploading) {
        onFileUpload(acceptedFiles[0]);
      }
    },
    [onFileUpload, isUploading]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false, // We only allow one file upload at a time for simplicity
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: '2px dashed',
        borderColor: isDragActive ? 'primary.main' : 'grey.400',
        borderRadius: 2,
        padding: 4,
        textAlign: 'center',
        backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
        cursor: isUploading ? 'not-allowed' : 'pointer',
        opacity: isUploading ? 0.6 : 1,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: isUploading ? 'grey.400' : 'primary.light',
        },
      }}
    >
      <input {...getInputProps()} disabled={isUploading} />
      <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
      <Typography variant="body1" color="text.secondary">
        {isDragActive
          ? 'Drop the file here'
          : 'Drag & drop a file here, or click to select a file'}
      </Typography>
      {isUploading && (
        <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 1 }}>
          Uploading...
        </Typography>
      )}
    </Box>
  );
};

export default FileUploadZone;
