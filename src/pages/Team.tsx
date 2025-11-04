import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TeamMember } from '../types';
import { Users, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export default function Team() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'member' as const,
  });

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase.from('team_members').select('*').order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setTeamMembers(data);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    try {
      const { data, error } = await supabase
        .from('team_members')
        .insert([formData])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setTeamMembers([data, ...teamMembers]);
        setFormData({ name: '', email: '', role: 'member' });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error adding team member:', error);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      try {
        const { error } = await supabase.from('team_members').delete().eq('id', memberId);

        if (error) throw error;
        setTeamMembers(teamMembers.filter((m) => m.id !== memberId));
      } catch (error) {
        console.error('Error deleting team member:', error);
      }
    }
  };

  const roleColors: Record<string, string> = {
    admin: 'bg-red-600 text-white',
    editor: 'bg-blue-600 text-white',
    member: 'bg-slate-600 text-slate-100',
  };

  if (loading) {
    return <div className="p-6 text-slate-400">Loading team...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Users className="w-8 h-8" />
            Team Management
          </h1>
          <p className="text-slate-400">Manage your team members and their roles</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </Button>
      </div>

      {showForm && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <form onSubmit={handleAddMember} className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Team member name"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Role</label>
              <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="admin" className="text-slate-100">
                    Admin
                  </SelectItem>
                  <SelectItem value="editor" className="text-slate-100">
                    Editor
                  </SelectItem>
                  <SelectItem value="member" className="text-slate-100">
                    Member
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                Add Member
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map((member) => (
          <div key={member.id} className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-lg font-bold text-white">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">{member.name}</h3>
                <p className="text-sm text-slate-400">{member.email}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded text-sm font-semibold ${roleColors[member.role]}`}>
                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              </span>
              <button
                onClick={() => handleDeleteMember(member.id)}
                className="text-slate-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {teamMembers.length === 0 && !showForm && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">No team members yet</p>
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
            Add Your First Member
          </Button>
        </div>
      )}
    </div>
  );
}
