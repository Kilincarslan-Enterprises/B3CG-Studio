import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TeamMember } from '../types';
import { Users, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';

export default function Team() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member' as const,
  });

  useEffect(() => {
    const initializeTeam = async () => {
      await getCurrentUser();
      await fetchTeamMembers();
    };
    initializeTeam();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: teamMember } = await supabase
          .from('team_members')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        setCurrentUser({ id: user.id, role: teamMember?.role });
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setTeamMembers(data);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!isAdmin) {
      toast.error('Only admins can add team members');
      return;
    }

    setCreatingAccount(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
      });

      if (authError) throw authError;
      if (!authData?.user) throw new Error('Failed to create user');

      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .insert([{
          user_id: authData.user.id,
          name: formData.name,
          email: formData.email,
          role: formData.role,
        }])
        .select()
        .single();

      if (memberError) throw memberError;
      if (memberData) {
        setTeamMembers([memberData, ...teamMembers]);
        setFormData({ name: '', email: '', password: '', role: 'member' });
        setShowForm(false);
        toast.success(`${formData.name} added to team with email ${formData.email}`);
      }
    } catch (error) {
      console.error('Error adding team member:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add team member');
    } finally {
      setCreatingAccount(false);
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
    return <div className="p-3 sm:p-6 text-slate-400">Loading team...</div>;
  }

  return (
    <>
      <Toaster />
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <Users className="w-6 h-6 sm:w-8 sm:h-8" />
              Team Management
            </h1>
            <p className="text-sm sm:text-base text-slate-400">
              {isAdmin ? 'Manage your team members and their roles' : 'View team members'}
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 min-h-[44px] w-full sm:w-auto"
              disabled={creatingAccount}
            >
              <Plus className="w-4 h-4" />
              Add Member
            </Button>
          )}
        </div>

      {showForm && isAdmin && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <div className="mb-4 p-3 bg-blue-950 border border-blue-900 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-200">
              <p className="font-semibold mb-1">Create New Account</p>
              <p>A new Supabase account will be created with the provided credentials. The user can then sign in with this email and password.</p>
            </div>
          </div>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Team member name"
                className="bg-slate-700 border-slate-600 text-white"
                disabled={creatingAccount}
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
                disabled={creatingAccount}
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Password</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Set initial password"
                className="bg-slate-700 border-slate-600 text-white"
                disabled={creatingAccount}
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Role</label>
              <Select
                value={formData.role}
                onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                disabled={creatingAccount}
              >
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
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={creatingAccount}
              >
                {creatingAccount ? 'Creating...' : 'Create Account'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1"
                disabled={creatingAccount}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
              {isAdmin && (
                <button
                  onClick={() => handleDeleteMember(member.id)}
                  className="text-slate-400 hover:text-red-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {teamMembers.length === 0 && !showForm && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">No team members yet</p>
          {isAdmin && (
            <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
              Add Your First Member
            </Button>
          )}
        </div>
      )}
    </div>
    </>
  );
}
