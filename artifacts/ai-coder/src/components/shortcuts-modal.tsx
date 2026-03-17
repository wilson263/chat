import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SHORTCUT_GROUPS = [
  {
    label: 'Chat',
    shortcuts: [
      { keys: ['Enter'], action: 'Send message' },
      { keys: ['Shift', 'Enter'], action: 'New line in message' },
      { keys: ['Ctrl', 'K'], action: 'New chat' },
      { keys: ['Ctrl', 'E'], action: 'Export chat as Markdown' },
      { keys: ['Ctrl', 'B'], action: 'Toggle sidebar' },
      { keys: ['Ctrl', 'P'], action: 'Open Prompt Library' },
      { keys: ['?'], action: 'Show this shortcuts panel' },
      { keys: ['Escape'], action: 'Close modals / Cancel' },
    ],
  },
  {
    label: 'Workspace / Editor',
    shortcuts: [
      { keys: ['Ctrl', 'S'], action: 'Save current file' },
      { keys: ['Ctrl', 'Z'], action: 'Undo' },
      { keys: ['Ctrl', 'Shift', 'Z'], action: 'Redo' },
      { keys: ['Ctrl', '/'], action: 'Toggle line comment' },
      { keys: ['Ctrl', 'F'], action: 'Find in file' },
      { keys: ['Ctrl', 'H'], action: 'Find and replace' },
      { keys: ['Alt', 'Click'], action: 'Multi-cursor editing' },
    ],
  },
  {
    label: 'Navigation',
    shortcuts: [
      { keys: ['Ctrl', 'P'], action: 'Quick open file (in editor)' },
      { keys: ['Alt', '←'], action: 'Go back' },
      { keys: ['Alt', '→'], action: 'Go forward' },
    ],
  },
];

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

function Key({ label }: { label: string }) {
  return (
    <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 min-w-[24px] h-5 text-[10px] font-semibold rounded border border-border bg-muted text-muted-foreground font-mono">
      {label}
    </kbd>
  );
}

export function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {SHORTCUT_GROUPS.map(group => (
            <div key={group.label}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group.label}</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-2">
                {group.shortcuts.map(({ keys, action }) => (
                  <div key={action} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-foreground">{action}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {keys.map((k, i) => (
                        <React.Fragment key={k}>
                          {i > 0 && <span className="text-xs text-muted-foreground/60">+</span>}
                          <Key label={k} />
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press <Key label="?" /> anywhere in the chat to open this panel
        </p>
      </DialogContent>
    </Dialog>
  );
}
