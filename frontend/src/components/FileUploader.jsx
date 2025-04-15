import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  LinearProgress, 
  Typography,
  Alert
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { fileApi } from '../services/api';

const FileUploader = ({ onFileUploaded }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setProgress(0);
      
      const response = await fileApi.uploadFile(file, (progress) => {
        setProgress(progress);
      });
      
      if (response.data.success) {
        setUploading(false);
        onFileUploaded(response.data.filename);
      } else {
        setError(response.data.error || 'Failed to upload file');
        setUploading(false);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload file');
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 3,
            border: '2px dashed',
            borderColor: 'primary.main',
            borderRadius: 1
          }}
        >
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Upload File
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
            Select a CSV or TSV file to upload
          </Typography>
          
          <input
            accept=".csv,.tsv,.txt"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            disabled={uploading}
          />
          
          <label htmlFor="file-upload">
            <Button
              variant="outlined"
              component="span"
              disabled={uploading}
            >
              Select File
            </Button>
          </label>
          
          {file && (
            <Box sx={{ mt: 2, width: '100%' }}>
              <Typography variant="body2" gutterBottom>
                Selected file: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </Typography>
              
              <Button 
                variant="contained" 
                onClick={handleUpload}
                disabled={uploading}
                sx={{ mt: 1 }}
                fullWidth
              >
                {uploading ? 'Uploading...' : 'Upload File'}
              </Button>
              
              {uploading && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress variant="determinate" value={progress} />
                  <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                    {progress}% Uploaded
                  </Typography>
                </Box>
              )}
            </Box>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default FileUploader; 