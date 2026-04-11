#!/usr/bin/env python
"""
ManaBills Backend Setup Script
Run this script to set up the Django backend for the first time.
"""

import os
import sys
import subprocess

def run_command(command, description):
    """Run a shell command and handle errors"""
    print(f"\n{description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✓ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Error during {description}:")
        print(e.stderr)
        return False

def main():
    """Main setup function"""
    print("🚀 ManaBills Backend Setup")
    print("=" * 50)

    # Check if we're in the right directory
    if not os.path.exists('manage.py'):
        print("❌ Error: manage.py not found. Please run this script from the Django project root.")
        sys.exit(1)

    # Check if virtual environment is active
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("⚠️  Warning: No virtual environment detected. It's recommended to use a virtual environment.")

    # Install dependencies
    if not run_command('pip install -r requirements.txt', 'Installing dependencies'):
        sys.exit(1)

    # Run migrations
    if not run_command('python manage.py makemigrations', 'Creating database migrations'):
        sys.exit(1)

    if not run_command('python manage.py migrate', 'Applying database migrations'):
        sys.exit(1)

    # Create superuser
    print("\n👤 Creating superuser...")
    print("Please enter the details for the admin user:")
    try:
        subprocess.run([sys.executable, 'manage.py', 'createsuperuser'], check=True)
        print("✓ Superuser created successfully")
    except subprocess.CalledProcessError:
        print("✗ Failed to create superuser. You can create one later with: python manage.py createsuperuser")

    print("\n🎉 Setup completed successfully!")
    print("\nNext steps:")
    print("1. Start the development server: python manage.py runserver")
    print("2. Access the admin panel at: http://localhost:8000/admin/")
    print("3. API endpoints are available at: http://localhost:8000/api/")
    print("\n📚 Check README_BACKEND.md for detailed API documentation")

if __name__ == '__main__':
    main()