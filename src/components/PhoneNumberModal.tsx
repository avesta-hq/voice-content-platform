'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Phone, Loader2 } from 'lucide-react';

interface PhoneNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (phoneNumber: string, save: boolean) => void;
  defaultValue?: string;
  isLoading?: boolean;
}

export default function PhoneNumberModal({
  isOpen,
  onClose,
  onSubmit,
  defaultValue = '',
  isLoading = false,
}: PhoneNumberModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(defaultValue);
  const [savePhoneNumber, setSavePhoneNumber] = useState(true);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setPhoneNumber(defaultValue);
    setError('');
    setTouched(false);
  }, [isOpen, defaultValue]);

  /**
   * Validate phone number format (E.164)
   * Format: +[1-9]{1}[0-9]{1,14}
   */
  const validatePhoneNumber = (value: string): boolean => {
    const e164Regex = /^\+?[1-9]\d{1,14}$/;
    return e164Regex.test(value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);

    if (touched && value) {
      if (!validatePhoneNumber(value)) {
        setError('Invalid phone number format. Use E.164 format (e.g., +1234567890)');
      } else {
        setError('');
      }
    }
  };

  const handleBlur = () => {
    setTouched(true);
    if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
      setError('Invalid phone number format. Use E.164 format (e.g., +1234567890)');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      setTouched(true);
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Invalid phone number format. Use E.164 format (e.g., +1234567890)');
      setTouched(true);
      return;
    }

    // Submit
    onSubmit(phoneNumber, savePhoneNumber);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Enter Phone Number
          </DialogTitle>
          <DialogDescription>
            We'll call you at this number with your message. Use international format.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone Number Input */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-muted-foreground">📱</span>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={handlePhoneChange}
                onBlur={handleBlur}
                disabled={isLoading}
                className="pl-8"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Format: +[country code][number] (e.g., +1234567890, +919876543210)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Save Phone Number Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="save-phone"
              checked={savePhoneNumber}
              onCheckedChange={(checked) => setSavePhoneNumber(checked as boolean)}
              disabled={isLoading}
            />
            <Label htmlFor="save-phone" className="text-sm font-normal cursor-pointer">
              Save phone number for future calls
            </Label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !phoneNumber.trim()}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Initiating Call...
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4" />
                  Call Me
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
