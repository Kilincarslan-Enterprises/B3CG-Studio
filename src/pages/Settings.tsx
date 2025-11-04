import { Settings as SettingsIcon, LogOut, Bell, Moon, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';

interface SettingsProps {
  session: {
    user: {
      id: string;
      email?: string;
    };
  };
}

export default function Settings({ session }: SettingsProps) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <SettingsIcon className="w-8 h-8" />
          Settings
        </h1>
        <p className="text-slate-400">Manage your account and application preferences</p>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Account Information</CardTitle>
          <CardDescription className="text-slate-400">Your login credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 block mb-2">Email Address</label>
            <div className="p-3 bg-slate-700 rounded-lg text-slate-200">{session.user.email}</div>
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-2">User ID</label>
            <div className="p-3 bg-slate-700 rounded-lg text-slate-300 font-mono text-xs break-all">
              {session.user.id}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Notifications</CardTitle>
          <CardDescription className="text-slate-400">Configure your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-blue-400" />
              <div>
                <p className="font-medium text-white">Shoot Reminders</p>
                <p className="text-sm text-slate-400">Get notified before scheduled shoots</p>
              </div>
            </div>
            <Switch defaultChecked={true} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-blue-400" />
              <div>
                <p className="font-medium text-white">Project Updates</p>
                <p className="text-sm text-slate-400">Updates to your projects</p>
              </div>
            </div>
            <Switch defaultChecked={true} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-blue-400" />
              <div>
                <p className="font-medium text-white">Content Calendar</p>
                <p className="text-sm text-slate-400">Posting schedule notifications</p>
              </div>
            </div>
            <Switch defaultChecked={false} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Appearance</CardTitle>
          <CardDescription className="text-slate-400">Customize how Bosroller Studio looks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-blue-400" />
              <div>
                <p className="font-medium text-white">Dark Mode</p>
                <p className="text-sm text-slate-400">Always enabled</p>
              </div>
            </div>
            <div className="w-10 h-6 bg-blue-600 rounded-full relative">
              <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Security</CardTitle>
          <CardDescription className="text-slate-400">Manage your security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 justify-start gap-2">
            <Lock className="w-4 h-4" />
            Change Password
          </Button>
          <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
            <p className="text-sm text-slate-300">
              <strong>Last login:</strong> Today at 10:30 AM
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-red-950 border-red-800">
        <CardHeader>
          <CardTitle className="text-red-300">Danger Zone</CardTitle>
          <CardDescription className="text-red-400">Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleSignOut}
            className="w-full bg-red-600 hover:bg-red-700 justify-start gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
        <p className="text-xs text-slate-500">
          <strong>Bosroller Studio Version:</strong> 1.0.0 • Built with React, Vite, and Supabase
        </p>
      </div>
    </div>
  );
}
