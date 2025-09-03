from app import db
from flask_login import UserMixin
from datetime import datetime

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    nama = db.Column(db.String(100), nullable=False)
    nip = db.Column(db.String(50), unique=True, nullable=False)
    jabatan = db.Column(db.String(100))
    divisi = db.Column(db.String(100))
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # admin/karyawan
    absensi = db.relationship('Absensi', backref='user', lazy=True)
    cuti = db.relationship('Cuti', backref='user', lazy=True, uselist=False)

class Absensi(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    tanggal = db.Column(db.Date, default=datetime.utcnow)
    hari = db.Column(db.String(15))
    jam_masuk = db.Column(db.Time)
    jam_keluar = db.Column(db.Time)
    total_jam = db.Column(db.String(10))
    keterangan = db.Column(db.String(20))  # Hadir, Telat, Izin, Cuti, Sakit

class Cuti(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    total_cuti = db.Column(db.Integer, default=12)
    sisa_cuti = db.Column(db.Integer, default=12)
