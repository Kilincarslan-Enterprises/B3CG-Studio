import { google } from 'googleapis';

const REQUIRED_ENV_VARS = [
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_PRIVATE_KEY',
  'GOOGLE_DRIVE_ROOT_FOLDER_ID',
];

const FOLDER_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

function validateFolderId(folderId) {
  if (!folderId) {
    return {
      valid: false,
      error: 'Folder ID is empty',
      suggestion: 'Set GOOGLE_DRIVE_ROOT_FOLDER_ID in .env file',
    };
  }

  if (!FOLDER_ID_REGEX.test(folderId)) {
    return {
      valid: false,
      error: `Folder ID contains invalid characters: "${folderId}"`,
      suggestion: 'Folder IDs should only contain alphanumeric characters, hyphens, and underscores. Remove any special characters like "?hl".',
    };
  }

  return { valid: true };
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.iam\.gserviceaccount\.com$/;
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      error: `Invalid Service Account email format: "${email}"`,
      suggestion: 'Email should be in format: service-account-name@project-id.iam.gserviceaccount.com',
    };
  }
  return { valid: true };
}

function validatePrivateKey(privateKey) {
  if (!privateKey) {
    return {
      valid: false,
      error: 'Private key is empty',
      suggestion: 'Set GOOGLE_PRIVATE_KEY in .env file',
    };
  }

  if (!privateKey.includes('BEGIN PRIVATE KEY') || !privateKey.includes('END PRIVATE KEY')) {
    return {
      valid: false,
      error: 'Private key format is invalid',
      suggestion: 'Private key should contain "BEGIN PRIVATE KEY" and "END PRIVATE KEY" markers',
    };
  }

  return { valid: true };
}

async function testDriveConnection(auth) {
  try {
    const drive = google.drive({ version: 'v3', auth });
    const response = await drive.files.list({
      pageSize: 1,
      fields: 'files(id, name)',
    });
    return { success: true, message: 'Google Drive API connection successful' };
  } catch (error) {
    return {
      success: false,
      error: `Failed to connect to Google Drive API: ${error.message}`,
      suggestion: 'Check if the Service Account has the necessary permissions and if the private key is correct',
    };
  }
}

async function testRootFolderAccess(auth, folderId) {
  try {
    const drive = google.drive({ version: 'v3', auth });
    const response = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, mimeType',
    });

    if (response.data.mimeType !== 'application/vnd.google-apps.folder') {
      return {
        success: false,
        error: `ID "${folderId}" is not a folder`,
        suggestion: 'Make sure GOOGLE_DRIVE_ROOT_FOLDER_ID points to a valid Google Drive folder',
      };
    }

    return {
      success: true,
      message: `Root folder accessible: "${response.data.name}"`,
    };
  } catch (error) {
    if (error.status === 404) {
      return {
        success: false,
        error: `Folder not found: ${folderId}`,
        suggestion: 'Check if the folder ID is correct and the Service Account has access to it',
      };
    }
    if (error.status === 403) {
      return {
        success: false,
        error: `Access denied to folder: ${folderId}`,
        suggestion: 'The Service Account does not have permission to access this folder. Grant "Editor" role to the Service Account email in the folder settings.',
      };
    }
    return {
      success: false,
      error: `Failed to access root folder: ${error.message}`,
      suggestion: 'Check the folder ID and Service Account permissions',
    };
  }
}

async function testFolderCreation(auth, folderId) {
  try {
    const drive = google.drive({ version: 'v3', auth });
    const testFolderName = `test-permissions-${Date.now()}`;

    const response = await drive.files.create({
      requestBody: {
        name: testFolderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [folderId],
      },
      fields: 'id',
    });

    await drive.files.delete({ fileId: response.data.id });

    return {
      success: true,
      message: 'Folder creation permission verified',
    };
  } catch (error) {
    if (error.status === 403) {
      return {
        success: false,
        error: 'Permission denied: Cannot create folders',
        suggestion: 'Ensure the Service Account has "Editor" role in Google Drive settings',
      };
    }
    return {
      success: false,
      error: `Failed to verify folder creation permission: ${error.message}`,
      suggestion: 'Check Service Account permissions in Google Drive',
    };
  }
}

export async function validateGoogleDriveConfig() {
  console.log('\n' + '='.repeat(60));
  console.log('Google Drive Configuration Validation');
  console.log('='.repeat(60));

  let hasErrors = false;

  // Check required environment variables
  console.log('\n1. Checking required environment variables...');
  const missingVars = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    console.error(`   ERROR: Missing environment variables: ${missingVars.join(', ')}`);
    hasErrors = true;
  } else {
    console.log('   OK: All required environment variables are set');
  }

  // Validate Folder ID format
  console.log('\n2. Validating Folder ID format...');
  const folderIdValidation = validateFolderId(process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID);
  if (!folderIdValidation.valid) {
    console.error(`   ERROR: ${folderIdValidation.error}`);
    console.error(`   SUGGESTION: ${folderIdValidation.suggestion}`);
    hasErrors = true;
  } else {
    console.log('   OK: Folder ID format is valid');
  }

  // Validate Service Account Email
  console.log('\n3. Validating Service Account email...');
  const emailValidation = validateEmail(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
  if (!emailValidation.valid) {
    console.error(`   ERROR: ${emailValidation.error}`);
    console.error(`   SUGGESTION: ${emailValidation.suggestion}`);
    hasErrors = true;
  } else {
    console.log('   OK: Service Account email format is valid');
  }

  // Validate Private Key
  console.log('\n4. Validating Private Key format...');
  const keyValidation = validatePrivateKey(process.env.GOOGLE_PRIVATE_KEY);
  if (!keyValidation.valid) {
    console.error(`   ERROR: ${keyValidation.error}`);
    console.error(`   SUGGESTION: ${keyValidation.suggestion}`);
    hasErrors = true;
  } else {
    console.log('   OK: Private Key format is valid');
  }

  // Early exit if basic validation failed
  if (hasErrors) {
    console.log('\n' + '='.repeat(60));
    console.log('CONFIGURATION VALIDATION FAILED');
    console.log('Please fix the errors above before starting the server');
    console.log('='.repeat(60) + '\n');
    throw new Error('Invalid Google Drive configuration');
  }

  // Test API Connection
  console.log('\n5. Testing Google Drive API connection...');
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const connectionTest = await testDriveConnection(auth);
    if (connectionTest.success) {
      console.log(`   OK: ${connectionTest.message}`);
    } else {
      console.error(`   ERROR: ${connectionTest.error}`);
      console.error(`   SUGGESTION: ${connectionTest.suggestion}`);
      hasErrors = true;
    }

    // Test Root Folder Access
    console.log('\n6. Testing root folder access...');
    const folderAccessTest = await testRootFolderAccess(
      auth,
      process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
    );
    if (folderAccessTest.success) {
      console.log(`   OK: ${folderAccessTest.message}`);
    } else {
      console.error(`   ERROR: ${folderAccessTest.error}`);
      console.error(`   SUGGESTION: ${folderAccessTest.suggestion}`);
      hasErrors = true;
    }

    // Test Folder Creation Permission
    if (!hasErrors) {
      console.log('\n7. Testing folder creation permission...');
      const creationTest = await testFolderCreation(
        auth,
        process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
      );
      if (creationTest.success) {
        console.log(`   OK: ${creationTest.message}`);
      } else {
        console.error(`   ERROR: ${creationTest.error}`);
        console.error(`   SUGGESTION: ${creationTest.suggestion}`);
        hasErrors = true;
      }
    }
  } catch (error) {
    console.error(`   ERROR: ${error.message}`);
    hasErrors = true;
  }

  console.log('\n' + '='.repeat(60));
  if (hasErrors) {
    console.log('VALIDATION COMPLETED WITH ERRORS');
    console.log('Please address the errors above');
    console.log('='.repeat(60) + '\n');
    throw new Error('Google Drive configuration validation failed');
  } else {
    console.log('VALIDATION COMPLETED SUCCESSFULLY');
    console.log('Google Drive is properly configured');
    console.log('='.repeat(60) + '\n');
  }
}
