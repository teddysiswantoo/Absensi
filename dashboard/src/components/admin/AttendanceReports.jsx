import React, { useState, useEffect } from 'react'
import supabase  from '../../lib/supabase'
import { Calendar, Download, Filter, Users } from 'lucide-react'
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns'

export default function AttendanceReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    employee: 'all',
    status: 'all'
  })
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    fetchReports()
  }, [filters])

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, nama, nip')
        .eq('role', 'karyawan')
        .eq('is_active', true)
        .order('nama')

      if (error) throw error
      setEmployees(data)
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const fetchReports = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('attendance')
        .select(`
          *,
          users!inner(nama, nip, jabatan, divisi)
        `)
        .gte('tanggal', filters.startDate)
        .lte('tanggal', filters.endDate)
        .order('tanggal', { ascending: false })

      if (filters.employee !== 'all') {
        query = query.eq('user_id', filters.employee)
      }

      if (filters.status !== 'all') {
        query = query.eq('keterangan', filters.status)
      }

      const { data, error } = await query

      if (error) throw error
      setReports(data)
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const headers = ['Tanggal', 'Nama', 'NIP', 'Jabatan', 'Divisi', 'Jam Masuk', 'Jam Keluar', 'Total Jam', 'Status']
    const csvContent = [
      headers.join(','),
      ...reports.map(record => [
        record.tanggal,
        record.users.nama,
        record.users.nip,
        record.users.jabatan || '-',
        record.users.divisi || '-',
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
    a.download = `attendance-report-${filters.startDate}-to-${filters.endDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Laporan Absensi</h1>
        <button
          onClick={exportToCSV}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-medium">Filter Laporan</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Selesai
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Karyawan
            </label>
            <select
              value={filters.employee}
              onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Karyawan</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.nama} ({emp.nip})
                </option>
              ))}
            </select>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Hadir</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.keterangan === 'Hadir').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Telat</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.keterangan === 'Telat').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Alpha</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.keterangan === 'Alpha').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table */}
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
                    Karyawan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jabatan
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(parseISO(record.tanggal), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {record.users.nama}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.users.nip}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.users.jabatan || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.jam_masuk || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.jam_keluar || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.total_jam || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.keterangan)}`}>
                        {record.keterangan}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reports.length === 0 && (
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