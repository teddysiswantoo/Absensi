from app import create_app, db
from app.models import User
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    admin = User(
        nama='Admin',
        nip='0001',
        jabatan='HRD',
        divisi='Admin',
        email='admin@example.com',
        password=generate_password_hash('admin123'),
        role='admin'
    )
    db.session.add(admin)
    db.session.commit()
    print("✅ Admin berhasil ditambahkan.")
