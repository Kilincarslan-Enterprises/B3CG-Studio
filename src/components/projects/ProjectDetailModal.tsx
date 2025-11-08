import { useState, useEffect } from 'react';
import { Project, TeamMember, Material, Comment, ProjectStatus } from '../../types';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { X, Plus, Trash2, Save, MessageSquare, FileText, HardDrive } from 'lucide-react';
import FilesMediaSection from './FilesMediaSection';

interface ProjectDetailModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (project: Project) => void;
  onDelete: (projectId: string) => void;
  teamMembers: TeamMember[];
}

export default function ProjectDetailModal({
  project,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: ProjectDetailModalProps) {
  const [formData, setFormData] = useState<Project>(project);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newMaterial, setNewMaterial] = useState('');
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProjectDetails();
    }
  }, [isOpen, project.id]);

  const fetchProjectDetails = async () => {
    try {
      const [materialsRes, commentsRes] = await Promise.all([
        supabase.from('materials').select('*').eq('project_id', project.id),
        supabase.from('comments').select('*').eq('project_id', project.id).order('created_at', { ascending: false }),
        supabase
          .from('project_team_members')
          .select('team_member_id')
          .eq('project_id', project.id),
      ]);

      if (materialsRes.data) setMaterials(materialsRes.data);
      if (commentsRes.data) setComments(commentsRes.data);
    } catch (error) {
      console.error('Error fetching project details:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      onUpdate(formData);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      onDelete(project.id);
    }
  };

  const handleAddMaterial = async () => {
    if (!newMaterial.trim()) return;

    try {
      const { data, error } = await supabase
        .from('materials')
        .insert([
          {
            project_id: project.id,
            name: newMaterial,
            checked: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setMaterials([...materials, data]);
        setNewMaterial('');
      }
    } catch (error) {
      console.error('Error adding material:', error);
    }
  };

  const handleToggleMaterial = async (material: Material) => {
    try {
      const { error } = await supabase
        .from('materials')
        .update({ checked: !material.checked })
        .eq('id', material.id);

      if (error) throw error;
      setMaterials(materials.map((m) => (m.id === material.id ? { ...m, checked: !m.checked } : m)));
    } catch (error) {
      console.error('Error updating material:', error);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      const { error } = await supabase.from('materials').delete().eq('id', materialId);

      if (error) throw error;
      setMaterials(materials.filter((m) => m.id !== materialId));
    } catch (error) {
      console.error('Error deleting material:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            project_id: project.id,
            text: newComment,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setComments([data, ...comments]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 sm:p-6 flex items-center justify-between z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Project Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="w-6 h-6" />
          </button>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="w-full bg-slate-900 rounded-none border-b border-slate-700 grid grid-cols-2 sticky top-[73px] z-10">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Files & Media
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="p-4 sm:p-6 space-y-4 sm:space-y-6 mt-0">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Description</label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Status</label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as ProjectStatus })
                }
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {['Ideas', 'Planned', 'In Production', 'Finished', 'Posted'].map((status) => (
                    <SelectItem key={status} value={status} className="text-slate-100">
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">Shoot Date</label>
              <Input
                type="date"
                value={formData.shoot_date || ''}
                onChange={(e) => setFormData({ ...formData, shoot_date: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Location</label>
            <Input
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="Shooting location"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Notes</label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              Materials Checklist
            </h3>
            <div className="space-y-2 mb-3">
              {materials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg"
                >
                  <input
                    type="checkbox"
                    checked={material.checked}
                    onChange={() => handleToggleMaterial(material)}
                    className="w-4 h-4"
                  />
                  <span className={`text-sm flex-1 ${material.checked ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {material.name}
                  </span>
                  <button
                    onClick={() => handleDeleteMaterial(material.id)}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newMaterial}
                onChange={(e) => setNewMaterial(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddMaterial();
                  }
                }}
                placeholder="Add material..."
                className="bg-slate-700 border-slate-600 text-white"
              />
              <Button onClick={handleAddMaterial} size="icon" className="bg-blue-600 hover:bg-blue-700 min-h-[44px] min-w-[44px]">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Comments
            </h3>
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="p-3 bg-slate-700 rounded-lg">
                  <p className="text-sm text-slate-200">{comment.text}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="bg-slate-700 border-slate-600 text-white h-20"
              />
              <Button
                onClick={handleAddComment}
                size="icon"
                className="bg-blue-600 hover:bg-blue-700 self-end min-h-[44px] min-w-[44px]"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-slate-700">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="flex-1 bg-red-600 hover:bg-red-700 min-h-[44px]"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="files" className="p-4 sm:p-6 mt-0">
            <FilesMediaSection
              project={project as Project & {
                drive_folder_id?: string;
                drive_subfolders?: {
                  raw: string;
                  edited: string;
                  thumbnails: string;
                };
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
