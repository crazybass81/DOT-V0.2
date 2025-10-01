#!/usr/bin/env python3
"""
Download a specific file from Google Drive
"""

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import io
import sys

CREDENTIALS_PATH = '/home/ec2-user/gcloud-key.json'
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']

def get_drive_service():
    credentials = service_account.Credentials.from_service_account_file(
        CREDENTIALS_PATH, scopes=SCOPES)
    return build('drive', 'v3', credentials=credentials)

def download_file(service, file_id, output_path):
    """Download a file from Google Drive"""
    try:
        request = service.files().get_media(fileId=file_id)
        file_content = io.BytesIO()

        from googleapiclient.http import MediaIoBaseDownload
        downloader = MediaIoBaseDownload(file_content, request)

        done = False
        while not done:
            status, done = downloader.next_chunk()
            print(f"Download {int(status.progress() * 100)}%")

        with open(output_path, 'wb') as f:
            f.write(file_content.getvalue())

        print(f"✅ Downloaded to: {output_path}")
        return True
    except HttpError as error:
        print(f'❌ Error downloading file: {error}')
        return False

def search_file(service, folder_id, filename):
    """Search for a file in a folder"""
    try:
        query = f"'{folder_id}' in parents and name='{filename}' and trashed=false"
        results = service.files().list(
            q=query,
            spaces='drive',
            fields='files(id, name, mimeType)',
            pageSize=1
        ).execute()

        files = results.get('files', [])
        return files[0] if files else None
    except HttpError as error:
        print(f'❌ Error searching file: {error}')
        return None

def main():
    folder_id = '1fMYS7kpWe6GaO3trL87cMyWLyFDh5DBV'
    filename = '유저 상태 변환 시퀀스 다이어그램.drawio'
    output_path = '/home/ec2-user/DOT-V0.2/docs/유저_상태_변환_시퀀스_다이어그램.drawio'

    service = get_drive_service()

    print(f"🔍 Searching for: {filename}")
    file_info = search_file(service, folder_id, filename)

    if not file_info:
        print(f"❌ File not found: {filename}")
        return 1

    print(f"📄 Found: {file_info['name']} (ID: {file_info['id']})")
    print(f"📥 Downloading...")

    if download_file(service, file_info['id'], output_path):
        return 0
    return 1

if __name__ == '__main__':
    sys.exit(main())