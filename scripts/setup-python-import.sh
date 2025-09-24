#!/bin/bash

# Fuji POS System - Python Import Setup Script
# This script sets up the Python environment for PDF menu import

echo "🐍 Setting up Python environment for FUJI menu import..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip."
    exit 1
fi

echo "✅ pip3 found"

# Install required packages
echo "📦 Installing required Python packages..."
pip3 install -r scripts/requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ All packages installed successfully!"
else
    echo "❌ Failed to install packages. Please check the error messages above."
    exit 1
fi

# Make the import script executable
chmod +x scripts/import-menu-from-pdf.py

echo ""
echo "🎉 Setup complete! You can now run the menu import:"
echo "   python3 scripts/import-menu-from-pdf.py"
echo ""
echo "📋 Make sure your .env.local file contains:"
echo "   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url"
echo "   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
