import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupProjectDrive(projectId) {
  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error || !project) {
      console.error(`Project not found: ${projectId}`);
      return;
    }

    if (project.drive_folder_id) {
      console.log(`Project "${project.title}" already has Drive setup`);
      console.log(`Folder ID: ${project.drive_folder_id}`);
      return;
    }

    console.log(`Setting up Drive for project: ${project.title}`);

    const response = await fetch(`${backendUrl}/api/drive/create-folder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: project.id,
        projectTitle: project.title,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      console.error('Failed to create Drive folder:', data.error);
      return;
    }

    const { projectFolderId, subfolders } = data.data;

    const { error: updateError } = await supabase
      .from('projects')
      .update({
        drive_folder_id: projectFolderId,
        drive_subfolders: {
          raw: subfolders.raw.id,
          edited: subfolders.edited.id,
          thumbnails: subfolders.thumbnails.id,
        },
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('Failed to update project:', updateError);
      return;
    }

    console.log('✓ Drive setup completed successfully!');
    console.log(`Main folder ID: ${projectFolderId}`);
    console.log(`Raw footage: ${subfolders.raw.id}`);
    console.log(`Edited videos: ${subfolders.edited.id}`);
    console.log(`Thumbnails: ${subfolders.thumbnails.id}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function setupAllProjects() {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, title, drive_folder_id')
      .is('drive_folder_id', null);

    if (error) {
      console.error('Failed to fetch projects:', error);
      return;
    }

    if (!projects || projects.length === 0) {
      console.log('No projects need Drive setup');
      return;
    }

    console.log(`Found ${projects.length} projects without Drive setup\n`);

    for (const project of projects) {
      await setupProjectDrive(project.id);
      console.log('');
    }

    console.log('All projects processed!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage:');
  console.log('  node setup-project-drive.js <project-id>  # Setup specific project');
  console.log('  node setup-project-drive.js --all         # Setup all projects');
  process.exit(0);
}

if (args[0] === '--all') {
  setupAllProjects();
} else {
  setupProjectDrive(args[0]);
}
