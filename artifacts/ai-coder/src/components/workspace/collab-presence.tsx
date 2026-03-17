import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Users } from 'lucide-react';

interface PresenceUser {
  userId: number;
  name: string;
  color: string;
  cursor?: { line: number; column: number; fileId?: number };
  activeFile?: number;
  lastSeen: number;
}

interface CollabPresenceProps {
  projectId: number | null;
  activeFileId?: number | null;
  cursorPosition?: { line: number; column: number };
}

export function CollabPresence({ projectId, activeFileId, cursorPosition }: CollabPresenceProps) {
  const { user } = useAuth();
  const [others, setOthers] = useState<PresenceUser[]>([]);
  const [myColor, setMyColor] = useState('#8b5cf6');

  const heartbeat = useCallback(async () => {
    if (!projectId || !user) return;
    try {
      const res = await fetch(`/api/collab/presence/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.name, cursor: cursorPosition, activeFile: activeFileId }),
      });
      if (res.ok) { const d = await res.json(); if (d.color) setMyColor(d.color); }
    } catch { /* silently fail */ }
  }, [projectId, user, cursorPosition, activeFileId]);

  const fetchOthers = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/collab/presence/${projectId}`);
      if (res.ok) setOthers(await res.json());
    } catch { /* */ }
  }, [projectId]);

  useEffect(() => {
    heartbeat();
    fetchOthers();
    const hInterval = setInterval(heartbeat, 8000);
    const fInterval = setInterval(fetchOthers, 5000);
    return () => {
      clearInterval(hInterval);
      clearInterval(fInterval);
      if (projectId) fetch(`/api/collab/presence/${projectId}`, { method: 'DELETE' }).catch(() => {});
    };
  }, [projectId, heartbeat, fetchOthers]);

  if (!projectId) return null;

  return (
    <div className="flex items-center gap-1">
      {others.length > 0 && (
        <div className="flex items-center gap-1 mr-1">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">{others.length}</span>
        </div>
      )}
      {/* My indicator */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Avatar className="h-6 w-6 border-2 cursor-default" style={{ borderColor: myColor }}>
            <AvatarFallback className="text-[9px] font-bold" style={{ backgroundColor: myColor + '33', color: myColor }}>
              {user?.name?.[0]?.toUpperCase() || 'Y'}
            </AvatarFallback>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">You ({user?.name})</TooltipContent>
      </Tooltip>

      {/* Others */}
      {others.map(u => (
        <Tooltip key={u.userId}>
          <TooltipTrigger asChild>
            <Avatar className="h-6 w-6 border-2 cursor-default animate-in fade-in" style={{ borderColor: u.color }}>
              <AvatarFallback className="text-[9px] font-bold" style={{ backgroundColor: u.color + '33', color: u.color }}>
                {u.name[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <span>{u.name}</span>
            {u.cursor && <span className="text-muted-foreground ml-1">L{u.cursor.line}:C{u.cursor.column}</span>}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

export function useCollabCursors(projectId: number | null) {
  const [cursors, setCursors] = useState<PresenceUser[]>([]);
  useEffect(() => {
    if (!projectId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/collab/presence/${projectId}`);
        if (res.ok) setCursors(await res.json());
      } catch { /* */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [projectId]);
  return cursors;
}
