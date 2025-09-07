import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import  supabase  from '../../lib/supabase'
import { Calendar, Clock, MapPin, Download } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default function AttendanceHistory() {
  const { user } = useAuth()
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    month: format(new Date(), 'yyyy-MM'),
    status: 'all'
  })

  useEffect(() => {
    fetchAttendance()
  }, [filters])

  const fetchAttendance = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .order('tanggal', { ascending: false })

      // Filter by month if selected
      if (filters.month) {
        const startDate = `${filters.month}-01`
        const endDate = `${filters.month}-31`
        query = query.gte('tanggal', startDate).lte('tanggal', endDate)
      }

      const { data, error } = await query

      if (error) throw error

      // Filter by status if selected
      let filteredData = data
      if (filters.status !== 'all') {
        filteredData = data.filter(record => record.keterangan === filters.status)
      }

      setAttendance(filteredData)
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Hadir': return 'bg-green-100 text-green-800'
      case 'Telat': return 'bg-yellow-100 text-yellow-800'
      case 'Izin': return 'bg-blue-100 text-blue-800'
      case 'Sakit': return 'bg-purple-100 text-purple-800'
      case 'Alpha': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const exportToCSV = () => {
    const headers = ['Tanggal', 'Hari', 'Jam Masuk', 'Jam Keluar', 'Total Jam', 'Status']
    const csvContent = [
      headers.join(','),
      ...attendance.map(record => [
        record.tanggal,
        record.hari,
        record.jam_masuk || '-',
        record.jam_keluar || '-',
        record.total_jam || '-',
        record.keterangan
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-${filters.month}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Riwayat Absensi</h1>
        <button
          onClick={exportToCSV}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bulan
            </label>
            <input
              type="month"
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="Hadir">Hadir</option>
              <option value="Telat">Telat</option>
              <option value="Izin">Izin</option>
              <option value="Sakit">Sakit</option>
              <option value="Alpha">Alpha</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jam Masuk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jam Keluar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Jam
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lokasi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendance.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {format(parseISO(record.tanggal), 'dd MMM yyyy')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {record.hari}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {record.jam_masuk || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {record.jam_keluar || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.total_jam || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.keterangan)}`}>
                        {record.keterangan}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.lokasi_masuk && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500">
                            GPS Tersedia
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {attendance.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada data</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Belum ada data absensi untuk filter yang dipilih.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}