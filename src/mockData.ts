import { Conversation, Message } from './types';

export const mockConversations: Conversation[] = [
  {
    id: '1',
    contactName: 'אמא',
    lastMessage: 'מתי אתה מגיע?',
    lastTimestamp: Date.now() - 1000 * 60 * 15,
    unreadCount: 1,
  },
  {
    id: '2',
    contactName: 'אבי',
    lastMessage: 'שלחתי לך את הקבצים',
    lastTimestamp: Date.now() - 1000 * 60 * 60 * 2,
    unreadCount: 0,
  },
  {
    id: '3',
    contactName: 'עבודה - צוות פיתוח',
    lastMessage: 'הגרסה החדשה מוכנה לבדיקה',
    lastTimestamp: Date.now() - 1000 * 60 * 60 * 24,
    unreadCount: 5,
  },
];

export const mockMessages: Record<string, Message[]> = {
  '1': [
    {
      id: 'm1',
      text: 'היי, הכל טוב?',
      senderId: 'user',
      senderName: 'אני',
      timestamp: Date.now() - 1000 * 60 * 30,
      isRead: true,
      status: 'read',
      sentAt: Date.now() - 1000 * 60 * 30,
      deliveredAt: Date.now() - 1000 * 60 * 29,
      readAt: Date.now() - 1000 * 60 * 25
    },
    {
      id: 'm2',
      text: 'מתי אתה מגיע?',
      senderId: '1',
      senderName: 'אמא',
      timestamp: Date.now() - 1000 * 60 * 15,
      isRead: false,
    },
  ],
};
