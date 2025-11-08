import { useState, useEffect, useRef } from 'react';
import { Project } from '../../types';
import {
  uploadFile,
  getProjectFiles,
  deleteFile,
  formatFileSize,
  DriveFile,
  DriveApiError,
  UploadProgress,
} from '../../lib/driveApi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Upload, Trash2, ExternalLink, Film, Image as ImageIcon, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface FilesMediaSectionProps {
  project: Project & {
    drive_folder_id?: string;
    drive_subfolders?: {
      raw: string;
      edited: string;
      thumbnails: string;
    };
  };
}

interface UploadTask {
  id: string;
  file: File;
  category: 'raw' | 'edited' | 'thumbnails';
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

const MAX_SIMULTANEOUS_UPLOADS = 3;

export default function FilesMediaSection({ project }: FilesMediaSectionProps) {
  const [activeTab, setActiveTab] = useState<'raw' | 'edited' | 'thumbnails'>('raw');
  const [files, setFiles] = useState<Record<string, DriveFile[]>>({
    raw: [],
    edited: [],
    thumbnails: [],
  });
  const [loading, setLoading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadTask[]>([]);
  const [activeUploads, setActiveUploads] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const hasDriveSetup = project.drive_folder_id && project.drive_subfolders;

  useEffect(() => {
    if (hasDriveSetup) {
      loadFiles(activeTab);
    }
  }, [activeTab, hasDriveSetup]);

  useEffect(() => {
    processUploadQueue();
  }, [uploadQueue, activeUploads]);

  const loadFiles = async (category: 'raw' | 'edited' | 'thumbnails') => {
    if (!project.drive_subfolders) return;

    setLoading(true);
    try {
      const folderId = project.drive_subfolders[category];
      const fetchedFiles = await getProjectFiles(project.id, category, folderId);
      setFiles((prev) => ({ ...prev, [category]: fetchedFiles }));
    } catch (error) {
      console.error('Error loading files:', error);
      let errorMessage = 'Failed to load files';

      if (error instanceof DriveApiError) {
        if (error.status === 403) {
          errorMessage = 'Access denied to files. Check permissions.';
        } else if (error.status === 404) {
          errorMessage = 'Folder not found. Reinitialize Google Drive integration.';
        }
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFilesToQueue(selectedFiles, activeTab);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFilesToQueue(droppedFiles, activeTab);
  };

  const addFilesToQueue = (selectedFiles: File[], category: 'raw' | 'edited' | 'thumbnails') => {
    const newTasks: UploadTask[] = selectedFiles.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      category,
      progress: 0,
      status: 'pending',
    }));

    setUploadQueue((prev) => [...prev, ...newTasks]);
  };

  const processUploadQueue = async () => {
    const pendingTasks = uploadQueue.filter((task) => task.status === 'pending');
    const availableSlots = MAX_SIMULTANEOUS_UPLOADS - activeUploads.size;

    if (availableSlots <= 0 || pendingTasks.length === 0) return;

    const tasksToStart = pendingTasks.slice(0, availableSlots);

    for (const task of tasksToStart) {
      startUpload(task);
    }
  };

  const startUpload = async (task: UploadTask) => {
    if (!project.drive_subfolders) return;

    setActiveUploads((prev) => new Set(prev).add(task.id));
    setUploadQueue((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: 'uploading' as const } : t))
    );

    try {
      const folderId = project.drive_subfolders[task.category];

      await uploadFile(
        task.file,
        project.id,
        task.category,
        folderId,
        (progress: UploadProgress) => {
          setUploadQueue((prev) =>
            prev.map((t) =>
              t.id === task.id ? { ...t, progress: progress.percentage } : t
            )
          );
        }
      );

      setUploadQueue((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: 'completed' as const, progress: 100 } : t))
      );

      toast.success(`${task.file.name} uploaded successfully`);

      await loadFiles(task.category);

      setTimeout(() => {
        setUploadQueue((prev) => prev.filter((t) => t.id !== task.id));
      }, 2000);
    } catch (error) {
      let userFriendlyMessage = 'Upload failed. Please try again.';

      if (error instanceof DriveApiError) {
        if (error.status === 401 || error.status === 403) {
          userFriendlyMessage =
            'Access denied. Check Google Drive configuration.';
        } else if (error.status === 404) {
          userFriendlyMessage =
            'Folder not found. Please set up Google Drive integration.';
        } else if (error.status === 429) {
          userFriendlyMessage =
            'Too many uploads. Please wait a moment and try again.';
        } else if (error.details) {
          userFriendlyMessage = error.details;
        }
      }

      setUploadQueue((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: 'error' as const, error: userFriendlyMessage }
            : t
        )
      );

      toast.error(`Failed to upload ${task.file.name}: ${userFriendlyMessage}`);
    } finally {
      setActiveUploads((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  };

  const handleRetryUpload = (taskId: string) => {
    setUploadQueue((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: 'pending' as const, error: undefined, progress: 0 } : t
      )
    );
  };

  const handleCancelUpload = (taskId: string) => {
    setUploadQueue((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleDeleteFile = async (fileId: string, category: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await deleteFile(fileId, project.id, category);
      toast.success('File deleted successfully');
      await loadFiles(category as 'raw' | 'edited' | 'thumbnails');
    } catch (error) {
      console.error('Error deleting file:', error);
      let errorMessage = 'Failed to delete file';

      if (error instanceof DriveApiError) {
        if (error.status === 403) {
          errorMessage = 'Permission denied. Cannot delete file.';
        } else if (error.status === 404) {
          errorMessage = 'File not found or already deleted.';
        }
      }

      toast.error(errorMessage);
    }
  };

  const getAcceptedFileTypes = (category: 'raw' | 'edited' | 'thumbnails') => {
    if (category === 'thumbnails') {
      return 'image/jpeg,image/png,image/gif,image/webp';
    }
    return 'video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm';
  };

  if (!hasDriveSetup) {
    return (
      <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-white mb-2">Google Drive Not Setup</h3>
            <p className="text-sm text-slate-300 mb-3">
              This project doesn't have a Google Drive folder configured yet. Please set up Google Drive integration first.
            </p>
            <p className="text-xs text-slate-400">
              Contact your administrator or check the backend setup documentation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentFiles = files[activeTab] || [];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
        <TabsList className="bg-slate-700 w-full grid grid-cols-3">
          <TabsTrigger value="raw" className="flex items-center gap-2">
            <Film className="w-4 h-4" />
            Raw Footage
          </TabsTrigger>
          <TabsTrigger value="edited" className="flex items-center gap-2">
            <Film className="w-4 h-4" />
            Edited Videos
          </TabsTrigger>
          <TabsTrigger value="thumbnails" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Thumbnails
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-950'
                : 'border-slate-600 bg-slate-700'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-300 mb-2">
                {isDragging ? 'Drop files here' : 'Drag and drop files here, or'}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept={getAcceptedFileTypes(activeTab)}
                multiple
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Browse Files
              </Button>
              <p className="text-xs text-slate-400 mt-2">
                {activeTab === 'thumbnails'
                  ? 'Supported: JPEG, PNG, GIF, WebP'
                  : 'Supported: MP4, MOV, AVI, MKV, WebM'}{' '}
                (Max 5GB per file)
              </p>
            </div>
          </div>

          {uploadQueue.length > 0 && (
            <div className="bg-slate-700 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Queue ({uploadQueue.length})
              </h4>
              {uploadQueue.map((task) => (
                <div key={task.id} className="bg-slate-800 rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{task.file.name}</p>
                      <p className="text-xs text-slate-400">
                        {formatFileSize(task.file.size)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      {task.status === 'error' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetryUpload(task.id)}
                          className="text-xs"
                        >
                          Retry
                        </Button>
                      )}
                      {task.status !== 'completed' && (
                        <button
                          onClick={() => handleCancelUpload(task.id)}
                          className="text-slate-400 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {task.status === 'error' ? (
                    <p className="text-xs text-red-400">{task.error}</p>
                  ) : (
                    <div className="space-y-1">
                      <Progress value={task.progress} className="h-2" />
                      <p className="text-xs text-slate-400">
                        {task.status === 'completed'
                          ? 'Complete'
                          : task.status === 'uploading'
                            ? `${task.progress}%`
                            : 'Waiting...'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading files...</div>
          ) : currentFiles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">No files uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentFiles.map((file) => (
                <div
                  key={file.id}
                  className="bg-slate-700 rounded-lg overflow-hidden border border-slate-600 hover:border-slate-500 transition-colors"
                >
                  {file.thumbnailLink ? (
                    <div className="aspect-video bg-slate-800 flex items-center justify-center">
                      <img
                        src={file.thumbnailLink}
                        alt={file.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-slate-800 flex items-center justify-center">
                      {file.mimeType.startsWith('video/') ? (
                        <Film className="w-12 h-12 text-slate-600" />
                      ) : (
                        <ImageIcon className="w-12 h-12 text-slate-600" />
                      )}
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-medium text-white truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatFileSize(file.size)} • {new Date(file.createdTime).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2 mt-3">
                      {file.webViewLink && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={() => window.open(file.webViewLink, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-400 hover:text-red-300 hover:bg-red-950"
                        onClick={() => handleDeleteFile(file.id, activeTab)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
