import os
import zipfile
import datetime

def create_extension_zip():
    """
    Creates a ZIP file of the extension for submission to the Chrome Web Store.
    Excludes unnecessary files like .git, node_modules, etc.
    """
    # Get current date for filename
    current_date = datetime.datetime.now().strftime("%Y%m%d")
    zip_filename = f"spamgourmet_extension_{current_date}.zip"
    
    # Files and directories to exclude
    exclude_dirs = [
        '.git',
        '__pycache__',
        'node_modules',
    ]
    
    exclude_files = [
        '.gitignore',
        'package_extension.py',
        'resize_icon.py',
        'create_icons.py',
        'store_assets.md',
        'privacy_policy.md',
        zip_filename,  # Don't include the zip file itself if it exists
    ]
    
    # Files and extensions to exclude
    exclude_extensions = [
        '.pyc',
        '.pyo',
        '.psd',
        '.ai',
        '.log',
    ]
    
    # Create a new zip file
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Walk through the directory
        for root, dirs, files in os.walk('.'):
            # Remove excluded directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
            
            # Add files
            for file in files:
                # Check if file should be excluded
                if file in exclude_files:
                    continue
                    
                # Check file extension
                if any(file.endswith(ext) for ext in exclude_extensions):
                    continue
                
                file_path = os.path.join(root, file)
                # Remove the leading './' from the path
                archive_path = file_path[2:] if file_path.startswith('./') else file_path
                print(f"Adding {archive_path}")
                zipf.write(file_path, archive_path)
    
    print(f"Extension packaged successfully: {zip_filename}")
    print(f"Size: {os.path.getsize(zip_filename) / 1024:.2f} KB")

if __name__ == "__main__":
    create_extension_zip() 