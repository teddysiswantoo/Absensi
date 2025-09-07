import React, { useState, useEffect } from 'react'
import  supabase  from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Settings, Save, Clock, Users, Shield } from 'lucide-react'

export default function SystemSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState({
    work_start_time: '08:00',
    work_end_time: '17:00',
    break_start_time: '12:00',
    break_end_time: '13:00',
    late_threshold: 15,
    default_annual_leave: 12,
    company_name: 'PT. Contoh Perusahaan',
    timezone: 'Asia/Jakarta',
    late_detection_enabled: true,
    gps_required: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')

      if (error) throw error

      const settingsObj = {}
      data.forEach(setting => {
        if (setting.value_text) {
          settingsObj[setting.key] = setting.value_text
        } else if (setting.value_int !== null) {
          settingsObj[setting.key] = setting.value_int
        } else if (setting.value_bool !== null) {
          settingsObj[setting.key] = setting.value_bool
        }
      })

      setSettings({ ...settings, ...settingsObj })
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      // Update each setting
      const updates = [
        { key: 'work_start_time', value_text: settings.work_start_time },
        { key: 'work_end_time', value_text: settings.work_end_time },
        { key: 'break_start_time', value_text: settings.break_start_time },
        { key: 'break_end_time', value_text: settings.break_end_time },
        { key: 'company_name', value_text: settings.company_name },
        { key: 'timezone', value_text: settings.timezone },
        { key: 'late_threshold', value_int: parseInt(settings.late_threshold) },
        { key: 'default_annual_leave', value_int: parseInt(settings.default_annual_leave) },
        { key: 'late_detection_enabled', value_bool: settings.late_detection_enabled },
        { key: 'gps_required', value_bool: settings.gps_required }
      ]

      for (const update of updates) {
        const { error } = await supabase
          .from('system_settings')
          .upsert({
            key: update.key,
            value_text: update.value_text || null,
            value_int: update.value_int || null,
            value_bool: update.value_bool !== undefined ? update.value_bool : null
          }, { onConflict: 'key' })

        if (error) throw error
      }

      // Log audit
      await supabase
        .from('audit_logs')
        .insert([{
          user_id: user.id,
          action: 'UPDATE_SYSTEM_SETTINGS',
          details: 'Updated system settings',
          ip_address: null
        }])

      setMessage('Pengaturan berhasil disimpan!')
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage('Error: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value })
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
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Sistem</h1>
        <p className="text-gray-600">Kelola konfigurasi sistem absensi</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {message && (
          <div className={`p-4 rounded-md ${
            message.includes('Error') 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message}
          </div>
        )}

        {/* Company Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Settings className="h-5 w-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Pengaturan Perusahaan</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Perusahaan
                </label>
                <input
                  type="text"
                  value={settings.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zona Waktu
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                  <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                  <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Work Hours Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Jam Kerja</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jam Masuk
                </label>
                <input
                  type="time"
                  value={settings.work_start_time}
                  onChange={(e) => handleChange('work_start_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jam Pulang
                </label>
                <input
                  type="time"
                  value={settings.work_end_time}
                  onChange={(e) => handleChange('work_end_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jam Istirahat Mulai
                </label>
                <input
                  type="time"
                  value={settings.break_start_time}
                  onChange={(e) => handleChange('break_start_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jam Istirahat Selesai
                </label>
                <input
                  type="time"
                  value={settings.break_end_time}
                  onChange={(e) => handleChange('break_end_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Pengaturan Absensi</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Toleransi Keterlambatan (menit)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={settings.late_threshold}
                  onChange={(e) => handleChange('late_threshold', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuti Tahunan Default (hari)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={settings.default_annual_leave}
                  onChange={(e) => handleChange('default_annual_leave', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="late_detection"
                  checked={settings.late_detection_enabled}
                  onChange={(e) => handleChange('late_detection_enabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="late_detection" className="ml-2 block text-sm text-gray-900">
                  Aktifkan deteksi keterlambatan
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="gps_required"
                  checked={settings.gps_required}
                  onChange={(e) => handleChange('gps_required', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="gps_required" className="ml-2 block text-sm text-gray-900">
                  Wajibkan GPS untuk absensi
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Keamanan</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <Shield className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Pengaturan Keamanan
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Sistem menggunakan autentikasi Supabase dengan enkripsi tingkat enterprise.
                      Semua data dilindungi dengan Row Level Security (RLS).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Simpan Pengaturan
          </button>
        </div>
      </form>
    </div>
  )
}