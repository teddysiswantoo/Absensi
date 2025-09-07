import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import  supabase  from '../../lib/supabase'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'
import EmployeeManagement from './EmployeeManagement'
import AttendanceReports from './AttendanceReports'
import SystemSettings from './SystemSettings'
import { Users, Clock, TrendingUp, AlertTriangle } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'

function AdminHome() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    lateToday: 0,
    avgWorkHours: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Get total employees
      const { data: employees, error: empError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'karyawan')
        .eq('is_active', true)

      if (empError) throw empError

      // Get today's attendance
      const today = format(new Date(), 'yyyy-MM-dd')
      const { data: todayAttendance, error: attError } = await supabase
        .from('attendance')
        .select('*')
        .eq('tanggal', today)

      if (attError) throw attError

      // Get this month's attendance for average calculation
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
      const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd')
      const { data: monthAttendance, error: monthError } = await supabase
        .from('attendance')
        .select('total_jam')
        .gte('tanggal', monthStart)
        .lte('tanggal', monthEnd)
        .not('total_jam', 'is', null)

      if (monthError) throw monthError

      const presentToday = todayAttendance.filter(a => a.jam_masuk).length
      const lateToday = todayAttendance.filter(a => a.keterangan === 'Telat').length

      // Calculate average work hours
      let avgWorkHours = 0
      if (monthAttendance.length > 0) {
        const totalMinutes = monthAttendance.reduce((sum, record) => {
          if (record.total_jam) {
            const [hours, minutes] = record.total_jam.split(':').map(Number)
            return sum + hours * 60 + minutes
          }
          return sum
        }, 0)
        avgWorkHours = Math.round(totalMinutes / monthAttendance.length / 60 * 10) / 10
      }

      setStats({
        totalEmployees: employees.length,
        presentToday,
        lateToday,
        avgWorkHours
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-gray-600">Kelola sistem absensi karyawan</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Karyawan</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Hadir Hari Ini</p>
              <p className="text-2xl font-bold text-gray-900">{stats.presentToday}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Telat Hari Ini</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lateToday}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rata-rata Jam Kerja</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgWorkHours}h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <Users className="h-6 w-6 text-blue-600 mb-2" />
            <h3 className="font-medium">Tambah Karyawan</h3>
            <p className="text-sm text-gray-600">Daftarkan karyawan baru</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <Clock className="h-6 w-6 text-green-600 mb-2" />
            <h3 className="font-medium">Lihat Laporan</h3>
            <p className="text-sm text-gray-600">Analisis data absensi</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <TrendingUp className="h-6 w-6 text-purple-600 mb-2" />
            <h3 className="font-medium">Pengaturan</h3>
            <p className="text-sm text-gray-600">Konfigurasi sistem</p>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Routes>
            <Route path="/" element={<AdminHome />} />
            <Route path="/employees" element={<EmployeeManagement />} />
            <Route path="/reports" element={<AttendanceReports />} />
            <Route path="/settings" element={<SystemSettings />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}