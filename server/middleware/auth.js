const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in cookies first, then in Authorization header
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Check if user has required role for the document
    if (req.document) {
      const userPermission = req.document.permissions.find(
        p => p.user.toString() === req.user._id.toString()
      );
      
      if (!userPermission) {
        return res.status(403).json({ message: 'No permission to access this document' });
      }
      
      const hasRequiredRole = roles.some(role => userPermission.role === role);
      if (!hasRequiredRole) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
    }
    
    next();
  };
};

module.exports = { protect, authorize };

