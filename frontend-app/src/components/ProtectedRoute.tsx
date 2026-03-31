import { Navigate } from 'react-router-dom';
import { useAppStore } from '../store/store';
import React from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppStore();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}
