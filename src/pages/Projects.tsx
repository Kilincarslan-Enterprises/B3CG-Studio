import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Project, ProjectStatus, TeamMember } from '../types';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectDetailModal from '../components/projects/ProjectDetailModal';
import ProjectFormModal from '../components/projects/ProjectFormModal';
import { Plus } from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProjectStatus, setNewProjectStatus] = useState<ProjectStatus>('Ideas');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, teamRes] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('team_members').select('*').order('created_at', { ascending: false }),
      ]);

      if (projectsRes.data) setProjects(projectsRes.data);
      if (teamRes.data) setTeamMembers(teamRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSaved = () => {
    fetchData();
  };

  const handleUpdateProject = async (project: Project) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update(project)
        .eq('id', project.id);

      if (error) throw error;
      setProjects(projects.map((p) => (p.id === project.id ? project : p)));
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);

      if (error) throw error;
      setProjects(projects.filter((p) => p.id !== projectId));
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const statuses: ProjectStatus[] = ['Ideas', 'Planned', 'In Production', 'Finished', 'Posted'];
  const columns = statuses.map((status) => ({
    status,
    projects: projects.filter((p) => p.status === status),
  }));

  if (loading) {
    return <div className="p-3 sm:p-6 text-slate-400">Loading projects...</div>;
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Projects</h1>
        <p className="text-sm sm:text-base text-slate-400">Manage your creative projects in one place</p>
      </div>

      <div className="overflow-x-auto pb-4 -mx-3 sm:mx-0 px-3 sm:px-0">
        <div className="flex gap-3 sm:gap-6 min-w-full md:min-w-0">
          {columns.map((column) => (
            <div key={column.status} className="flex-shrink-0 w-72 sm:w-80 bg-slate-800 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">{column.status}</h2>
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                  {column.projects.length}
                </span>
              </div>

              <div className="space-y-3 min-h-[300px] sm:min-h-[500px]">
                {column.projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    teamMembers={teamMembers.filter(
                      (tm) =>
                        tm.id === project.id ||
                        Math.random() > 0.7
                    )}
                    onClick={() => {
                      setSelectedProject(project);
                      setShowDetailModal(true);
                    }}
                    onEdit={() => {
                      setEditingProject(project);
                      setShowFormModal(true);
                    }}
                  />
                ))}

                <button
                  onClick={() => {
                    setNewProjectStatus(column.status);
                    setEditingProject(null);
                    setShowFormModal(true);
                  }}
                  className="w-full p-3 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:border-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Add Project</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedProject(null);
          }}
          onUpdate={handleUpdateProject}
          onDelete={handleDeleteProject}
          teamMembers={teamMembers}
        />
      )}

      <ProjectFormModal
        project={editingProject}
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingProject(null);
        }}
        onSave={handleProjectSaved}
        teamMembers={teamMembers}
        initialStatus={newProjectStatus}
      />
    </div>
  );
}
