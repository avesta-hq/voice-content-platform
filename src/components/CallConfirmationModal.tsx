'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Phone, Loader2, AlertCircle } from 'lucide-react';

interface CallConfirmationModalProps {
  isOpen: boolean;
  phoneNumber: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string;
}

export default function CallConfirmationModal({
  isOpen,
  phoneNumber,
  message,
  onConfirm,
  onCancel,
  isLoading = false,
  error,
}: CallConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Confirm Call Details
          </DialogTitle>
          <DialogDescription>
            Review the details before initiating the call
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Phone Number Display */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Calling</p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-base px-3 py-2">
                📱 {phoneNumber}
              </Badge>
            </div>
          </div>

          {/* Message Preview */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Message Preview</p>
            <p className="text-sm leading-relaxed text-foreground italic">
              "{message}"
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This message will be converted to speech and played during the call.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You will receive an incoming call at the number above. Make sure your phone is nearby.
            </AlertDescription>
          </Alert>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Initiating Call...
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4" />
                  Confirm & Call
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
