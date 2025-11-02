const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');
const { sanitizeInput } = require('../middleware/validate');
const geminiService = require('../services/geminiService');

// Apply authentication and rate limiting to all routes
router.use(protect);
router.use(aiLimiter);
router.use(sanitizeInput);

// Grammar check
router.post('/grammar-check', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: 'Text is required' });
    }

    if (text.length > 10000) {
      return res.status(400).json({ message: 'Text too long (max 10000 characters)' });
    }

    const suggestions = await geminiService.checkGrammar(text);

    res.json({
      success: true,
      suggestions,
      originalText: text
    });
  } catch (error) {
    console.error('Grammar check error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check grammar'
    });
  }
});

// Enhance text
router.post('/enhance', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: 'Text is required' });
    }

    if (text.length > 10000) {
      return res.status(400).json({ message: 'Text too long (max 10000 characters)' });
    }

    const enhancedText = await geminiService.enhanceText(text);

    res.json({
      success: true,
      enhancedText,
      originalText: text
    });
  } catch (error) {
    console.error('Text enhancement error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to enhance text'
    });
  }
});

// Summarize text
router.post('/summarize', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: 'Text is required' });
    }

    if (text.length > 50000) {
      return res.status(400).json({ message: 'Text too long (max 50000 characters)' });
    }

    const summary = await geminiService.summarizeText(text);

    res.json({
      success: true,
      summary,
      originalLength: text.length
    });
  } catch (error) {
    console.error('Summarization error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to summarize text'
    });
  }
});

// Auto-complete text
router.post('/complete', async (req, res) => {
  try {
    const { text, context } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: 'Text is required' });
    }

    if (text.length > 5000) {
      return res.status(400).json({ message: 'Text too long (max 5000 characters)' });
    }

    const completion = await geminiService.completeText(text, context || '');

    res.json({
      success: true,
      completion,
      originalText: text
    });
  } catch (error) {
    console.error('Auto-completion error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete text'
    });
  }
});

// Get suggestions
router.post('/suggestions', async (req, res) => {
  try {
    const { text, context } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: 'Text is required' });
    }

    if (text.length > 10000) {
      return res.status(400).json({ message: 'Text too long (max 10000 characters)' });
    }

    const suggestions = await geminiService.getSuggestions(text, context || '');

    res.json({
      success: true,
      suggestions,
      originalText: text
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get suggestions'
    });
  }
});

module.exports = router;

