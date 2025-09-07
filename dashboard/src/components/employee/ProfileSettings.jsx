import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import  supabase  from '../../lib/supabase'
import { User, Mail, Briefcase, Building, Save } from 'lucide-react'

export default function ProfileSettings() {
  const { profile } = useAuth()
  const [formData, setFormData] = useState({
    nama: profile?.nama || '',
    email: profile?.email || '',
    jabatan: profile?.jabatan || '',
    divisi: profile?.divisi || ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('users')
        .update({
          nama: formData.nama,
          jabatan: formData.jabatan,
          divisi: formData.divisi
        })
        .eq('id', profile.id)

      if (error) throw error

      setMessage('Profil berhasil diperbarui!')
      
      // Log audit
      await supabase
        .from('audit_logs')
        .insert([{
          user_id: profile.id,
          action: 'UPDATE_PROFILE',
          details: 'Updated profile information',
          ip_address: null
        }])

    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Profil</h1>
        <p className="text-gray-600">Kelola informasi profil Anda</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Informasi Personal</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {message && (
            <div className={`p-4 rounded-md ${
              message.includes('Error') 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Nama Lengkap
              </label>
              <input
                type="text"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="inline h-4 w-4 mr-1" />
                Jabatan
              </label>
              <input
                type="text"
                name="jabatan"
                value={formData.jabatan}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="inline h-4 w-4 mr-1" />
                Divisi
              </label>
              <input
                type="text"
                name="divisi"
                value={formData.divisi}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Akun</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NIP
                </label>
                <input
                  type="text"
                  value={profile?.nip || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <input
                  type="text"
                  value={profile?.role || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}