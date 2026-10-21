import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../utils/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('voter_portal_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('voter_portal_token') || null;
  });

  const [voterProfile, setVoterProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('voter_portal_voter_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);

  // Sync token to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('voter_portal_token', token);
    } else {
      localStorage.removeItem('voter_portal_token');
    }
  }, [token]);

  // Sync user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('voter_portal_user', JSON.stringify(user));
      if (user.must_change_password) {
        setShowPasswordChangeModal(true);
      }
    } else {
      localStorage.removeItem('voter_portal_user');
    }
  }, [user]);

  // Sync voterProfile to localStorage
  useEffect(() => {
    if (voterProfile) {
      localStorage.setItem('voter_portal_voter_profile', JSON.stringify(voterProfile));
    } else {
      localStorage.removeItem('voter_portal_voter_profile');
    }
  }, [voterProfile]);

  // Verify auth session on initial load
  const verifySession = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiRequest('/api/auth/me', { token });
      if (res && res.user) {
        setUser(res.user);
        if (res.voterProfile) setVoterProfile(res.voterProfile);
        if (res.user.must_change_password) {
          setShowPasswordChangeModal(true);
        }
      }
    } catch (err) {
      console.warn('Session verification failed:', err.message);
      // If token expired or user blocked, logout cleanly
      if (err.status === 401 || err.status === 403) {
        setToken(null);
        setUser(null);
        setVoterProfile(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  const login = async (identifier, password) => {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { identifier, password }
    });

    setToken(data.token);
    setUser(data.user);
    if (data.voterProfile) {
      setVoterProfile(data.voterProfile);
    } else {
      setVoterProfile(null);
    }

    if (data.user.must_change_password) {
      setShowPasswordChangeModal(true);
    }

    return data;
  };

  const logout = async () => {
    try {
      if (token) {
        await apiRequest('/api/auth/logout', { method: 'POST', token });
      }
    } catch (e) {
      // Ignore logout errors
    } finally {
      setToken(null);
      setUser(null);
      setVoterProfile(null);
      setShowPasswordChangeModal(false);
      localStorage.removeItem('voter_portal_token');
      localStorage.removeItem('voter_portal_user');
      localStorage.removeItem('voter_portal_voter_profile');
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    await apiRequest('/api/auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword }
    });

    setUser(prev => prev ? { ...prev, must_change_password: false } : prev);
    setShowPasswordChangeModal(false);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await apiRequest('/api/auth/me', { token });
      if (res && res.user) {
        setUser(res.user);
        if (res.voterProfile) setVoterProfile(res.voterProfile);
      }
    } catch (e) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        voterProfile,
        setVoterProfile,
        isLoading,
        isAuthenticated: !!token && !!user,
        role: user ? user.role : null,
        login,
        logout,
        changePassword,
        refreshUser,
        showPasswordChangeModal,
        setShowPasswordChangeModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

