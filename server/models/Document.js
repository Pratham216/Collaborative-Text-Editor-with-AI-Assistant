const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'editor', 'viewer'],
    default: 'viewer'
  }
}, { _id: false });

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  permissions: [permissionSchema],
  shareLink: {
    type: String,
    unique: true,
    sparse: true
  },
  shareLinkExpiry: {
    type: Date
  },
  lastSaved: {
    type: Date,
    default: Date.now
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Index for faster queries
documentSchema.index({ owner: 1 });
documentSchema.index({ shareLink: 1 });
documentSchema.index({ 'permissions.user': 1 });

// Ensure owner has permission
documentSchema.pre('save', function(next) {
  const ownerPermission = this.permissions.find(
    p => p.user.toString() === this.owner.toString()
  );
  
  if (!ownerPermission) {
    this.permissions.push({
      user: this.owner,
      role: 'owner'
    });
  } else {
    ownerPermission.role = 'owner';
  }
  next();
});

module.exports = mongoose.model('Document', documentSchema);

