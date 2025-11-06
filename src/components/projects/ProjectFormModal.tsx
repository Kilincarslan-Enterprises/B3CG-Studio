import { useState, useEffect } from 'react';
import { Project, TeamMember, ProjectStatus } from '../../types';
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
import { X, Plus, Trash2, Save, MapPin, Calendar, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../ui/sonner';

interface ScriptLine {
  memberId: string;
  memberName: string;
  line: string;
}

interface ProjectFormModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  teamMembers: TeamMember[];
  initialStatus?: ProjectStatus;
}

interface MaterialItem {
  id?: string;
  name: string;
  checked: boolean;
}

export default function ProjectFormModal({
  project,
  isOpen,
  onClose,
  onSave,
  teamMembers,
  initialStatus,
}: ProjectFormModalProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: (initialStatus || 'Ideas') as ProjectStatus,
    notes: '',
    location: '',
    shoot_date: '',
    shoot_time: '',
    posted_by_member_id: '',
  });
  const [script, setScript] = useState<ScriptLine[]>([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [newMaterialName, setNewMaterialName] = useState('');

  const materialPresets = ['Kamera', 'Mikrofon', 'Kostüm', 'Requisiten', 'Beleuchtung'];

  useEffect(() => {
    if (isOpen && project) {
      loadProjectData();
    } else if (isOpen && !project) {
      resetForm();
    }
  }, [isOpen, project]);

  const loadProjectData = async () => {
    if (!project) return;

    setFormData({
      title: project.title,
      description: project.description || '',
      status: project.status,
      notes: project.notes || '',
      location: project.location || '',
      shoot_date: project.shoot_date || '',
      shoot_time: project.shoot_time || '',
      posted_by_member_id: project.posted_by_member_id || '',
    });

    if (project.script) {
      setScript(Array.isArray(project.script) ? project.script : []);
    }

    try {
      const [teamRes, materialsRes] = await Promise.all([
        supabase
          .from('project_team_members')
          .select('team_member_id')
          .eq('project_id', project.id),
        supabase.from('materials').select('*').eq('project_id', project.id),
      ]);

      if (teamRes.data) {
        setSelectedTeamMembers(teamRes.data.map((t) => t.team_member_id));
      }

      if (materialsRes.data) {
        setMaterials(
          materialsRes.data.map((m) => ({
            id: m.id,
            name: m.name,
            checked: m.checked || false,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading project data:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: (initialStatus || 'Ideas') as ProjectStatus,
      notes: '',
      location: '',
      shoot_date: '',
      shoot_time: '',
      posted_by_member_id: '',
    });
    setScript([]);
    setSelectedTeamMembers([]);
    setMaterials([]);
    setNewMaterialName('');
    setActiveTab('basic');
  };

  const handleAddScriptLine = () => {
    setScript([...script, { memberId: '', memberName: '', line: '' }]);
  };

  const handleUpdateScriptLine = (index: number, field: keyof ScriptLine, value: string) => {
    const updated = [...script];
    updated[index][field] = value;

    if (field === 'memberId' && value) {
      const member = teamMembers.find((m) => m.id === value);
      if (member) {
        updated[index].memberName = member.name;
      }
    }

    setScript(updated);
  };

  const handleDeleteScriptLine = (index: number) => {
    setScript(script.filter((_, i) => i !== index));
  };

  const handleToggleTeamMember = (memberId: string) => {
    if (selectedTeamMembers.includes(memberId)) {
      setSelectedTeamMembers(selectedTeamMembers.filter((id) => id !== memberId));
    } else {
      setSelectedTeamMembers([...selectedTeamMembers, memberId]);
    }
  };

  const handleAddMaterial = () => {
    if (!newMaterialName.trim()) return;
    setMaterials([...materials, { name: newMaterialName, checked: false }]);
    setNewMaterialName('');
  };

  const handleAddPresetMaterial = (preset: string) => {
    if (!materials.some((m) => m.name === preset)) {
      setMaterials([...materials, { name: preset, checked: false }]);
    }
  };

  const handleToggleMaterial = (index: number) => {
    const updated = [...materials];
    updated[index].checked = !updated[index].checked;
    setMaterials(updated);
  };

  const handleDeleteMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      setActiveTab('basic');
      return false;
    }
    if (selectedTeamMembers.length === 0) {
      toast.error('At least one team member must be assigned');
      setActiveTab('team');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const projectData = {
        ...formData,
        user_id: user.id,
        script: script.filter(s => s.line.trim()),
        updated_at: new Date().toISOString(),
      };

      let projectId: string;

      if (project) {
        const { error: updateError } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', project.id);

        if (updateError) throw updateError;
        projectId = project.id;

        await supabase
          .from('project_team_members')
          .delete()
          .eq('project_id', projectId);

        await supabase
          .from('materials')
          .delete()
          .eq('project_id', projectId);
      } else {
        const { data: newProject, error: insertError } = await supabase
          .from('projects')
          .insert([projectData])
          .select()
          .single();

        if (insertError) throw insertError;
        if (!newProject) throw new Error('Failed to create project');
        projectId = newProject.id;
      }

      if (selectedTeamMembers.length > 0) {
        const teamInserts = selectedTeamMembers.map((memberId) => ({
          project_id: projectId,
          team_member_id: memberId,
        }));
        const { error: teamError } = await supabase
          .from('project_team_members')
          .insert(teamInserts);

        if (teamError) throw teamError;
      }

      if (materials.length > 0) {
        const materialInserts = materials.map((material) => ({
          project_id: projectId,
          name: material.name,
          checked: material.checked,
        }));
        const { error: materialError } = await supabase
          .from('materials')
          .insert(materialInserts);

        if (materialError) throw materialError;
      }

      toast.success(project ? 'Project updated successfully' : 'Project created successfully');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Toaster />
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="bg-slate-800 border-b border-slate-700 p-4 sm:p-6 flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {project ? 'Edit Project' : 'Create New Project'}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="bg-slate-900 p-1 m-4 sm:m-6 mb-0 grid grid-cols-4 gap-1">
              <TabsTrigger value="basic" className="text-xs sm:text-sm min-h-[44px]">
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="script" className="text-xs sm:text-sm min-h-[44px]">
                Script
              </TabsTrigger>
              <TabsTrigger value="team" className="text-xs sm:text-sm min-h-[44px]">
                Team
              </TabsTrigger>
              <TabsTrigger value="materials" className="text-xs sm:text-sm min-h-[44px]">
                Materials
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <TabsContent value="basic" className="mt-0 space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Project title"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your project..."
                    className="bg-slate-700 border-slate-600 text-white h-24"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Status</label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as ProjectStatus })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="Ideas" className="text-slate-100">Ideas</SelectItem>
                      <SelectItem value="Planned" className="text-slate-100">Planned</SelectItem>
                      <SelectItem value="In Production" className="text-slate-100">In Production</SelectItem>
                      <SelectItem value="Finished" className="text-slate-100">Finished</SelectItem>
                      <SelectItem value="Posted" className="text-slate-100">Posted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Notes</label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                    className="bg-slate-700 border-slate-600 text-white h-24"
                  />
                </div>
              </TabsContent>

              <TabsContent value="script" className="mt-0 space-y-4">
                <div className="space-y-3">
                  {script.map((line, index) => (
                    <div key={index} className="bg-slate-700 rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <Select
                          value={line.memberId}
                          onValueChange={(value) => handleUpdateScriptLine(index, 'memberId', value)}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-600 text-white min-h-[44px]">
                            <SelectValue placeholder="Select member" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            {teamMembers.map((member) => (
                              <SelectItem key={member.id} value={member.id} className="text-slate-100">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                    {member.name.charAt(0)}
                                  </div>
                                  {member.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteScriptLine(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950 min-h-[44px] min-w-[44px] flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <Textarea
                        value={line.line}
                        onChange={(e) => handleUpdateScriptLine(index, 'line', e.target.value)}
                        placeholder="What do they say..."
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                      {line.memberName && line.line && (
                        <div className="text-sm text-slate-300 bg-slate-800 p-2 rounded">
                          <strong>{line.memberName}:</strong> {line.line}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleAddScriptLine}
                  className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Plus className="w-4 h-4" />
                  Add Script Line
                </Button>
              </TabsContent>

              <TabsContent value="team" className="mt-0 space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-3 block">
                    Assigned Team Members <span className="text-red-400">*</span>
                  </label>
                  <div className="space-y-2">
                    {teamMembers.map((member) => (
                      <label
                        key={member.id}
                        className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors min-h-[56px]"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTeamMembers.includes(member.id)}
                          onChange={() => handleToggleTeamMember(member.id)}
                          className="w-5 h-5 flex-shrink-0"
                        />
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white">{member.name}</p>
                          <p className="text-sm text-slate-400 truncate">{member.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-2 block flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Shooting Location
                  </label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Enter location..."
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Shooting Date
                    </label>
                    <Input
                      type="date"
                      value={formData.shoot_date}
                      onChange={(e) => setFormData({ ...formData, shoot_date: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Shooting Time
                    </label>
                    <Input
                      type="time"
                      value={formData.shoot_time}
                      onChange={(e) => setFormData({ ...formData, shoot_time: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-2 block flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Posted By
                  </label>
                  <Select
                    value={formData.posted_by_member_id}
                    onValueChange={(value) => setFormData({ ...formData, posted_by_member_id: value })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id} className="text-slate-100">
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="materials" className="mt-0 space-y-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {materialPresets.map((preset) => (
                    <Button
                      key={preset}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddPresetMaterial(preset)}
                      className="bg-slate-700 hover:bg-slate-600 border-slate-600 text-white min-h-[44px]"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {preset}
                    </Button>
                  ))}
                </div>

                <div className="space-y-2">
                  {materials.map((material, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                      <input
                        type="checkbox"
                        checked={material.checked}
                        onChange={() => handleToggleMaterial(index)}
                        className="w-5 h-5 flex-shrink-0"
                      />
                      <span className={`flex-1 text-sm ${material.checked ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {material.name}
                      </span>
                      <button
                        onClick={() => handleDeleteMaterial(index)}
                        className="text-slate-400 hover:text-red-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={newMaterialName}
                    onChange={(e) => setNewMaterialName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddMaterial();
                      }
                    }}
                    placeholder="Add custom material..."
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <Button
                    onClick={handleAddMaterial}
                    size="icon"
                    className="bg-blue-600 hover:bg-blue-700 min-h-[44px] min-w-[44px] flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <div className="bg-slate-800 border-t border-slate-700 p-4 sm:p-6 flex flex-col sm:flex-row gap-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
