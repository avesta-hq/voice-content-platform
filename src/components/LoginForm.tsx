'use client';

import React, { useState, useEffect } from 'react';
import { UserService } from '@/lib/userService';
import { LoginCredentials, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    const fetchDemoUsers = async () => {
      try {
        const users = await UserService.getUsers();
        setDemoUsers(users);
      } catch (err) {
        console.error('Failed to fetch demo users:', err);
        // Fallback to hardcoded users if API fails
        setDemoUsers([
          {
            id: 1,
            username: 'john_doe',
            email: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'user',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            createdAt: '2024-01-01T00:00:00.000Z',
            lastLogin: '2024-01-01T00:00:00.000Z',
            isActive: true,
            preferences: {
              defaultInputLanguage: 'en',
              defaultOutputLanguage: 'en',
              theme: 'light'
            }
          },
          {
            id: 2,
            username: 'sarah_wilson',
            email: 'sarah.wilson@example.com',
            firstName: 'Sarah',
            lastName: 'Wilson',
            role: 'user',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            createdAt: '2024-01-01T00:00:00.000Z',
            lastLogin: '2024-01-01T00:00:00.000Z',
            isActive: true,
            preferences: {
              defaultInputLanguage: 'en',
              defaultOutputLanguage: 'en',
              theme: 'light'
            }
          },
          {
            id: 3,
            username: 'mike_chen',
            email: 'mike.chen@example.com',
            firstName: 'Mike',
            lastName: 'Chen',
            role: 'user',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            createdAt: '2024-01-01T00:00:00.000Z',
            lastLogin: '2024-01-01T00:00:00.000Z',
            isActive: true,
            preferences: {
              defaultInputLanguage: 'en',
              defaultOutputLanguage: 'en',
              theme: 'light'
            }
          }
        ]);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchDemoUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // For demo purposes, we'll use any password
      if (!credentials.email) {
        throw new Error('Please enter an email address');
      }

      await UserService.login(credentials);
      onLoginSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (email: string) => {
    setIsLoading(true);
    setError('');

    try {
      await UserService.login({ email, password: 'demo123' });
      onLoginSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <CardDescription>
          Sign in to your Voice Content Platform account
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              type="email"
              id="email"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        {/* Demo Users Section */}
        <div className="mt-6 space-y-3">
          <h3 className="font-semibold text-foreground">
            Demo Users ({demoUsers.length}) - Click to Login
          </h3>
          {isLoadingUsers ? (
            <div className="text-center py-4">
              <div className="text-muted-foreground">Loading users...</div>
            </div>
          ) : (
            <div className="space-y-2">
              {demoUsers.map((user) => (
                <Button
                  key={user.id}
                  onClick={() => handleDemoLogin(user.email)}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full justify-start h-auto p-3"
                >
                  <div className="text-left">
                    <div className="font-medium">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </Button>
              ))}
            </div>
          )}
          
          <p className="text-center text-sm text-muted-foreground">
            Demo mode: Use any password with the demo emails above
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
