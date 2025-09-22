import mongoose, { Document, Schema } from 'mongoose';

// User Profile Interface
interface IUserProfile {
  displayName: string;
  bio?: string;
  location?: string;
  website?: string;
  birthday?: Date;
  phoneNumber?: string;
  languages: string[];
  timezone: string;
}

// Notification Settings Interface
interface INotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  desktop: boolean;
  email: boolean;
  smartTiming: boolean;
  doNotDisturb: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    exceptions: string[];
  };
}

// Privacy Settings Interface
interface IPrivacySettings {
  readReceipts: boolean;
  typingIndicators: boolean;
  lastSeen: boolean;
  profileVisibility: 'everyone' | 'contacts' | 'nobody';
  messageHistory: boolean;
  dataCollection: boolean;
}

// Accessibility Settings Interface
interface IAccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
}

// AI Feature Settings Interface
interface IAIFeatureSettings {
  smartReplies: boolean;
  translation: boolean;
  sentimentAnalysis: boolean;
  voiceCloning: boolean;
  messageSummarization: boolean;
  smartScheduling: boolean;
}

// User Preferences Interface
interface IUserPreferences {
  theme: 'light' | 'dark' | 'auto' | 'custom';
  language: string;
  notifications: INotificationSettings;
  privacy: IPrivacySettings;
  accessibility: IAccessibilitySettings;
  aiFeatures: IAIFeatureSettings;
}

// Main User Interface
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Date;
  profile: IUserProfile;
  preferences: IUserPreferences;
  isVerified: boolean;
  isActive: boolean;
  loginAttempts: number;
  lockUntil?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// User Profile Schema
const UserProfileSchema = new Schema<IUserProfile>({
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  location: {
    type: String,
    trim: true,
    maxlength: 100,
    default: ''
  },
  website: {
    type: String,
    trim: true,
    maxlength: 200,
    default: ''
  },
  birthday: {
    type: Date
  },
  phoneNumber: {
    type: String,
    trim: true,
    maxlength: 20
  },
  languages: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  timezone: {
    type: String,
    required: true,
    default: 'UTC'
  }
}, { _id: false });

// Notification Settings Schema
const NotificationSettingsSchema = new Schema<INotificationSettings>({
  enabled: {
    type: Boolean,
    default: true
  },
  sound: {
    type: Boolean,
    default: true
  },
  vibration: {
    type: Boolean,
    default: true
  },
  desktop: {
    type: Boolean,
    default: true
  },
  email: {
    type: Boolean,
    default: false
  },
  smartTiming: {
    type: Boolean,
    default: true
  },
  doNotDisturb: {
    enabled: {
      type: Boolean,
      default: false
    },
    startTime: {
      type: String,
      default: '22:00'
    },
    endTime: {
      type: String,
      default: '08:00'
    },
    exceptions: [{
      type: String
    }]
  }
}, { _id: false });

// Privacy Settings Schema
const PrivacySettingsSchema = new Schema<IPrivacySettings>({
  readReceipts: {
    type: Boolean,
    default: true
  },
  typingIndicators: {
    type: Boolean,
    default: true
  },
  lastSeen: {
    type: Boolean,
    default: true
  },
  profileVisibility: {
    type: String,
    enum: ['everyone', 'contacts', 'nobody'],
    default: 'everyone'
  },
  messageHistory: {
    type: Boolean,
    default: true
  },
  dataCollection: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// Accessibility Settings Schema
const AccessibilitySettingsSchema = new Schema<IAccessibilitySettings>({
  fontSize: {
    type: String,
    enum: ['small', 'medium', 'large', 'extra-large'],
    default: 'medium'
  },
  highContrast: {
    type: Boolean,
    default: false
  },
  reducedMotion: {
    type: Boolean,
    default: false
  },
  screenReader: {
    type: Boolean,
    default: false
  },
  keyboardNavigation: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// AI Feature Settings Schema
const AIFeatureSettingsSchema = new Schema<IAIFeatureSettings>({
  smartReplies: {
    type: Boolean,
    default: true
  },
  translation: {
    type: Boolean,
    default: true
  },
  sentimentAnalysis: {
    type: Boolean,
    default: false
  },
  voiceCloning: {
    type: Boolean,
    default: false
  },
  messageSummarization: {
    type: Boolean,
    default: true
  },
  smartScheduling: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// User Preferences Schema
const UserPreferencesSchema = new Schema<IUserPreferences>({
  theme: {
    type: String,
    enum: ['light', 'dark', 'auto', 'custom'],
    default: 'dark'
  },
  language: {
    type: String,
    default: 'en',
    lowercase: true,
    trim: true
  },
  notifications: {
    type: NotificationSettingsSchema,
    default: () => ({})
  },
  privacy: {
    type: PrivacySettingsSchema,
    default: () => ({})
  },
  accessibility: {
    type: AccessibilitySettingsSchema,
    default: () => ({})
  },
  aiFeatures: {
    type: AIFeatureSettingsSchema,
    default: () => ({})
  }
}, { _id: false });

// Main User Schema
const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_]+$/,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false // Don't include password in queries by default
  },
  avatar: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away', 'busy'],
    default: 'offline',
    index: true
  },
  lastSeen: {
    type: Date,
    default: Date.now,
    index: true
  },
  profile: {
    type: UserProfileSchema,
    required: true
  },
  preferences: {
    type: UserPreferencesSchema,
    required: true,
    default: () => ({})
  },
  isVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpires: {
    type: Date,
    select: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpires;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpires;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpires;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpires;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better performance
UserSchema.index({ email: 1, username: 1 });
UserSchema.index({ status: 1, lastSeen: -1 });
UserSchema.index({ 'profile.displayName': 'text', username: 'text' });

// Virtual for account lock status
UserSchema.virtual('isLocked').get(function(this: IUser) {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Pre-save middleware to handle login attempts
UserSchema.pre('save', function(this: IUser, next) {
  // If we're modifying login attempts and we have a previous value
  if (!this.isModified('loginAttempts') && !this.isModified('lockUntil')) {
    return next();
  }

  // If we have a lockUntil date and it's in the past, remove it and reset attempts
  if (this.lockUntil && this.lockUntil < new Date()) {
    this.lockUntil = undefined;
    this.loginAttempts = 0;
  }

  next();
});

// Method to increment login attempts
UserSchema.methods.incLoginAttempts = function(this: IUser) {
  // If we have a lockUntil date and it's in the past, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }

  const updates: any = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) }; // 2 hours
  }

  return this.updateOne(updates);
};

// Method to reset login attempts
UserSchema.methods.resetLoginAttempts = function(this: IUser) {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Static method to find by credentials
UserSchema.statics.findByCredentials = async function(email: string, password: string) {
  const user = await this.findOne({ email, isActive: true }).select('+password');
  
  if (!user) {
    throw new Error('Invalid credentials');
  }

  if (user.isLocked) {
    throw new Error('Account is temporarily locked due to too many failed login attempts');
  }

  const bcrypt = require('bcryptjs');
  const isMatch = await bcrypt.compare(password, user.password);
  
  if (!isMatch) {
    await user.incLoginAttempts();
    throw new Error('Invalid credentials');
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  return user;
};

// Static method to find active users
UserSchema.statics.findActive = function(filter = {}) {
  return this.find({ ...filter, isActive: true });
};

// Static method to find online users
UserSchema.statics.findOnline = function() {
  return this.find({ status: 'online', isActive: true });
};

// Method to update last seen
UserSchema.methods.updateLastSeen = function(this: IUser) {
  this.lastSeen = new Date();
  return this.save();
};

// Method to set status
UserSchema.methods.setStatus = function(this: IUser, status: 'online' | 'offline' | 'away' | 'busy') {
  this.status = status;
  this.lastSeen = new Date();
  return this.save();
};

const User = mongoose.model<IUser>('User', UserSchema);

export default User;