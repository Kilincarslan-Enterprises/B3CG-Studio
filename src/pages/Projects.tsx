import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Project, ProjectStatus, TeamMember } from '../types';
import { Button } from '../components/ui/button';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectDetailModal from '../components/projects/ProjectDetailModal';
import { Plus } from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectStatus, setNewProjectStatus] = useState<ProjectStatus>('Ideas');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, teamRes] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('team_members').select('*'),
      ]);

      if (projectsRes.data) setProjects(projectsRes.data);
      if (teamRes.data) setTeamMembers(teamRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (title: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            title,
            status: newProjectStatus,
            description: '',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setProjects([data, ...projects]);
        setShowNewProjectModal(false);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
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
    return <div className="p-6 text-slate-400">Loading projects...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
        <p className="text-slate-400">Manage your creative projects in one place</p>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-full">
          {columns.map((column) => (
            <div key={column.status} className="flex-shrink-0 w-80 bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">{column.status}</h2>
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                  {column.projects.length}
                </span>
              </div>

              <div className="space-y-3 min-h-[500px]">
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
                  />
                ))}

                <button
                  onClick={() => {
                    setNewProjectStatus(column.status);
                    setShowNewProjectModal(true);
                  }}
                  className="w-full p-3 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:border-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-2"
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

      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Create New Project</h2>
            <input
              type="text"
              placeholder="Project title..."
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = (e.target as HTMLInputElement).value.trim();
                  if (value) {
                    handleCreateProject(value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNewProjectModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const input = document.querySelector(
                    'input[placeholder="Project title..."]'
                  ) as HTMLInputElement;
                  const value = input?.value.trim();
                  if (value) {
                    handleCreateProject(value);
                  }
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
