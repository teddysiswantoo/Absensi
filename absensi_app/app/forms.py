from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, SelectField
from wtforms.validators import DataRequired, Email, EqualTo, Length


class LoginForm(FlaskForm):
    email = StringField('Email', validators=[
        DataRequired(message="Email wajib diisi"),
        Email(message="Format email tidak valid")
    ])
    password = PasswordField('Password', validators=[
        DataRequired(message="Password wajib diisi")
    ])
    submit = SubmitField('Login')


class TambahKaryawanForm(FlaskForm):
    nama_lengkap = StringField('Nama Lengkap', validators=[
        DataRequired(message="Nama lengkap wajib diisi")
    ])
    nip = StringField('NIP', validators=[
        DataRequired(message="NIP wajib diisi")
    ])
    jabatan = StringField('Jabatan', validators=[
        DataRequired(message="Jabatan wajib diisi")
    ])
    divisi = StringField('Divisi', validators=[
        DataRequired(message="Divisi wajib diisi")
    ])
    email = StringField('Email', validators=[
        DataRequired(message="Email wajib diisi"),
        Email(message="Format email tidak valid")
    ])
    password = PasswordField('Password', validators=[
        DataRequired(message="Password wajib diisi"),
        Length(min=6, message="Password minimal 6 karakter")
    ])
    konfirmasi_password = PasswordField('Konfirmasi Password', validators=[
        DataRequired(message="Konfirmasi password wajib diisi"),
        EqualTo('password', message="Password tidak cocok")
    ])
    role = SelectField('Role', choices=[
        ('karyawan', 'Karyawan'),
        ('admin', 'Admin')
    ], validators=[DataRequired(message="Role wajib dipilih")])
    
    submit = SubmitField('Simpan')
