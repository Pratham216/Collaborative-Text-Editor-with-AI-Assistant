import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  AutoFixHigh as EnhanceIcon,
  Summarize as SummarizeIcon,
  AutoAwesome as CompleteIcon,
  Lightbulb as SuggestionIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AIPanel = ({ open, onClose, selectedText, fullText }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    grammar: '',
    enhance: '',
    summarize: '',
    complete: '',
    suggestions: '',
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleGrammarCheck = async () => {
    const text = selectedText || fullText;
    if (!text.trim()) {
      toast.error('Please select text or ensure document has content');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/ai/grammar-check`, {
        text: text.substring(0, 10000),
      });
      setResults({ ...results, grammar: response.data.suggestions });
    } catch (error) {
      toast.error('Failed to check grammar');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnhance = async () => {
    const text = selectedText || fullText;
    if (!text.trim()) {
      toast.error('Please select text or ensure document has content');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/ai/enhance`, {
        text: text.substring(0, 10000),
      });
      setResults({ ...results, enhance: response.data.enhancedText });
    } catch (error) {
      toast.error('Failed to enhance text');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    const text = selectedText || fullText;
    if (!text.trim()) {
      toast.error('Please select text or ensure document has content');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/ai/summarize`, {
        text: text.substring(0, 50000),
      });
      setResults({ ...results, summarize: response.data.summary });
    } catch (error) {
      toast.error('Failed to summarize text');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    const text = selectedText || fullText;
    if (!text.trim()) {
      toast.error('Please select text or ensure document has content');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/ai/complete`, {
        text: text.substring(0, 5000),
        context: fullText.substring(0, 5000),
      });
      setResults({ ...results, complete: response.data.completion });
    } catch (error) {
      toast.error('Failed to complete text');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestions = async () => {
    const text = selectedText || fullText;
    if (!text.trim()) {
      toast.error('Please select text or ensure document has content');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/ai/suggestions`, {
        text: text.substring(0, 10000),
        context: fullText.substring(0, 5000),
      });
      setResults({ ...results, suggestions: response.data.suggestions });
    } catch (error) {
      toast.error('Failed to get suggestions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 400 } }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">AI Writing Assistant</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Grammar" />
          <Tab label="Enhance" />
          <Tab label="Summarize" />
          <Tab label="Complete" />
          <Tab label="Suggestions" />
        </Tabs>

        <Box sx={{ mt: 3 }}>
          {activeTab === 0 && (
            <Box>
              <Button
                variant="contained"
                startIcon={<CheckIcon />}
                onClick={handleGrammarCheck}
                disabled={loading}
                fullWidth
                sx={{ mb: 2 }}
              >
                Check Grammar
              </Button>
              {loading ? (
                <CircularProgress />
              ) : (
                <Paper sx={{ p: 2, minHeight: 200, bgcolor: '#f5f5f5' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {results.grammar || 'Click "Check Grammar" to analyze your text'}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Button
                variant="contained"
                startIcon={<EnhanceIcon />}
                onClick={handleEnhance}
                disabled={loading}
                fullWidth
                sx={{ mb: 2 }}
              >
                Enhance Text
              </Button>
              {loading ? (
                <CircularProgress />
              ) : (
                <Paper sx={{ p: 2, minHeight: 200, bgcolor: '#f5f5f5' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {results.enhance || 'Click "Enhance Text" to improve your writing'}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Button
                variant="contained"
                startIcon={<SummarizeIcon />}
                onClick={handleSummarize}
                disabled={loading}
                fullWidth
                sx={{ mb: 2 }}
              >
                Summarize
              </Button>
              {loading ? (
                <CircularProgress />
              ) : (
                <Paper sx={{ p: 2, minHeight: 200, bgcolor: '#f5f5f5' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {results.summarize || 'Click "Summarize" to get a summary of your text'}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}

          {activeTab === 3 && (
            <Box>
              <Button
                variant="contained"
                startIcon={<CompleteIcon />}
                onClick={handleComplete}
                disabled={loading}
                fullWidth
                sx={{ mb: 2 }}
              >
                Auto-Complete
              </Button>
              {loading ? (
                <CircularProgress />
              ) : (
                <Paper sx={{ p: 2, minHeight: 200, bgcolor: '#f5f5f5' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {results.complete || 'Click "Auto-Complete" to get text completion suggestions'}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}

          {activeTab === 4 && (
            <Box>
              <Button
                variant="contained"
                startIcon={<SuggestionIcon />}
                onClick={handleSuggestions}
                disabled={loading}
                fullWidth
                sx={{ mb: 2 }}
              >
                Get Suggestions
              </Button>
              {loading ? (
                <CircularProgress />
              ) : (
                <Paper sx={{ p: 2, minHeight: 200, bgcolor: '#f5f5f5' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {results.suggestions || 'Click "Get Suggestions" to receive writing recommendations'}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </Box>

        {selectedText && (
          <Box sx={{ mt: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Selected text: "{selectedText.substring(0, 50)}
              {selectedText.length > 50 ? '...' : ''}"
            </Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default AIPanel;

