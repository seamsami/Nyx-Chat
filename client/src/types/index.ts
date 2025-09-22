// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Date;
  preferences: UserPreferences;
  profile: UserProfile;
}

export interface UserProfile {
  displayName: string;
  bio?: string;
  location?: string;
  website?: string;
  birthday?: Date;
  phoneNumber?: string;
  languages: string[];
  timezone: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto' | 'custom';
  language: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  accessibility: AccessibilitySettings;
  aiFeatures: AIFeatureSettings;
}

export interface NotificationSettings {
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

export interface PrivacySettings {
  readReceipts: boolean;
  typingIndicators: boolean;
  lastSeen: boolean;
  profileVisibility: 'everyone' | 'contacts' | 'nobody';
  messageHistory: boolean;
  dataCollection: boolean;
}

export interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
}

export interface AIFeatureSettings {
  smartReplies: boolean;
  translation: boolean;
  sentimentAnalysis: boolean;
  voiceCloning: boolean;
  messageSummarization: boolean;
  smartScheduling: boolean;
}

// Message Types
export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: MessageType;
  timestamp: Date;
  editedAt?: Date;
  replyTo?: string;
  reactions: MessageReaction[];
  attachments: MessageAttachment[];
  metadata: MessageMetadata;
  status: MessageStatus;
  aiFeatures?: MessageAIFeatures;
}

export type MessageType = 
  | 'text' 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'file' 
  | 'location' 
  | 'contact' 
  | 'poll' 
  | 'event' 
  | 'system'
  | 'ai-generated';

export interface MessageReaction {
  emoji: string;
  userId: string;
  timestamp: Date;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'archive';
  name: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
}

export interface MessageMetadata {
  edited: boolean;
  forwarded: boolean;
  scheduled?: Date;
  expiresAt?: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags: string[];
  mentions: string[];
  links: LinkPreview[];
}

export interface MessageAIFeatures {
  translation?: {
    originalLanguage: string;
    translatedText: string;
    targetLanguage: string;
  };
  sentiment?: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  smartReply?: string[];
  summary?: string;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
}

// Chat Types
export interface Chat {
  id: string;
  type: 'direct' | 'group' | 'channel' | 'workspace';
  name?: string;
  description?: string;
  avatar?: string;
  participants: ChatParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  settings: ChatSettings;
  metadata: ChatMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatParticipant {
  userId: string;
  role: 'owner' | 'admin' | 'moderator' | 'member' | 'guest';
  joinedAt: Date;
  permissions: ChatPermissions;
  customTitle?: string;
}

export interface ChatPermissions {
  canSendMessages: boolean;
  canSendMedia: boolean;
  canAddMembers: boolean;
  canRemoveMembers: boolean;
  canEditInfo: boolean;
  canDeleteMessages: boolean;
  canPinMessages: boolean;
  canManageRoles: boolean;
}

export interface ChatSettings {
  muted: boolean;
  pinned: boolean;
  archived: boolean;
  theme?: string;
  wallpaper?: string;
  messageRetention: number; // days
  allowGuests: boolean;
  requireApproval: boolean;
  autoTranslate: boolean;
  smartNotifications: boolean;
}

export interface ChatMetadata {
  messageCount: number;
  mediaCount: number;
  fileCount: number;
  lastActivity: Date;
  analytics: ChatAnalytics;
}

export interface ChatAnalytics {
  activeMembers: number;
  messageFrequency: Record<string, number>;
  popularTimes: Record<string, number>;
  responseTime: number;
  engagement: number;
}

// Real-time Events
export interface SocketEvent {
  type: SocketEventType;
  payload: any;
  timestamp: Date;
  userId?: string;
  chatId?: string;
}

export type SocketEventType =
  | 'message:new'
  | 'message:edit'
  | 'message:delete'
  | 'message:reaction'
  | 'typing:start'
  | 'typing:stop'
  | 'user:online'
  | 'user:offline'
  | 'chat:join'
  | 'chat:leave'
  | 'call:start'
  | 'call:end'
  | 'screen:share'
  | 'file:upload'
  | 'notification:new';

// Call Types
export interface Call {
  id: string;
  chatId: string;
  initiatorId: string;
  participants: CallParticipant[];
  type: 'audio' | 'video' | 'screen';
  status: 'ringing' | 'active' | 'ended' | 'missed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  quality: CallQuality;
}

export interface CallParticipant {
  userId: string;
  status: 'ringing' | 'joined' | 'left' | 'declined';
  joinTime?: Date;
  leaveTime?: Date;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
}

export interface CallQuality {
  audio: number; // 0-100
  video: number; // 0-100
  connection: number; // 0-100
  latency: number; // ms
}

// File Types
export interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  url?: string;
  error?: string;
}

// Search Types
export interface SearchResult {
  type: 'message' | 'chat' | 'user' | 'file';
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  chatId?: string;
  userId?: string;
  relevance: number;
  highlights: string[];
}

export interface SearchFilters {
  type?: SearchResult['type'][];
  dateRange?: {
    start: Date;
    end: Date;
  };
  chatIds?: string[];
  userIds?: string[];
  fileTypes?: string[];
  hasAttachments?: boolean;
}

// Workspace Types
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  owner: string;
  members: WorkspaceMember[];
  channels: Chat[];
  settings: WorkspaceSettings;
  integrations: Integration[];
  createdAt: Date;
}

export interface WorkspaceMember {
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  joinedAt: Date;
  permissions: WorkspacePermissions;
  department?: string;
  title?: string;
}

export interface WorkspacePermissions {
  canCreateChannels: boolean;
  canInviteMembers: boolean;
  canManageIntegrations: boolean;
  canAccessAnalytics: boolean;
  canManageSettings: boolean;
}

export interface WorkspaceSettings {
  allowGuests: boolean;
  requireApproval: boolean;
  defaultChannels: string[];
  retentionPolicy: number;
  securityLevel: 'basic' | 'enhanced' | 'enterprise';
}

// Integration Types
export interface Integration {
  id: string;
  name: string;
  type: 'webhook' | 'bot' | 'api' | 'oauth';
  status: 'active' | 'inactive' | 'error';
  config: Record<string, any>;
  permissions: string[];
  createdAt: Date;
  lastUsed?: Date;
}

// Theme Types
export interface Theme {
  id: string;
  name: string;
  type: 'light' | 'dark' | 'custom';
  colors: ThemeColors;
  fonts: ThemeFonts;
  effects: ThemeEffects;
  animations: ThemeAnimations;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ThemeFonts {
  primary: string;
  secondary: string;
  mono: string;
  sizes: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
}

export interface ThemeEffects {
  blur: number;
  transparency: number;
  shadows: boolean;
  gradients: boolean;
  particles: boolean;
}

export interface ThemeAnimations {
  enabled: boolean;
  duration: number;
  easing: string;
  reducedMotion: boolean;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  chatId?: string;
}

// State Types
export interface AppState {
  user: User | null;
  chats: Chat[];
  messages: Record<string, Message[]>;
  activeChat: string | null;
  onlineUsers: string[];
  typingUsers: Record<string, string[]>;
  calls: Call[];
  activeCall: string | null;
  notifications: Notification[];
  theme: Theme;
  loading: boolean;
  error: AppError | null;
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface MessageComponentProps extends BaseComponentProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  onReply?: (message: Message) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
}

export interface ChatListItemProps extends BaseComponentProps {
  chat: Chat;
  isActive: boolean;
  onClick: (chatId: string) => void;
  onArchive?: (chatId: string) => void;
  onMute?: (chatId: string) => void;
  onDelete?: (chatId: string) => void;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type EventHandler<T = any> = (event: T) => void;

export type AsyncEventHandler<T = any> = (event: T) => Promise<void>;