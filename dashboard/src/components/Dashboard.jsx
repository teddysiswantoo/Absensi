import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'

export default function Dashboard() {
  const { profile } = useAuth()

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Redirect based on role
  if (profile.role === 'admin') {
    return <Navigate to="/admin" replace />
  } else {
    return <Navigate to="/employee" replace />
  }
}