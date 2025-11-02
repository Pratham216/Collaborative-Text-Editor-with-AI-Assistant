const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Document = require('../models/Document');
const { protect } = require('../middleware/auth');
const checkDocumentAccess = require('../middleware/documentAccess');
const { apiLimiter } = require('../middleware/rateLimiter');
const { sanitizeInput } = require('../middleware/validate');

// Public route for shared documents (no auth required)
// Example: GET /api/documents/share/:shareLink
router.get('/share/:shareLink', async (req, res) => {
  try {
    const { shareLink } = req.params;

    const document = await Document.findOne({ shareLink });

    if (!document) {
      return res.status(404).json({ message: 'Shared document not found' });
    }

    // Check expiry
    if (document.shareLinkExpiry && document.shareLinkExpiry < Date.now()) {
      return res.status(410).json({ message: 'Share link has expired' });
    }

    // Only return safe/read-only fields for anonymous viewers
    const publicDoc = {
      _id: document._id,
      title: document.title,
      content: document.content,
      lastSaved: document.lastSaved,
      version: document.version,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };

    return res.json({ document: publicDoc });
  } catch (error) {
    console.error('Public share fetch error:', error);
    return res.status(500).json({ message: 'Server error fetching shared document' });
  }
});

// Public update route for shared documents (allows anonymous edits via share link)
// Example: PUT /api/documents/share/:shareLink
router.put('/share/:shareLink', async (req, res) => {
  try {
    const { shareLink } = req.params;
    const { title, content } = req.body;

    const document = await Document.findOne({ shareLink });

    if (!document) {
      return res.status(404).json({ message: 'Shared document not found' });
    }

    // Check expiry
    if (document.shareLinkExpiry && document.shareLinkExpiry < Date.now()) {
      return res.status(410).json({ message: 'Share link has expired' });
    }

    // Update allowed: treat shared link as editor access
    if (title !== undefined) document.title = title;
    if (content !== undefined) {
      document.content = content;
      document.lastSaved = new Date();
      document.version += 1;
    }

    await document.save();

    return res.json({ document });
  } catch (error) {
    console.error('Public share update error:', error);
    return res.status(500).json({ message: 'Server error updating shared document' });
  }
});

// Apply authentication to all remaining routes
router.use(protect);
router.use(apiLimiter);
router.use(sanitizeInput);

// Get all user's documents
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;

    const documents = await Document.find({
      $or: [
        { owner: userId },
        { 'permissions.user': userId }
      ]
    })
    .populate('owner', 'username email')
    .sort({ updatedAt: -1 });

    res.json({ documents });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Server error fetching documents' });
  }
});

// Create new document
router.post('/', async (req, res) => {
  try {
    const { title, content } = req.body;

    const document = await Document.create({
      title: title || 'Untitled Document',
      content: content || '',
      owner: req.user._id
    });

    await document.populate('owner', 'username email');

    res.status(201).json({ document });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ message: 'Server error creating document' });
  }
});

// Get specific document
router.get('/:id', checkDocumentAccess, async (req, res) => {
  try {
    await req.document.populate('owner', 'username email');
    res.json({ document: req.document });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ message: 'Server error fetching document' });
  }
});

// Update document
router.put('/:id', checkDocumentAccess, async (req, res) => {
  try {
    const { title, content } = req.body;
    const document = req.document;

    // Check if user can edit
    const userPermission = document.permissions.find(
      p => p.user.toString() === req.user._id.toString()
    );
    const canEdit = userPermission && ['owner', 'editor'].includes(userPermission.role);

    if (!canEdit && document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No permission to edit this document' });
    }

    if (title !== undefined) document.title = title;
    if (content !== undefined) {
      document.content = content;
      document.lastSaved = new Date();
      document.version += 1;
    }

    await document.save();
    await document.populate('owner', 'username email');

    res.json({ document });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ message: 'Server error updating document' });
  }
});

// Delete document
router.delete('/:id', checkDocumentAccess, async (req, res) => {
  try {
    const document = req.document;

    // Only owner can delete
    if (document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only owner can delete this document' });
    }

    await Document.findByIdAndDelete(document._id);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Server error deleting document' });
  }
});

// Generate share link
router.post('/:id/share', checkDocumentAccess, async (req, res) => {
  try {
    const document = req.document;

    // Only owner and editors can share
    const userPermission = document.permissions.find(
      p => p.user.toString() === req.user._id.toString()
    );
    const canShare = userPermission && ['owner', 'editor'].includes(userPermission.role);

    if (!canShare && document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No permission to share this document' });
    }

    // Generate unique share link
    const shareLink = crypto.randomBytes(32).toString('hex');
    document.shareLink = shareLink;
    document.shareLinkExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await document.save();

    res.json({
      shareLink: `${process.env.CLIENT_URL || 'http://localhost:3000'}/documents/share/${shareLink}`
    });
  } catch (error) {
    console.error('Share document error:', error);
    res.status(500).json({ message: 'Server error generating share link' });
  }
});

module.exports = router;

