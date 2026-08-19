'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, LogOut, PhoneOff } from 'lucide-react';

interface EndMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeave: () => void;
  onEndForAll: () => void;
  isHost: boolean;
}

export default function EndMeetingDialog({
  open,
  onOpenChange,
  onLeave,
  onEndForAll,
  isHost,
}: EndMeetingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="bg-slate-900 border-slate-800 text-white sm:max-w-md"
      >
        <DialogHeader className="text-center sm:text-center items-center">
          <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-amber-500/15 ring-2 ring-amber-500/30 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-amber-400" />
          </div>
          <DialogTitle className="text-xl text-white">Leave Meeting?</DialogTitle>
          <DialogDescription className="text-slate-400">
            Choose how you want to leave this meeting.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-2">
          {/* Leave Meeting (outline style) */}
          <Button
            onClick={() => {
              onOpenChange(false);
              onLeave();
            }}
            variant="outline"
            className="w-full h-12 text-base bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
          >
            <LogOut size={18} />
            Leave Meeting
          </Button>

          {/* End Meeting for Everyone (destructive, only for hosts) */}
          {isHost && (
            <>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onEndForAll();
                }}
                variant="destructive"
                className="w-full h-12 text-base bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20"
              >
                <PhoneOff size={18} />
                End Meeting for Everyone
              </Button>
              <p className="text-xs text-slate-500 text-center px-2">
                If you end the meeting, all participants will be disconnected and the recording
                will stop.
              </p>
            </>
          )}
        </div>

        <DialogFooter className="sm:justify-center pt-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
