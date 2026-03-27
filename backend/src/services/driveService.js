import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5005/api/drive/callback';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const BACKUP_FOLDER_NAME = 'TodoAppBackup';
const BACKUP_FILE_NAME = 'tasks_backup.json';

function createOAuth2Client() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

export function isConfigured() {
  return !!(CLIENT_ID && CLIENT_SECRET);
}

export function getAuthUrl() {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

export async function getTokenFromCode(code) {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

function getAuthedClient(accessToken, refreshToken) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return oauth2Client;
}

async function findOrCreateFolder(drive) {
  // Search for existing folder
  const res = await drive.files.list({
    q: `name='${BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (res.data.files.length > 0) {
    return res.data.files[0].id;
  }

  // Create folder
  const folder = await drive.files.create({
    requestBody: {
      name: BACKUP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  });

  return folder.data.id;
}

async function findBackupFile(drive, folderId) {
  const res = await drive.files.list({
    q: `name='${BACKUP_FILE_NAME}' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id, name, modifiedTime)',
    spaces: 'drive',
  });
  return res.data.files.length > 0 ? res.data.files[0] : null;
}

export async function uploadBackup(accessToken, refreshToken, backupData) {
  const auth = getAuthedClient(accessToken, refreshToken);
  const drive = google.drive({ version: 'v3', auth });

  const folderId = await findOrCreateFolder(drive);
  const existing = await findBackupFile(drive, folderId);

  const media = {
    mimeType: 'application/json',
    body: JSON.stringify(backupData, null, 2),
  };

  if (existing) {
    // Update existing file
    await drive.files.update({
      fileId: existing.id,
      media,
    });
    return { fileId: existing.id, action: 'updated' };
  } else {
    // Create new file
    const file = await drive.files.create({
      requestBody: {
        name: BACKUP_FILE_NAME,
        parents: [folderId],
      },
      media,
      fields: 'id',
    });
    return { fileId: file.data.id, action: 'created' };
  }
}

export async function downloadBackup(accessToken, refreshToken) {
  const auth = getAuthedClient(accessToken, refreshToken);
  const drive = google.drive({ version: 'v3', auth });

  const folderId = await findOrCreateFolder(drive);
  const file = await findBackupFile(drive, folderId);

  if (!file) {
    return null; // No backup found
  }

  const res = await drive.files.get(
    { fileId: file.id, alt: 'media' },
    { responseType: 'text' }
  );

  return typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
}

export async function refreshTokenIfNeeded(user) {
  // googleapis library handles refresh automatically when refresh_token is set
  // This function is a placeholder for manual refresh if needed
  return {
    accessToken: user.googleAccessToken,
    refreshToken: user.googleRefreshToken,
  };
}
