import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Home, Clock, User, LogOut } from 'lucide-react'

export default function Sidebar() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navItems = [
    { to: '/employee', icon: Home, label: 'Dashboard', end: true },
    { to: '/employee/attendance', icon: Clock, label: 'Riwayat Absensi' },
    { to: '/employee/profile', icon: User, label: 'Profil' }
  ]

  return (
    <div className="bg-white w-64 shadow-lg">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800">Sistem Absensi</h1>
        <p className="text-sm text-gray-600">Karyawan</p>
      </div>
      
      <nav className="mt-6">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors ${
                isActive ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' : ''
              }`
            }
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-0 w-64 p-6">
        <button
          onClick={handleSignOut}
          className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Keluar
        </button>
      </div>
    </div>
  )
}