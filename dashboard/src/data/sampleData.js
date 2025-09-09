// Sample data for demonstration purposes
// This would normally be inserted via Supabase SQL or API

export const sampleUsers = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    nama: 'Admin System',
    nip: 'ADM001',
    email: 'admin@example.com',
    jabatan: 'System Administrator',
    divisi: 'IT',
    role: 'admin',
    is_active: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    nama: 'John Doe',
    nip: 'EMP001',
    email: 'john@example.com',
    jabatan: 'Software Developer',
    divisi: 'IT',
    role: 'karyawan',
    is_active: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    nama: 'Jane Smith',
    nip: 'EMP002',
    email: 'jane@example.com',
    jabatan: 'HR Manager',
    divisi: 'Human Resources',
    role: 'karyawan',
    is_active: true
  }
]

export const sampleAttendance = [
  {
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    tanggal: '2024-01-15',
    hari: 'Monday',
    jam_masuk: '08:00:00',
    jam_keluar: '17:00:00',
    total_jam: '09:00',
    keterangan: 'Hadir',
    lokasi_masuk: '-6.2088,106.8456',
    lokasi_keluar: '-6.2088,106.8456'
  },
  {
    user_id: '550e8400-e29b-41d4-a716-446655440002',
    tanggal: '2024-01-15',
    hari: 'Monday',
    jam_masuk: '08:15:00',
    jam_keluar: '17:05:00',
    total_jam: '08:50',
    keterangan: 'Telat',
    lokasi_masuk: '-6.2088,106.8456',
    lokasi_keluar: '-6.2088,106.8456'
  }
]

export const setupInstructions = `
## Supabase Setup Instructions

1. **Database Setup**
   - The SQL schema has been prepared but needs to be executed in your Supabase dashboard
   - Go to SQL Editor in your Supabase dashboard
   - Copy and paste the SQL from the error we encountered earlier
   - This will create all necessary tables with proper RLS policies

2. **Authentication Setup**
   - Enable Email authentication in Supabase Auth settings
   - Create test users:
     * admin@example.com / admin123 (Admin)
     * employee@example.com / emp123 (Employee)

3. **Sample Data**
   - After creating users via Auth, insert their profiles into the users table
   - Add sample attendance records for testing

4. **API Key Configuration**
   - The anon key is already configured in src/lib/supabase.js
   - Make sure your RLS policies are properly set up for security

## Features Implemented

✅ **Authentication System**
- Login/logout with role-based routing
- Protected routes for admin/employee access
- Session management with Supabase Auth

✅ **Employee Dashboard**
- Real-time attendance tracking with GPS
- Personal attendance history
- Monthly statistics
- Profile management

✅ **Admin Dashboard**
- Employee management (CRUD operations)
- Attendance reports with filtering
- System settings configuration
- Analytics and statistics

✅ **Attendance System**
- GPS-based check-in/check-out
- Automatic work hours calculation
- Late detection based on system settings
- Audit logging for all activities

✅ **Modern UI/UX**
- Responsive design with Tailwind CSS
- Interactive components with Lucide icons
- Real-time data updates
- Export functionality (CSV)

## Next Steps

1. Set up the Supabase database schema
2. Create test user accounts
3. Test the attendance functionality
4. Configure system settings as needed
`