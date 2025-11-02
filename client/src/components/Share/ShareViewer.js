import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import api from '../../api';
import { toast } from 'react-toastify';

const ShareViewer = () => {
  const { shareLink } = useParams();
  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState(null);

  useEffect(() => {
    const fetchShared = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/documents/share/${shareLink}`);
        setDocument(res.data.document);
      } catch (err) {
        const status = err.response?.status;
        if (status === 404) {
          toast.error('Shared document not found');
        } else if (status === 410) {
          toast.error('Share link has expired');
        } else if (status === 401) {
          // In case some middleware redirects to auth, show message
          toast.error('Authentication required to view this document');
        } else {
          toast.error('Failed to load shared document');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchShared();
  }, [shareLink]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!document) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Shared document not available</Typography>
        <Button component={RouterLink} to="/" variant="contained" sx={{ mt: 2 }}>
          Back to Home
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '900px', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>{document.title}</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Last saved: {document.lastSaved ? new Date(document.lastSaved).toLocaleString() : 'Unknown'}
      </Typography>
      <Box sx={{ mt: 2, bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
        <div dangerouslySetInnerHTML={{ __html: document.content || '' }} />
      </Box>
    </Box>
  );
};

export default ShareViewer;
