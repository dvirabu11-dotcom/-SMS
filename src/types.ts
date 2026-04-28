/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  isRead: boolean;
  scheduledFor?: number;
  isScheduled?: boolean;
  imageUrl?: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  isLocked?: boolean;
  sentAt?: number;
  deliveredAt?: number;
  readAt?: number;
}

export interface Conversation {
  id: string;
  contactName: string;
  lastMessage?: string;
  lastTimestamp: number;
  unreadCount: number;
  avatarUrl?: string;
  isPinned?: boolean;
  isMuted?: boolean;
  isTyping?: boolean;
  isArchived?: boolean;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  primaryColor: string;
  notificationDuration: number;
  notificationSound: string;
  fontFamily: string;
  cbsAlerts: boolean;
  enableVibration: boolean;
  autoRead: boolean;
  avatarUrl?: string;
  offlineMode?: boolean;
}

export interface Template {
  id: string;
  name: string;
  content: string;
}

export type SortField = 'date' | 'name' | 'unread';
export type SortOrder = 'asc' | 'desc';

export interface FilterOptions {
  contactName?: string;
  startDate?: number;
  endDate?: number;
  keywords?: string;
  showUnreadOnly?: boolean;
}
