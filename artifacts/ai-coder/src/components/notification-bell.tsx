import React, { useState } from 'react';
import { Bell, Check, Trash2, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useNotifications, markAllRead, clearNotifications, type NotificationType } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

function NotifIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case 'success': return <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />;
    case 'error':   return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
    case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />;
    default:        return <Info className="w-4 h-4 text-blue-400 shrink-0" />;
  }
}

export function NotificationBell() {
  const { notifications, unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open) markAllRead();
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-[9px] font-bold text-white flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-sm font-semibold">Notifications</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={markAllRead} title="Mark all read">
                  <Check className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearNotifications} title="Clear all">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <ScrollArea className="max-h-80">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm gap-2">
                  <Bell className="w-8 h-8 opacity-20" />
                  <span>No notifications yet</span>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className={`flex gap-3 p-3 transition-colors ${n.read ? '' : 'bg-primary/5'}`}
                    >
                      <NotifIcon type={n.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{n.title}</p>
                        {n.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {formatDistanceToNow(n.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}
