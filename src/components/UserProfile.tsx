'use client';

import React, { useState, useEffect } from 'react';
import { User, UserPreferences } from '@/types';
import { UserService } from '@/lib/userService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

interface UserProfileProps {
  user: User;
  onLogout: () => void;
}

export default function UserProfile({ user, onLogout }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(user.preferences);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Reset loading state if user is no longer authenticated (after logout completes)
  useEffect(() => {
    if (isLoggingOut && !UserService.isAuthenticated()) {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      await UserService.updatePreferences(user.id, preferences);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setPreferences(user.preferences);
    setIsEditing(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      // Reset loading state on error
      setIsLoggingOut(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">User Profile</CardTitle>
            <CardDescription>Manage your account information and preferences</CardDescription>
          </div>
          <Button 
            onClick={handleLogout}
            variant="destructive"
            size="sm"
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging out...
              </>
            ) : (
              'Logout'
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">

        {/* User Info */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage 
                src={user.avatar} 
                alt={`${user.firstName} ${user.lastName}`}
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {user.firstName[0]}{user.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-foreground">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-muted-foreground">@{user.username}</p>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Role:</span>
              <Badge variant="secondary" className="capitalize">
                {user.role}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Member since:</span>
              <span className="text-foreground">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Last login:</span>
              <span className="text-foreground">
                {new Date(user.lastLogin).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Status:</span>
              <Badge variant={user.isActive ? "default" : "destructive"}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Preferences */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Preferences</h3>
              <p className="text-sm text-muted-foreground">Customize your experience</p>
            </div>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
              >
                Edit
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="input-language">Default Input Language</Label>
                  <Select
                    value={preferences.defaultInputLanguage}
                    onValueChange={(value) => setPreferences({ ...preferences, defaultInputLanguage: value })}
                  >
                    <SelectTrigger id="input-language">
                      <SelectValue placeholder="Select input language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gu">Gujarati</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="output-language">Default Output Language</Label>
                  <Select
                    value={preferences.defaultOutputLanguage}
                    onValueChange={(value) => setPreferences({ ...preferences, defaultOutputLanguage: value })}
                  >
                    <SelectTrigger id="output-language">
                      <SelectValue placeholder="Select output language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="gu">Gujarati</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={preferences.theme}
                  onValueChange={(value) => setPreferences({ ...preferences, theme: value as 'light' | 'dark' })}
                >
                  <SelectTrigger id="theme" className="w-full md:w-[200px]">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleSavePreferences}
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Input Language</Label>
                  <p className="text-foreground capitalize font-medium">{preferences.defaultInputLanguage}</p>
                </div>
              </Card>
              <Card className="p-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Output Language</Label>
                  <p className="text-foreground capitalize font-medium">{preferences.defaultOutputLanguage}</p>
                </div>
              </Card>
              <Card className="p-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Theme</Label>
                  <Badge variant="outline" className="capitalize w-fit">
                    {preferences.theme}
                  </Badge>
                </div>
              </Card>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
