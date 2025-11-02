const Document = require('../models/Document');

// Middleware to check document access and attach document to request
const checkDocumentAccess = async (req, res, next) => {
  try {
    const documentId = req.params.id;
    const userId = req.user._id;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user has access
    const hasAccess = 
      document.owner.toString() === userId.toString() ||
      document.permissions.some(p => p.user.toString() === userId.toString());

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this document' });
    }

    req.document = document;
    next();
  } catch (error) {
    console.error('Document access check error:', error);
    res.status(500).json({ message: 'Server error checking document access' });
  }
};

module.exports = checkDocumentAccess;

