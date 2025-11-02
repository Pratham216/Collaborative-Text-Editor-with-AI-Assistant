import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  CircularProgress,
  TextField,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  AutoAwesome as AIIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { io } from 'socket.io-client';
import api from '../../api';
import { toast } from 'react-toastify';
import AIPanel from '../Editor/AIPanel';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || window.location.origin;

const ShareEditor = () => {
  const { shareLink } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  const socketRef = useRef(null);
  const quillRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  const fetchDocument = useCallback(async () => {
    try {
      const response = await api.get(`/api/documents/share/${shareLink}`);
      const doc = response.data.document;
      setDocument(doc);
      setContent(doc.content || '');
      setTitle(doc.title || '');
      initializeSocket(doc._id);
    } catch (error) {
      console.error('Error fetching shared document:', error);
      toast.error('Failed to load shared document');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [shareLink, navigate, initializeSocket]);

  useEffect(() => {
    fetchDocument();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [shareLink, fetchDocument]);

  const initializeSocket = useCallback((documentId, displayName = '') => {
    socketRef.current = io(SOCKET_URL, {
      auth: { shareLink, displayName },
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to server (share)');
      socketRef.current.emit('join-document', { documentId });
    });

    socketRef.current.on('user-joined', (data) => {
      toast.info(`${data.username || 'A user'} joined the document`);
      setActiveUsers((prev) => {
        if (!prev.find((u) => u.userId === data.userId)) {
          return [...prev, { userId: data.userId, username: data.username || 'Guest' }];
        }
        return prev;
      });
    });

    socketRef.current.on('user-left', (data) => {
      toast.info(`${data.username || 'A user'} left the document`);
      setActiveUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    });

    socketRef.current.on('document-users', (data) => {
      setActiveUsers(data.users || []);
    });

    socketRef.current.on('text-change', (data) => {
      const quill = quillRef.current?.getEditor();
      if (!quill) return;
      const currentContent = quill.root.innerHTML;
      if (currentContent !== data.content) {
        quill.root.innerHTML = data.content;
      }
    });

    socketRef.current.on('document-saved', (data) => {
      toast.success(`Document saved`);
    });

    socketRef.current.on('error', (data) => {
      toast.error(data.message || 'Socket error');
    });
  }, [shareLink]);

  const handleContentChange = (value) => {
    setContent(value);

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('text-change', {
        documentId: document._id,
        delta: null,
        content: value,
      });
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 30000);
  };

  const handleSave = async () => {
    if (saving || !document) return;
    setSaving(true);
    try {
      await api.put(`/api/documents/share/${shareLink}`, { title, content });

      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('document-saved', {
          documentId: document._id,
          content,
        });
      }

      toast.success('Document saved!');
    } catch (error) {
      console.error('Error saving shared document:', error);
      toast.error('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleTitleChange = async (newTitle) => {
    setTitle(newTitle);
    try {
      await api.put(`/api/documents/share/${shareLink}`, { title: newTitle });
    } catch (error) {
      console.error('Error updating title:', error);
    }
  };

  const handleTextSelection = () => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const selection = quill.getSelection();
      if (selection && selection.length > 0) {
        const text = quill.getText(selection.index, selection.length);
        setSelectedText(text);
      } else setSelectedText('');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      [{ color: [] }, { background: [] }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/')}>
            <ArrowBackIcon />
          </IconButton>
          <TextField
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            variant="standard"
            sx={{ flexGrow: 1, mx: 2, '& .MuiInputBase-root': { color: 'white' } }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
            {activeUsers.map((u) => (
              <Chip key={u.userId} icon={<PersonIcon />} label={u.username || 'Guest'} size="small" />
            ))}
          </Box>
          <IconButton color="inherit" onClick={() => setAiPanelOpen(true)}>
            <AIIcon />
          </IconButton>
          <Button color="inherit" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        <Paper sx={{ flexGrow: 1, p: 3, m: 2, overflow: 'auto', bgcolor: 'white' }}>
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={handleContentChange}
            onChangeSelection={handleTextSelection}
            modules={modules}
            style={{ height: '100%' }}
            placeholder="Start typing..."
          />
        </Paper>
      </Box>

      <AIPanel open={aiPanelOpen} onClose={() => setAiPanelOpen(false)} selectedText={selectedText} fullText={content} />
    </Box>
  );
};

export default ShareEditor;
