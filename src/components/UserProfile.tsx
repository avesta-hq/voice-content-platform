'use client';

import React, { useState } from 'react';
import { User, UserPreferences } from '@/types';
import { UserService } from '@/lib/userService';

interface UserProfileProps {
  user: User;
  onLogout: () => void;
}

export default function UserProfile({ user, onLogout }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(user.preferences);
  const [isSaving, setIsSaving] = useState(false);

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

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">User Profile</h2>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>

      {/* User Info */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <img
            src={user.avatar}
            alt={`${user.firstName} ${user.lastName}`}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h3 className="text-xl font-semibold text-gray-800">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-gray-600">@{user.username}</p>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Role:</span>
            <span className="ml-2 text-gray-800 capitalize">{user.role}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Member since:</span>
            <span className="ml-2 text-gray-800">
              {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Last login:</span>
            <span className="ml-2 text-gray-800">
              {new Date(user.lastLogin).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Status:</span>
            <span className={`ml-2 ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
              {user.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Preferences</h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Input Language
                </label>
                <select
                  value={preferences.defaultInputLanguage}
                  onChange={(e) => setPreferences({ ...preferences, defaultInputLanguage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="gu">Gujarati</option>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Output Language
                </label>
                <select
                  value={preferences.defaultOutputLanguage}
                  onChange={(e) => setPreferences({ ...preferences, defaultOutputLanguage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="en">English</option>
                  <option value="gu">Gujarati</option>
                  <option value="hi">Hindi</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <select
                value={preferences.theme}
                onChange={(e) => setPreferences({ ...preferences, theme: e.target.value as 'light' | 'dark' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleSavePreferences}
                disabled={isSaving}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  isSaving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 rounded-md">
              <span className="text-sm font-medium text-gray-600">Input Language</span>
              <p className="text-gray-800 capitalize">{preferences.defaultInputLanguage}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <span className="text-sm font-medium text-gray-600">Output Language</span>
              <p className="text-gray-800 capitalize">{preferences.defaultOutputLanguage}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <span className="text-sm font-medium text-gray-600">Theme</span>
              <p className="text-gray-800 capitalize">{preferences.theme}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
