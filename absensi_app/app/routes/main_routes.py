from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user
from werkzeug.security import generate_password_hash
from app.models import User, Absensi
from app import db
from datetime import date
from sqlalchemy import func
import secrets

main_bp = Blueprint('main', __name__)

# === REDIRECT BERDASARKAN ROLE ===
@main_bp.route('/')
@login_required
def index():
    if current_user.role == 'admin':
        return redirect(url_for('main.dashboard_admin'))
    else:
        return redirect(url_for('main.dashboard_karyawan'))

# =======================
#       ADMIN ROUTES
# =======================

# Dashboard Admin
@main_bp.route('/admin/dashboard')
@login_required
def dashboard_admin():
    if current_user.role != 'admin':
        return redirect(url_for('main.dashboard_karyawan'))

    total_karyawan = User.query.filter_by(role='karyawan').count()
    jumlah_absen_hari_ini = Absensi.query.filter(func.date(Absensi.tanggal) == date.today()).count()

    grafik_kehadiran = db.session.query(
        func.strftime('%Y-%m-%d', Absensi.tanggal),
        func.count(Absensi.id)
    ).group_by(func.strftime('%Y-%m-%d', Absensi.tanggal)).all()

    labels = [row[0] for row in grafik_kehadiran]
    values = [row[1] for row in grafik_kehadiran]

    return render_template('admin/dashboard.html',
                           total_karyawan=total_karyawan,
                           jumlah_absen_hari_ini=jumlah_absen_hari_ini,
                           labels=labels,
                           values=values)

# Daftar Karyawan (Sekaligus Tambah Karyawan)
@main_bp.route('/admin/daftar-karyawan', methods=['GET', 'POST'])
@login_required
def daftar_karyawan():
    if current_user.role != 'admin':
        return redirect(url_for('main.dashboard_karyawan'))

    if request.method == 'POST':
        nama = request.form.get('nama')
        nip = request.form.get('nip')
        jabatan = request.form.get('jabatan')
        divisi = request.form.get('divisi')
        email = request.form.get('email')

        if not all([nama, nip, jabatan, divisi, email]):
            flash("Semua field wajib diisi.", "danger")
        elif User.query.filter_by(email=email).first():
            flash("Email sudah terdaftar.", "danger")
        else:
            password_plain = secrets.token_hex(4)  # Password random
            password_hashed = generate_password_hash(password_plain)

            new_user = User(
                nama=nama,
                nip=nip,
                jabatan=jabatan,
                divisi=divisi,
                email=email,
                password=password_hashed,
                role='karyawan'
            )
            db.session.add(new_user)
            db.session.commit()
            flash(f'Karyawan berhasil ditambahkan! Password: {password_plain}', 'success')
            return redirect(url_for('main.daftar_karyawan'))

    karyawan = User.query.all()
    return render_template('admin/daftar_karyawan.html', karyawan=karyawan)

# Data Absensi Semua Karyawan
@main_bp.route('/admin/data-absensi')
@login_required
def data_absensi():
    if current_user.role != 'admin':
        return redirect(url_for('main.dashboard_karyawan'))

    semua_absensi = Absensi.query.order_by(Absensi.tanggal.desc()).all()
    return render_template('admin/data_absensi.html', semua_absensi=semua_absensi)

# =======================
#     KARYAWAN ROUTES
# =======================

# Dashboard Karyawan
@main_bp.route('/karyawan/dashboard')
@login_required
def dashboard_karyawan():
    if current_user.role != 'karyawan':
        return redirect(url_for('main.dashboard_admin'))

    absensi_saya = Absensi.query.filter_by(user_id=current_user.id).order_by(Absensi.tanggal.desc()).all()
    return render_template('karyawan/dashboard.html', absensi_saya=absensi_saya)
