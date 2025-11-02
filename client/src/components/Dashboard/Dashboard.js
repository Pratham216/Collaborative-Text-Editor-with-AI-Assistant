import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Logout as LogoutIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api';
import { toast } from 'react-toastify';

// use centralized api instance

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
  const response = await api.get('/api/documents');
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) {
      toast.error('Please enter a document title');
      return;
    }

    try {
      const response = await api.post('/api/documents', {
        title: newDocTitle,
      });
      toast.success('Document created!');
      setOpenDialog(false);
      setNewDocTitle('');
      navigate(`/documents/${response.data.document._id}`);
    } catch (error) {
      toast.error('Failed to create document');
    }
  };

  const handleDeleteDocument = async (documentId) => {
    try {
  await api.delete(`/api/documents/${documentId}`);
      toast.success('Document deleted');
      setDeleteDialog(null);
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const handleShareDocument = async (documentId) => {
    try {
  const response = await api.post(`/api/documents/${documentId}/share`);
      const shareLink = response.data.shareLink;
      await navigator.clipboard.writeText(shareLink);
      toast.success('Share link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to generate share link');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Collaborative Editor
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.username}
          </Typography>
          <IconButton color="inherit" onClick={logout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" component="h1">
            My Documents
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            New Document
          </Button>
        </Box>

        {loading ? (
          <Typography>Loading...</Typography>
        ) : documents.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No documents yet. Create your first document!
            </Typography>
          </Paper>
        ) : (
          <Paper>
            <List>
              {documents.map((doc) => (
                <ListItem
                  key={doc._id}
                  secondaryAction={
                    <Box>
                      <IconButton
                        edge="end"
                        onClick={() => handleShareDocument(doc._id)}
                        title="Share"
                      >
                        <ShareIcon />
                      </IconButton>
                      {(doc.owner._id === user?.id || doc.owner._id === user?._id) && (
                        <IconButton
                          edge="end"
                          onClick={() => setDeleteDialog(doc._id)}
                          title="Delete"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  }
                  disablePadding
                >
                  <ListItemButton onClick={() => navigate(`/documents/${doc._id}`)}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6">{doc.title}</Typography>
                      {(doc.owner._id === user?.id || doc.owner._id === user?._id) && (
                        <Chip label="Owner" size="small" color="primary" />
                      )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          Last modified: {formatDate(doc.updatedAt)} • Version {doc.version}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Container>

      {/* Create Document Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Create New Document</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Document Title"
            fullWidth
            variant="standard"
            value={newDocTitle}
            onChange={(e) => setNewDocTitle(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateDocument();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateDocument} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this document? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button
            onClick={() => handleDeleteDocument(deleteDialog)}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;

