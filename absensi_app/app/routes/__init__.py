from flask import Blueprint, render_template, redirect, url_for, flash, request
from werkzeug.security import check_password_hash
from flask_login import login_user, logout_user, login_required, current_user
from datetime import date

from app.models import User, Absensi
from app import db

main = Blueprint('main', __name__)

# Redirect root ke login
@main.route('/')
def index():
    return redirect(url_for('main.login'))

# ========== LOGIN ==========
@main.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        # Jika user sudah login, arahkan berdasarkan role
        if current_user.role == 'admin':
            return redirect(url_for('main.dashboard_admin'))
        else:
            return redirect(url_for('main.dashboard_karyawan'))

    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password, password):
            login_user(user)
            flash('Login berhasil!', 'success')
            if user.role == 'admin':
                return redirect(url_for('main.dashboard_admin'))
            else:
                return redirect(url_for('main.dashboard_karyawan'))
        else:
            flash('Email atau password salah!', 'danger')

    return render_template('login.html')

# ========== LOGOUT ==========
@main.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Berhasil logout.', 'info')
    return redirect(url_for('main.login'))

# ========== DASHBOARD ADMIN ==========
@main.route('/admin/dashboard')
@login_required
def dashboard_admin():
    if current_user.role != 'admin':
        flash('Akses ditolak!', 'danger')
        return redirect(url_for('main.login'))
    
    jumlah_karyawan = User.query.filter_by(role='karyawan').count()
    jumlah_absen_hari_ini = Absensi.query.filter_by(tanggal=date.today()).count()

    return render_template('admin/dashboard.html',
                           jumlah_karyawan=jumlah_karyawan,
                           jumlah_absen_hari_ini=jumlah_absen_hari_ini)

# ===================== DAFTAR KARYAWAN =====================
@main.route('/admin/karyawan')
@login_required
def karyawan_list():
    if current_user.role != 'admin':
        flash('Akses ditolak!', 'danger')
        return redirect(url_for('main.login'))

    query = request.args.get('q', '')
    if query:
        karyawan_list = User.query.filter(
            User.role == 'karyawan',
            (User.nama.ilike(f"%{query}%") | User.nip.ilike(f"%{query}%"))
        ).all()
    else:
        karyawan_list = User.query.filter_by(role='karyawan').all()

    return render_template('admin/karyawan_list.html', karyawan_list=karyawan_list)

# ===================== DAFTAR ABSENSI =====================
@main.route('/admin/absensi')
@login_required
def absensi_list():
    if current_user.role != 'admin':
        flash('Akses ditolak!', 'danger')
        return redirect(url_for('main.login'))

    nama = request.args.get('nama', '')
    tanggal = request.args.get('tanggal', '')
    keterangan = request.args.get('keterangan', '')

    query = Absensi.query.join(User).filter(User.role == 'karyawan')

    if nama:
        query = query.filter(User.nama.ilike(f"%{nama}%"))
    if tanggal:
        query = query.filter(Absensi.tanggal == tanggal)
    if keterangan:
        query = query.filter(Absensi.keterangan == keterangan)

    absensi_list = query.order_by(Absensi.tanggal.desc()).all()

    return render_template('admin/absensi_list.html', absensi_list=absensi_list)

# ===================== TAMBAH KARYAWAN =====================
@main.route('/admin/tambah_karyawan', methods=['GET', 'POST'])
@login_required
def tambah_karyawan():
    if current_user.role != 'admin':
        flash('Akses ditolak!', 'danger')
        return redirect(url_for('main.login'))

    if request.method == 'POST':
        nama = request.form.get('nama')
        nip = request.form.get('nip')
        jabatan = request.form.get('jabatan')
        divisi = request.form.get('divisi')
        email = request.form.get('email')
        password = request.form.get('password')

        # Validasi email unik
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash('Email sudah digunakan.', 'danger')
            return redirect(url_for('main.tambah_karyawan'))

        new_user = User(
            nama=nama,
            nip=nip,
            jabatan=jabatan,
            divisi=divisi,
            email=email,
            role='karyawan'
        )
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        flash('Karyawan berhasil ditambahkan.', 'success')
        return redirect(url_for('main.karyawan_list'))

    return render_template('admin/tambah_karyawan.html')

# ========== DASHBOARD KARYAWAN ==========
@main.route('/karyawan/dashboard')
@login_required
def dashboard_karyawan():
    if current_user.role != 'karyawan':
        flash('Akses ditolak!', 'danger')
        return redirect(url_for('main.login'))
    
    absen_hari_ini = Absensi.query.filter_by(user_id=current_user.id, tanggal=date.today()).first()

    return render_template('dashboard_karyawan.html', absen_hari_ini=absen_hari_ini)
