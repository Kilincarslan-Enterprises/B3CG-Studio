export function formatDriveError(error, context = '') {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    context,
    statusCode: null,
    errorType: null,
    userMessage: null,
    technicalMessage: null,
    suggestion: null,
  };

  if (error.status === 401) {
    errorInfo.statusCode = 401;
    errorInfo.errorType = 'AUTHENTICATION_ERROR';
    errorInfo.userMessage = 'Authentication failed with Google Drive';
    errorInfo.technicalMessage = 'Invalid or expired credentials';
    errorInfo.suggestion =
      'Check GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in .env file';
  } else if (error.status === 403) {
    errorInfo.statusCode = 403;
    errorInfo.errorType = 'PERMISSION_ERROR';
    errorInfo.userMessage = 'Access denied to Google Drive folder or file';
    errorInfo.technicalMessage = error.message;
    errorInfo.suggestion =
      'Grant "Editor" role to the Service Account email in Google Drive folder sharing settings';
  } else if (error.status === 404) {
    errorInfo.statusCode = 404;
    errorInfo.errorType = 'NOT_FOUND_ERROR';
    errorInfo.userMessage = 'Folder or file not found in Google Drive';
    errorInfo.technicalMessage = error.message;
    errorInfo.suggestion =
      'Check if the folder ID is correct and verify the folder still exists';
  } else if (error.status === 429) {
    errorInfo.statusCode = 429;
    errorInfo.errorType = 'RATE_LIMIT_ERROR';
    errorInfo.userMessage = 'Too many requests to Google Drive API';
    errorInfo.technicalMessage = 'API rate limit exceeded';
    errorInfo.suggestion = 'Please wait a few moments and try again';
  } else if (error.status >= 500) {
    errorInfo.statusCode = error.status;
    errorInfo.errorType = 'GOOGLE_DRIVE_SERVER_ERROR';
    errorInfo.userMessage = 'Google Drive service is temporarily unavailable';
    errorInfo.technicalMessage = error.message;
    errorInfo.suggestion = 'Try again in a few moments';
  } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    errorInfo.errorType = 'NETWORK_ERROR';
    errorInfo.userMessage = 'Failed to connect to Google Drive';
    errorInfo.technicalMessage = `Network error: ${error.code}`;
    errorInfo.suggestion =
      'Check your internet connection and verify Google Drive API is accessible';
  } else {
    errorInfo.errorType = 'UNKNOWN_ERROR';
    errorInfo.userMessage = 'An error occurred while accessing Google Drive';
    errorInfo.technicalMessage = error.message;
    errorInfo.suggestion = 'Check the server logs for more details';
  }

  return errorInfo;
}

export function logDriveError(error, context = '', additionalInfo = {}) {
  const errorInfo = formatDriveError(error, context);

  console.error('\n' + '='.repeat(60));
  console.error('Google Drive Error');
  console.error('='.repeat(60));
  console.error(`Timestamp: ${errorInfo.timestamp}`);
  console.error(`Context: ${errorInfo.context}`);
  console.error(`Error Type: ${errorInfo.errorType}`);
  console.error(`Status Code: ${errorInfo.statusCode || 'N/A'}`);
  console.error(`User Message: ${errorInfo.userMessage}`);
  console.error(`Technical Message: ${errorInfo.technicalMessage}`);
  console.error(`Suggestion: ${errorInfo.suggestion}`);

  if (Object.keys(additionalInfo).length > 0) {
    console.error('Additional Info:', JSON.stringify(additionalInfo, null, 2));
  }

  console.error('='.repeat(60) + '\n');

  return errorInfo;
}
