import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Bell, Settings } from 'lucide-react'

export default function AdminHeader() {
  const { profile } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Dashboard Administrator
          </h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Bell className="h-5 w-5" />
          </button>
          
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Settings className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{profile?.nama}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <div className="h-8 w-8 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {profile?.nama?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}