const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Document = require('../models/Document');

const activeUsers = new Map(); // documentId -> Set of userIds
const userSockets = new Map(); // userId -> Set of socketIds
const userNames = new Map(); // userId -> username (for authenticated users and guests)

module.exports = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.token;
      const shareLink = socket.handshake.auth.shareLink || socket.handshake.headers['x-share-link'];

      // If token provided, authenticate user
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.username = user.username;
        socket.isGuest = false;
        // store username for lookups
        userNames.set(socket.userId, socket.username);
        return next();
      }

      // If shareLink provided, validate and allow guest connection
      if (shareLink) {
        const document = await Document.findOne({ shareLink });
        if (!document) {
          return next(new Error('Invalid share link'));
        }
        if (document.shareLinkExpiry && document.shareLinkExpiry < Date.now()) {
          return next(new Error('Share link expired'));
        }

        // Create a guest identity for this socket
        const guestId = `guest_${Math.random().toString(36).slice(2,9)}`;
        socket.userId = guestId;
        // allow optional display name from handshake
        const displayName = socket.handshake.auth.displayName || socket.handshake.headers['x-display-name'];
        socket.username = displayName ? displayName : `Guest-${guestId.slice(6)}`;
        socket.isGuest = true;
        socket.guestForDocument = document._id.toString();
        // store guest name for lookups
        userNames.set(socket.userId, socket.username);
        return next();
      }

      // No credential provided
      return next(new Error('Authentication error'));
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.username} (${socket.userId})`);

    // Track user sockets
    if (!userSockets.has(socket.userId)) {
      userSockets.set(socket.userId, new Set());
    }
    userSockets.get(socket.userId).add(socket.id);

    // Join document room
    socket.on('join-document', async (data) => {
      try {
        const { documentId } = data;

        if (!documentId) {
          socket.emit('error', { message: 'Document ID is required' });
          return;
        }

        // Check document access
        const document = await Document.findById(documentId);
        if (!document) {
          socket.emit('error', { message: 'Document not found' });
          return;
        }

        // Determine access: authenticated users via permissions OR guests via matching share link
        let hasAccess = false;
        if (socket.isGuest) {
          hasAccess = document._id.toString() === socket.guestForDocument;
        } else {
          hasAccess = document.owner.toString() === socket.userId ||
            document.permissions.some(p => p.user.toString() === socket.userId);
        }

        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Join room
        socket.join(documentId);
        socket.currentDocument = documentId;

        // Track active users (store by userId)
        if (!activeUsers.has(documentId)) {
          activeUsers.set(documentId, new Set());
        }
        activeUsers.get(documentId).add(socket.userId);

        // Notify others with username
        socket.to(documentId).emit('user-joined', {
          userId: socket.userId,
          username: socket.username,
          timestamp: new Date()
        });

        // Send current users in document with resolved usernames
        const usersInDoc = Array.from(activeUsers.get(documentId));
        socket.emit('document-users', {
          users: usersInDoc.map(userId => ({ userId, username: userNames.get(userId) }))
        });

        console.log(`${socket.username} joined document ${documentId}`);
      } catch (error) {
        console.error('Join document error:', error);
        socket.emit('error', { message: 'Failed to join document' });
      }
    });

    // Leave document room
    socket.on('leave-document', (data) => {
      const { documentId } = data || { documentId: socket.currentDocument };

      if (documentId) {
        socket.leave(documentId);

        if (activeUsers.has(documentId)) {
          activeUsers.get(documentId).delete(socket.userId);
          if (activeUsers.get(documentId).size === 0) {
            activeUsers.delete(documentId);
          }
        }

        socket.to(documentId).emit('user-left', {
          userId: socket.userId,
          username: socket.username,
          timestamp: new Date()
        });

        socket.currentDocument = null;
        console.log(`${socket.username} left document ${documentId}`);
      }
    });

    // Handle text changes
    socket.on('text-change', async (data) => {
      try {
        const { documentId, delta, content } = data;

        if (!documentId || !socket.currentDocument || documentId !== socket.currentDocument) {
          return;
        }

        // Broadcast to other users in the document room
        socket.to(documentId).emit('text-change', {
          userId: socket.userId,
          username: socket.username,
          delta,
          content,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Text change error:', error);
      }
    });

    // Handle cursor movements
    socket.on('cursor-move', (data) => {
      const { documentId, cursorPosition } = data;

      if (!documentId || !socket.currentDocument || documentId !== socket.currentDocument) {
        return;
      }

      socket.to(documentId).emit('cursor-move', {
        userId: socket.userId,
        username: socket.username,
        cursorPosition,
        timestamp: new Date()
      });
    });

    // Handle document save
    socket.on('document-saved', async (data) => {
      try {
        const { documentId, content } = data;

        if (!documentId) {
          return;
        }

        // Update document in database
        const document = await Document.findById(documentId);
        if (document) {
          // Check permissions
          const canEdit =
            document.owner.toString() === socket.userId ||
            document.permissions.some(
              p => p.user.toString() === socket.userId && ['owner', 'editor'].includes(p.role)
            );

          // Allow edits if user has permission or if this is a guest connected via share link for this document
          const guestCanEdit = socket.isGuest && socket.guestForDocument && socket.guestForDocument === documentId;

          if (canEdit || guestCanEdit) {
            document.content = content;
            document.lastSaved = new Date();
            document.version += 1;
            await document.save();

            // Broadcast save confirmation
            io.to(documentId).emit('document-saved', {
              userId: socket.userId,
              username: socket.username,
              timestamp: new Date(),
              version: document.version
            });
          }
        }
      } catch (error) {
        console.error('Document save error:', error);
        socket.emit('error', { message: 'Failed to save document' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.username}`);

      // Remove from user sockets
      if (userSockets.has(socket.userId)) {
        userSockets.get(socket.userId).delete(socket.id);
        if (userSockets.get(socket.userId).size === 0) {
          userSockets.delete(socket.userId);
          // clean up guest name entries for guests
          if (typeof socket.userId === 'string' && socket.userId.startsWith('guest_')) {
            userNames.delete(socket.userId);
          }
        }
      }

      // Leave document if in one
      if (socket.currentDocument) {
        const documentId = socket.currentDocument;

        if (activeUsers.has(documentId)) {
          activeUsers.get(documentId).delete(socket.userId);
          if (activeUsers.get(documentId).size === 0) {
            activeUsers.delete(documentId);
          }
        }

        socket.to(documentId).emit('user-left', {
          userId: socket.userId,
          username: socket.username,
          timestamp: new Date()
        });
      }
    });
  });
};

