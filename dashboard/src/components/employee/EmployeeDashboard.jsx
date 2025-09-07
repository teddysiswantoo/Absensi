import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import  supabase  from '../../lib/supabase'
import AttendanceForm from '../attendance/AttendanceForm'
import AttendanceHistory from './AttendanceHistory'
import ProfileSettings from './ProfileSettings'
import Sidebar from './Sidebar'
import Header from './Header'
import { Calendar, Clock, User, BarChart3 } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'

function EmployeeHome() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState({
    thisMonth: 0,
    totalHours: 0,
    avgCheckIn: '00:00',
    lateCount: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const now = new Date()
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
      const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .gte('tanggal', monthStart)
        .lte('tanggal', monthEnd)

      if (error) throw error

      const thisMonth = data.length
      let totalMinutes = 0
      let lateCount = 0
      let checkInTimes = []

      data.forEach(record => {
        if (record.total_jam) {
          const [hours, minutes] = record.total_jam.split(':').map(Number)
          totalMinutes += hours * 60 + minutes
        }
        if (record.keterangan === 'Telat') {
          lateCount++
        }
        if (record.jam_masuk) {
          checkInTimes.push(record.jam_masuk)
        }
      })

      const totalHours = Math.round(totalMinutes / 60 * 10) / 10

      // Calculate average check-in time
      let avgCheckIn = '00:00'
      if (checkInTimes.length > 0) {
        const totalCheckInMinutes = checkInTimes.reduce((sum, time) => {
          const [hours, minutes] = time.split(':').map(Number)
          return sum + hours * 60 + minutes
        }, 0)
        const avgMinutes = Math.round(totalCheckInMinutes / checkInTimes.length)
        const avgHours = Math.floor(avgMinutes / 60)
        const avgMins = avgMinutes % 60
        avgCheckIn = `${avgHours.toString().padStart(2, '0')}:${avgMins.toString().padStart(2, '0')}`
      }

      setStats({
        thisMonth,
        totalHours,
        avgCheckIn,
        lateCount
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
        <h1 className="text-2xl font-bold text-gray-900">
          Selamat datang, {profile?.nama}!
        </h1>
        <p className="text-gray-600">
          {profile?.jabatan} - {profile?.divisi}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Hadir Bulan Ini</p>
              <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Jam</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalHours}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rata-rata Masuk</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgCheckIn}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <User className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Telat</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lateCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceForm />
        
        {/* Quick Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Informasi</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-medium">Jam Kerja</h3>
              <p className="text-sm text-gray-600">08:00 - 17:00 WIB</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-medium">Jam Istirahat</h3>
              <p className="text-sm text-gray-600">12:00 - 13:00 WIB</p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="font-medium">Toleransi Keterlambatan</h3>
              <p className="text-sm text-gray-600">15 menit</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EmployeeDashboard() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Routes>
            <Route path="/" element={<EmployeeHome />} />
            <Route path="/attendance" element={<AttendanceHistory />} />
            <Route path="/profile" element={<ProfileSettings />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}