import { useState, useCallback, useEffect } from 'react';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  timestamp: Date;
  read: boolean;
}

let globalNotifications: Notification[] = [];
let listeners: Array<(ns: Notification[]) => void> = [];

function notifyListeners() {
  listeners.forEach(fn => fn([...globalNotifications]));
}

export function addNotification(
  type: NotificationType,
  title: string,
  message?: string
): Notification {
  const notif: Notification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    title,
    message,
    timestamp: new Date(),
    read: false,
  };
  globalNotifications = [notif, ...globalNotifications].slice(0, 50);
  notifyListeners();
  return notif;
}

export function markAllRead() {
  globalNotifications = globalNotifications.map(n => ({ ...n, read: true }));
  notifyListeners();
}

export function clearNotifications() {
  globalNotifications = [];
  notifyListeners();
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(globalNotifications);

  useEffect(() => {
    listeners.push(setNotifications);
    return () => {
      listeners = listeners.filter(fn => fn !== setNotifications);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const notify = useCallback(
    (type: NotificationType, title: string, message?: string) =>
      addNotification(type, title, message),
    []
  );

  return {
    notifications,
    unreadCount,
    notify,
    markAllRead,
    clearNotifications,
  };
}
