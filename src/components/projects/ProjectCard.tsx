import { Project, TeamMember } from '../../types';
import { Calendar, MapPin } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  teamMembers: TeamMember[];
  onClick: () => void;
}

export default function ProjectCard({ project, teamMembers, onClick }: ProjectCardProps) {
  const statusColors: Record<string, string> = {
    Ideas: 'bg-slate-600 text-slate-100',
    Planned: 'bg-blue-600 text-white',
    'In Production': 'bg-orange-600 text-white',
    Finished: 'bg-green-600 text-white',
    Posted: 'bg-purple-600 text-white',
  };

  return (
    <button
      onClick={onClick}
      className="w-full p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-left group"
    >
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors truncate">
            {project.title}
          </h3>
          {project.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{project.description}</p>
          )}
        </div>

        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${statusColors[project.status]}`}>
          {project.status}
        </span>

        <div className="space-y-2">
          {project.shoot_date && (
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Calendar className="w-3 h-3" />
              <span>{new Date(project.shoot_date).toLocaleDateString()}</span>
            </div>
          )}
          {project.location && (
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{project.location}</span>
            </div>
          )}
        </div>

        {teamMembers.length > 0 && (
          <div className="flex -space-x-2 pt-2">
            {teamMembers.slice(0, 3).map((member) => (
              <div
                key={member.id}
                className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white border border-slate-700"
                title={member.name}
              >
                {member.name.charAt(0)}
              </div>
            ))}
            {teamMembers.length > 3 && (
              <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center text-xs font-bold text-slate-300 border border-slate-700">
                +{teamMembers.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
