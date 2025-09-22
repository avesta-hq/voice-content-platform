'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import UserProfile from '@/components/UserProfile';

export default function ThemeDemo() {
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState(65);
  const [showUserProfile, setShowUserProfile] = useState(false);

  const handleRecord = () => {
    setIsRecording(!isRecording);
  };

  // Demo user data
  const demoUser = {
    id: 1,
    username: 'demo_user',
    email: 'demo@example.com',
    firstName: 'Demo',
    lastName: 'User',
    role: 'user' as const,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    createdAt: '2024-01-01T00:00:00.000Z',
    lastLogin: new Date().toISOString(),
    isActive: true,
    preferences: {
      defaultInputLanguage: 'en',
      defaultOutputLanguage: 'en',
      theme: 'light' as const
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
            Orange Theme Demo
          </h1>
          <p className="text-muted-foreground">
            Mobile-first design with shadcn components
          </p>
        </div>

        {/* Mobile-First Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          
          {/* Voice Recording Card */}
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎤 Voice Recorder
                <Badge variant={isRecording ? "default" : "secondary"}>
                  {isRecording ? "Recording" : "Ready"}
                </Badge>
              </CardTitle>
              <CardDescription>
                Test the orange theme with recording states
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleRecord}
                className={`w-full ${isRecording ? 'recording-pulse' : ''}`}
                size="lg"
              >
                {isRecording ? '⏹️ Stop Recording' : '🎤 Start Recording'}
              </Button>
              
              {isRecording && (
                <div className="space-y-2">
                  <Label>Recording Progress</Label>
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-muted-foreground">
                    {progress}% complete
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle>📝 Form Elements</CardTitle>
              <CardDescription>
                Orange-themed form components
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  placeholder="Enter your email"
                  type="email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Input 
                  id="message" 
                  placeholder="Type your message..."
                />
              </div>
              
              <Button className="w-full" variant="outline">
                Submit Form
              </Button>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Status & Alerts</CardTitle>
              <CardDescription>
                Feedback components in orange theme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">John Doe</p>
                  <p className="text-sm text-muted-foreground">Online</p>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  🎉 Orange theme successfully applied! All components now use the vibrant orange color scheme.
                </AlertDescription>
              </Alert>

              <div className="flex flex-wrap gap-2">
                <Badge>Primary</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>

            </CardContent>
          </Card>

        </div>

        {/* Mobile-First Button Grid */}
        <Card>
          <CardHeader>
            <CardTitle>🎨 Button Variants</CardTitle>
            <CardDescription>
              All button styles with orange theme (mobile-optimized touch targets)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
            </div>
          </CardContent>
        </Card>

        {/* UserProfile Demo Toggle */}
        <Card>
          <CardHeader>
            <CardTitle>🧑‍💼 User Profile Component</CardTitle>
            <CardDescription>
              Orange-themed user profile with preferences management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowUserProfile(!showUserProfile)}
              variant={showUserProfile ? "secondary" : "default"}
              className="w-full md:w-auto"
            >
              {showUserProfile ? 'Hide User Profile' : 'Show User Profile Demo'}
            </Button>
          </CardContent>
        </Card>

        {/* UserProfile Component Demo */}
        {showUserProfile && (
          <UserProfile 
            user={demoUser}
            onLogout={() => setShowUserProfile(false)}
          />
        )}

        {/* Responsive Breakpoint Indicator */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            <span className="inline md:hidden">📱 Mobile View</span>
            <span className="hidden md:inline lg:hidden">📱 Tablet View</span>
            <span className="hidden lg:inline">🖥️ Desktop View</span>
          </p>
        </div>

      </div>
    </div>
  );
}
