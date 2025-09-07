-- Supabase Database Schema for Attendance System
-- Run this in your Supabase SQL Editor

BEGIN;

-- Create users table with authentication and profile data
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    nip VARCHAR(50) UNIQUE NOT NULL,
    jabatan VARCHAR(100),
    divisi VARCHAR(100),
    email VARCHAR(120) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'karyawan' CHECK (role IN ('admin', 'karyawan')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create attendance table for daily records
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    hari VARCHAR(15),
    jam_masuk TIME,
    jam_keluar TIME,
    total_jam VARCHAR(10),
    keterangan VARCHAR(20) DEFAULT 'Hadir' CHECK (keterangan IN ('Hadir', 'Telat', 'Izin', 'Sakit', 'Alpha')),
    lokasi_masuk VARCHAR(200),
    lokasi_keluar VARCHAR(200),
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, tanggal)
);

-- Create leaves table for leave management
CREATE TABLE IF NOT EXISTS leaves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    total_cuti INTEGER NOT NULL DEFAULT 12,
    sisa_cuti INTEGER NOT NULL DEFAULT 12,
    tahun INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, tahun)
);

-- Create system settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value_text VARCHAR(500),
    value_int INTEGER,
    value_bool BOOLEAN,
    description VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address INET,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_nip ON users(nip);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, tanggal);
CREATE INDEX IF NOT EXISTS idx_attendance_tanggal ON attendance(tanggal);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Setup Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users FOR SELECT TO authenticated USING (auth.uid()::text = id::text);
CREATE POLICY "Admins can view all users" ON users FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
    )
);
CREATE POLICY "Admins can insert users" ON users FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
        SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
    )
);
CREATE POLICY "Admins can update users" ON users FOR UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
    )
);

-- RLS Policies for attendance table
CREATE POLICY "Users can view their own attendance" ON attendance FOR SELECT TO authenticated USING (user_id::text = auth.uid()::text);
CREATE POLICY "Admins can view all attendance" ON attendance FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
    )
);
CREATE POLICY "Users can insert their own attendance" ON attendance FOR INSERT TO authenticated WITH CHECK (user_id::text = auth.uid()::text);
CREATE POLICY "Users can update their own attendance" ON attendance FOR UPDATE TO authenticated USING (user_id::text = auth.uid()::text);

-- RLS Policies for leaves table
CREATE POLICY "Users can view their own leaves" ON leaves FOR SELECT TO authenticated USING (user_id::text = auth.uid()::text);
CREATE POLICY "Admins can view all leaves" ON leaves FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
    )
);
CREATE POLICY "Admins can manage leaves" ON leaves FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
    )
);

-- RLS Policies for system_settings table
CREATE POLICY "Admins can manage system settings" ON system_settings FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
    )
);
CREATE POLICY "All users can read system settings" ON system_settings FOR SELECT TO authenticated USING (true);

-- RLS Policies for audit_logs table
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
    )
);
CREATE POLICY "System can insert audit logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Insert default system settings
INSERT INTO system_settings (key, value_text, description) VALUES
    ('work_start_time', '08:00', 'Jam mulai kerja'),
    ('work_end_time', '17:00', 'Jam selesai kerja'),
    ('break_start_time', '12:00', 'Jam mulai istirahat'),
    ('break_end_time', '13:00', 'Jam selesai istirahat'),
    ('company_name', 'PT. Contoh Perusahaan', 'Nama perusahaan'),
    ('timezone', 'Asia/Jakarta', 'Zona waktu sistem')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value_int, description) VALUES
    ('late_threshold', 15, 'Toleransi keterlambatan (menit)'),
    ('default_annual_leave', 12, 'Jumlah cuti tahunan default')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value_bool, description) VALUES
    ('late_detection_enabled', true, 'Aktifkan deteksi keterlambatan'),
    ('gps_required', true, 'Wajibkan GPS untuk absensi')
ON CONFLICT (key) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leaves_updated_at BEFORE UPDATE ON leaves FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;