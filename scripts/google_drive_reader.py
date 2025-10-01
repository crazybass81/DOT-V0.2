#!/usr/bin/env python3
"""
Google Drive Reader Script
Reads files and folders from Google Drive using service account
"""

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import json
import sys

# Service account credentials path
CREDENTIALS_PATH = '/home/ec2-user/gcloud-key.json'
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']

def get_drive_service():
    """Create and return Google Drive API service"""
    credentials = service_account.Credentials.from_service_account_file(
        CREDENTIALS_PATH, scopes=SCOPES)
    return build('drive', 'v3', credentials=credentials)

def search_folder(service, folder_name):
    """Search for a folder by name"""
    try:
        query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
        results = service.files().list(
            q=query,
            spaces='drive',
            fields='files(id, name, owners, permissions)',
            pageSize=10
        ).execute()

        files = results.get('files', [])
        return files
    except HttpError as error:
        print(f'Error searching folder: {error}')
        return []

def list_folder_contents(service, folder_id):
    """List all files and folders in a specific folder"""
    try:
        query = f"'{folder_id}' in parents and trashed=false"
        results = service.files().list(
            q=query,
            spaces='drive',
            fields='files(id, name, mimeType, modifiedTime, size)',
            pageSize=100,
            orderBy='name'
        ).execute()

        files = results.get('files', [])
        return files
    except HttpError as error:
        print(f'Error listing folder contents: {error}')
        return []

def main():
    folder_name = '개발'

    print(f"🔍 Searching for folder: '{folder_name}'")
    print(f"📧 Service Account: claudecode@tranquil-wave-470305-q9.iam.gserviceaccount.com")
    print("-" * 70)

    service = get_drive_service()

    # Search for the folder
    folders = search_folder(service, folder_name)

    if not folders:
        print(f"\n❌ Folder '{folder_name}' not found or not shared with service account.")
        print("\n📋 To fix this:")
        print("1. Go to Google Drive")
        print(f"2. Right-click on '{folder_name}' folder")
        print("3. Click 'Share'")
        print("4. Add email: claudecode@tranquil-wave-470305-q9.iam.gserviceaccount.com")
        print("5. Set permission to 'Viewer' or 'Editor'")
        return 1

    print(f"\n✅ Found {len(folders)} folder(s) named '{folder_name}':\n")

    for idx, folder in enumerate(folders, 1):
        print(f"📁 Folder #{idx}")
        print(f"   Name: {folder['name']}")
        print(f"   ID: {folder['id']}")

        # List contents
        print(f"\n   📂 Contents:")
        contents = list_folder_contents(service, folder['id'])

        if not contents:
            print("      (Empty or no access)")
        else:
            for item in contents:
                icon = "📁" if item['mimeType'] == 'application/vnd.google-apps.folder' else "📄"
                size = item.get('size', 'N/A')
                if size != 'N/A':
                    size = f"{int(size):,} bytes"
                print(f"      {icon} {item['name']} ({size})")

        print("-" * 70)

    return 0

if __name__ == '__main__':
    sys.exit(main())