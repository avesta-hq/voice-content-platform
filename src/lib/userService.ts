import { User, LoginCredentials, AuthResponse, UserPreferences, UserContent } from '@/types';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3001';

export class UserService {
  private static token: string | null = null;
  private static currentUser: User | null = null;

  // Initialize token from localStorage
  static initialize() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        this.currentUser = JSON.parse(userData);
      }
    }
  }

  // Set authentication token
  static setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  // Get current authentication token
  static getToken(): string | null {
    return this.token;
  }

  // Set current user
  static setCurrentUser(user: User) {
    this.currentUser = user;
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  }

  // Get current user
  static getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Clear authentication data
  static logout() {
    this.token = null;
    this.currentUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
    }
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return !!this.token && !!this.currentUser;
  }

  // Get auth headers for API requests
  private static getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Login user
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // For demo purposes, we'll simulate login with the dummy users
      const response = await fetch(`${API_BASE_URL}/users`);
      const users: User[] = await response.json();
      
      // Find user by email (in real app, this would be handled by backend)
      const user = users.find(u => u.email === credentials.email);
      
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Simulate authentication response
      const authResponse: AuthResponse = {
        user,
        token: `demo_token_${user.id}_${Date.now()}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };

      // Set authentication data
      this.setToken(authResponse.token);
      this.setCurrentUser(authResponse.user);

      return authResponse;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Get user by ID
  static async getUserById(id: number): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }

  // Update user preferences
  static async updatePreferences(userId: number, preferences: Partial<UserPreferences>): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          preferences: {
            ...this.currentUser?.preferences,
            ...preferences
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }
      
      const updatedUser = await response.json();
      this.setCurrentUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Update preferences error:', error);
      throw error;
    }
  }

  // Get all users (for admin purposes)
  static async getAllUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  }

  // Create new user (for registration)
  static async createUser(userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'>): Promise<User> {
    try {
      const newUser = {
        ...userData,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(newUser),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create user');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  // Save user content
  static async saveUserContent(content: Omit<UserContent, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserContent> {
    try {
      const newContent = {
        ...content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch(`${API_BASE_URL}/userContent`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(newContent),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save content');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Save content error:', error);
      throw error;
    }
  }

  // Get user content history
  static async getUserContent(userId: number): Promise<UserContent[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/userContent?userId=${userId}`, {
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user content');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get user content error:', error);
      throw error;
    }
  }
}

// Initialize the service when the module loads
if (typeof window !== 'undefined') {
  UserService.initialize();
}
