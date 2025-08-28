'use client';

import React, { useState } from 'react';
import { UserService } from '@/lib/userService';
import { LoginCredentials } from '@/types';

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
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
        <p className="text-gray-600">Sign in to your Voice Content Platform account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={credentials.email}
            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your password"
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      {/* Demo Users Section */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="font-semibold text-blue-800 mb-3">Demo Users (Click to Login)</h3>
        <div className="space-y-2">
          <button
            onClick={() => handleDemoLogin('john.doe@example.com')}
            disabled={isLoading}
            className="w-full text-left p-2 bg-white border border-blue-200 rounded hover:bg-blue-100 transition-colors"
          >
            <div className="font-medium text-blue-700">John Doe</div>
            <div className="text-sm text-blue-600">john.doe@example.com</div>
          </button>
          
          <button
            onClick={() => handleDemoLogin('sarah.wilson@example.com')}
            disabled={isLoading}
            className="w-full text-left p-2 bg-white border border-blue-200 rounded hover:bg-blue-100 transition-colors"
          >
            <div className="font-medium text-blue-700">Sarah Wilson</div>
            <div className="text-sm text-blue-600">sarah.wilson@example.com</div>
          </button>
          
          <button
            onClick={() => handleDemoLogin('mike.chen@example.com')}
            disabled={isLoading}
            className="w-full text-left p-2 bg-white border border-blue-200 rounded hover:bg-blue-100 transition-colors"
          >
            <div className="font-medium text-blue-700">Mike Chen</div>
            <div className="text-sm text-blue-600">mike.chen@example.com</div>
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Demo mode: Use any password with the demo emails above</p>
      </div>
    </div>
  );
}
