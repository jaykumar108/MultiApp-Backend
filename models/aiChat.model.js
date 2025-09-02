const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  tokens: {
    type: Number,
    default: 0
  },
  metadata: {
    model: {
      type: String,
      default: 'gemini'
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2
    }
  }
});

const aiChatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  conversationId: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, "Title cannot exceed 200 characters"]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"]
  },
  messages: [messageSchema],
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  category: {
    type: String,
    enum: ['general', 'work', 'education', 'creative', 'technical', 'other'],
    default: 'general'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, "Tag cannot exceed 50 characters"]
  }],
  settings: {
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'es', 'fr', 'de', 'hi', 'zh', 'ja', 'ko', 'ar']
    },
    maxTokens: {
      type: Number,
      default: 4096,
      min: 1,
      max: 100000
    },
    autoSave: {
      type: Boolean,
      default: true
    }
  },
  analytics: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalTokens: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    averageResponseTime: {
      type: Number,
      default: 0
    }
  },
  ip: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
aiChatSchema.index({ user: 1, createdAt: -1 });
aiChatSchema.index({ user: 1, status: 1 });
aiChatSchema.index({ conversationId: 1 });
aiChatSchema.index({ 'messages.timestamp': -1 });

// Virtual for message count
aiChatSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Method to add a message
aiChatSchema.methods.addMessage = function(role, content, metadata = {}) {
  const message = {
    role,
    content,
    timestamp: new Date(),
    ...metadata
  };
  
  this.messages.push(message);
  this.analytics.totalMessages = this.messages.length;
  this.analytics.lastActivity = new Date();
  
  return this.save();
};

// Method to get conversation summary
aiChatSchema.methods.getSummary = function() {
  return {
    conversationId: this.conversationId,
    title: this.title,
    messageCount: this.messages.length,
    lastActivity: this.analytics.lastActivity,
    category: this.category,
    status: this.status
  };
};

// Pre-save middleware to update analytics
aiChatSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.analytics.totalMessages = this.messages.length;
    this.analytics.lastActivity = new Date();
    
    // Calculate total tokens
    this.analytics.totalTokens = this.messages.reduce((total, msg) => {
      return total + (msg.tokens || 0);
    }, 0);
  }
  next();
});

const AiChat = mongoose.model('AiChat', aiChatSchema);

module.exports = AiChat;



