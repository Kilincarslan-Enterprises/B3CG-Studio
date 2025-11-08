const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  createdTime: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
}

export interface FolderStructure {
  projectFolderId: string;
  projectFolderName: string;
  subfolders: {
    raw: { id: string; name: string };
    edited: { id: string; name: string };
    thumbnails: { id: string; name: string };
  };
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class DriveApiError extends Error {
  constructor(
    message: string,
    public details?: string,
    public status?: number
  ) {
    super(message);
    this.name = 'DriveApiError';
  }
}

async function handleResponse(response: Response) {
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new DriveApiError(
      data.error || 'Request failed',
      data.details,
      response.status
    );
  }

  return data.data;
}

export async function createProjectFolder(
  projectId: string,
  projectTitle: string
): Promise<FolderStructure> {
  const response = await fetch(`${API_BASE_URL}/api/drive/create-folder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      projectId,
      projectTitle,
    }),
  });

  return handleResponse(response);
}

export async function uploadFile(
  file: File,
  projectId: string,
  category: 'raw' | 'edited' | 'thumbnails',
  folderId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<DriveFile> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    formData.append('category', category);
    formData.append('folderId', folderId);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({
          loaded: e.loaded,
          total: e.total,
          percentage: Math.round((e.loaded / e.total) * 100),
        });
      }
    });

    xhr.addEventListener('load', async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.success) {
            resolve(data.data);
          } else {
            reject(
              new DriveApiError(
                data.error || 'Upload failed',
                data.details,
                xhr.status
              )
            );
          }
        } catch (error) {
          reject(new DriveApiError('Failed to parse response', undefined, xhr.status));
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          reject(
            new DriveApiError(
              data.error || 'Upload failed',
              data.details,
              xhr.status
            )
          );
        } catch {
          reject(new DriveApiError('Upload failed', undefined, xhr.status));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new DriveApiError('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new DriveApiError('Upload cancelled'));
    });

    xhr.open('POST', `${API_BASE_URL}/api/drive/upload`);
    xhr.send(formData);
  });
}

export async function getProjectFiles(
  projectId: string,
  category: 'raw' | 'edited' | 'thumbnails',
  folderId: string
): Promise<DriveFile[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/drive/files/${projectId}?folderId=${folderId}&category=${category}`
  );

  return handleResponse(response);
}

export async function deleteFile(
  fileId: string,
  projectId?: string,
  category?: string
): Promise<void> {
  const params = new URLSearchParams();
  if (projectId) params.append('projectId', projectId);
  if (category) params.append('category', category);

  const response = await fetch(
    `${API_BASE_URL}/api/drive/file/${fileId}?${params.toString()}`,
    {
      method: 'DELETE',
    }
  );

  await handleResponse(response);
}

export async function getFileMetadata(fileId: string): Promise<DriveFile> {
  const response = await fetch(
    `${API_BASE_URL}/api/drive/file/${fileId}/metadata`
  );

  return handleResponse(response);
}

export function formatFileSize(bytes: string | number): string {
  const size = typeof bytes === 'string' ? parseInt(bytes) : bytes;
  if (size === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(size) / Math.log(k));

  return Math.round((size / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function isVideoFile(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}
