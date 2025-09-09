import React, { useState, useEffect } from 'react'
import { MapPin, Clock, CheckCircle, XCircle } from 'lucide-react'
import  supabase  from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { format } from 'date-fns'

export default function AttendanceForm() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [location, setLocation] = useState(null)
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    fetchTodayAttendance()
    getCurrentLocation()

    return () => clearInterval(timer)
  }, [])

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  const fetchTodayAttendance = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .eq('tanggal', today)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      setTodayAttendance(data)
    } catch (error) {
      console.error('Error fetching attendance:', error)
    }
  }

  const handleCheckIn = async () => {
    setLoading(true)
    try {
      const now = new Date()
      const today = format(now, 'yyyy-MM-dd')
      const time = format(now, 'HH:mm:ss')
      const dayName = format(now, 'EEEE')
      
      const locationString = location 
        ? `${location.latitude},${location.longitude}` 
        : 'Location not available'

      const { data, error } = await supabase
        .from('attendance')
        .insert([{
          user_id: user.id,
          tanggal: today,
          hari: dayName,
          jam_masuk: time,
          lokasi_masuk: locationString,
          keterangan: 'Hadir'
        }])
        .select()

      if (error) throw error

      setTodayAttendance(data[0])
      
      // Log audit
      await supabase
        .from('audit_logs')
        .insert([{
          user_id: user.id,
          action: 'CHECK_IN',
          details: `Check-in at ${time}`,
          ip_address: null
        }])

    } catch (error) {
      console.error('Error checking in:', error)
      alert('Error checking in: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setLoading(true)
    try {
      const now = new Date()
      const time = format(now, 'HH:mm:ss')
      
      const locationString = location 
        ? `${location.latitude},${location.longitude}` 
        : 'Location not available'

      // Calculate total hours
      const checkInTime = new Date(`2000-01-01 ${todayAttendance.jam_masuk}`)
      const checkOutTime = new Date(`2000-01-01 ${time}`)
      const diffMs = checkOutTime - checkInTime
      const totalHours = Math.floor(diffMs / (1000 * 60 * 60))
      const totalMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      const totalJam = `${totalHours.toString().padStart(2, '0')}:${totalMinutes.toString().padStart(2, '0')}`

      const { data, error } = await supabase
        .from('attendance')
        .update({
          jam_keluar: time,
          lokasi_keluar: locationString,
          total_jam: totalJam
        })
        .eq('id', todayAttendance.id)
        .select()

      if (error) throw error

      setTodayAttendance(data[0])
      
      // Log audit
      await supabase
        .from('audit_logs')
        .insert([{
          user_id: user.id,
          action: 'CHECK_OUT',
          details: `Check-out at ${time}`,
          ip_address: null
        }])

    } catch (error) {
      console.error('Error checking out:', error)
      alert('Error checking out: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const canCheckIn = !todayAttendance?.jam_masuk
  const canCheckOut = todayAttendance?.jam_masuk && !todayAttendance?.jam_keluar

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Absensi Hari Ini</h2>
      
      {/* Current Time */}
      <div className="text-center mb-6">
        <div className="text-3xl font-bold text-gray-900">
          {format(currentTime, 'HH:mm:ss')}
        </div>
        <div className="text-gray-600">
          {format(currentTime, 'EEEE, dd MMMM yyyy')}
        </div>
      </div>

      {/* Location Status */}
      <div className="flex items-center justify-center mb-6">
        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
        <span className="text-sm text-gray-600">
          {location ? 'Lokasi terdeteksi' : 'Mengambil lokasi...'}
        </span>
      </div>

      {/* Attendance Status */}
      {todayAttendance && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium mb-2">Status Absensi</h3>
          <div className="space-y-2 text-sm">
            {todayAttendance.jam_masuk && (
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span>Masuk: {todayAttendance.jam_masuk}</span>
              </div>
            )}
            {todayAttendance.jam_keluar && (
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span>Keluar: {todayAttendance.jam_keluar}</span>
              </div>
            )}
            {todayAttendance.total_jam && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-blue-500 mr-2" />
                <span>Total: {todayAttendance.total_jam}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {canCheckIn && (
          <button
            onClick={handleCheckIn}
            disabled={loading || !location}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Processing...' : 'Check In'}
          </button>
        )}

        {canCheckOut && (
          <button
            onClick={handleCheckOut}
            disabled={loading || !location}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Processing...' : 'Check Out'}
          </button>
        )}

        {todayAttendance?.jam_keluar && (
          <div className="text-center text-green-600 font-medium">
            ✓ Absensi hari ini sudah lengkap
          </div>
        )}
      </div>

      {!location && (
        <div className="mt-4 text-center text-sm text-amber-600">
          Mohon aktifkan GPS untuk melakukan absensi
        </div>
      )}
    </div>
  )
}