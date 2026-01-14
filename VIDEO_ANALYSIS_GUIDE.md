# Video Analysis System - Complete Implementation Guide

## Overview

The AI Video Analyzer now features a complete persistent video management system with:
- **Persistent Video Storage**: Videos persist across page refreshes and sessions
- **Analysis Callbacks**: n8n sends analysis results via webhook to update the database in real-time
- **Chat Sessions**: Each video has its own chat history that persists
- **Session Management**: Switch between multiple videos like tabs

## Architecture

### Database Schema

#### `video_analyses` Table
```sql
- id (UUID): Unique video session ID
- user_id (UUID): References auth.users - enforces data isolation
- video_url (TEXT): Supabase storage URL
- file_name (TEXT): Original filename
- file_size (INTEGER): Size in bytes
- duration (INTEGER): Video length in seconds
- status (TEXT): 'uploading' | 'processing' | 'completed' | 'failed'
- analysis_data (JSONB): AI analysis results from n8n
- chat_history (JSONB): Array of chat messages
- error_message (TEXT): Error details if failed
- created_at (TIMESTAMPTZ): Upload timestamp
- updated_at (TIMESTAMPTZ): Last update
- completed_at (TIMESTAMPTZ): When analysis finished
```

### Edge Functions

#### 1. `analyze-video` - Analysis Trigger
**Purpose**: Receives video metadata from frontend, forwards to n8n

**Request Body**:
```json
{
  "videoId": "uuid-of-video",
  "fileName": "video.mp4",
  "fileSize": 1024000
}
```

**Response**:
```json
{
  "success": true,
  "videoId": "uuid-of-video",
  "message": "Video queued for analysis",
  "callbackUrl": "https://your-project.supabase.co/functions/v1/receive-analysis"
}
```

#### 2. `receive-analysis` - Webhook Handler
**Purpose**: Receives analysis completion callbacks from n8n, updates database

**Request Body** (from n8n):
```json
{
  "videoId": "uuid-of-video",
  "status": "completed",
  "analysisData": {
    "viralityEvaluation": {...},
    "hookEvaluation": {...},
    ...
  },
  "errorMessage": null
}
```

**Response**:
```json
{
  "success": true,
  "videoId": "uuid-of-video",
  "status": "completed",
  "message": "Analysis callback received and processed"
}
```

#### 3. `ask-about-video` - Chat Interface
**Purpose**: Sends chat questions to n8n's AI model for video analysis responses

**Request Body**:
```json
{
  "videoId": "uuid-of-video",
  "question": "What are the main issues?",
  "analysisData": {...},
  "chatHistory": [...]
}
```

## n8n Workflow Configuration

### 1. Video Analysis Workflow (POST from Frontend)

**Trigger**: Webhook - POST `/video-analysis`

**Steps**:
1. **Receive Webhook** - Trigger on POST
2. **Extract Fields** - Get videoId, fileName, fileSize from body
3. **Call AI Analysis** - (Your AI service here)
4. **Send Callback** - POST to `callbackUrl` with results:
   ```json
   {
     "videoId": "from-request",
     "status": "completed",
     "analysisData": {analyzed_results},
     "errorMessage": null
   }
   ```

### 2. Chat Response Workflow (POST from Frontend)

**Trigger**: Webhook - POST `/video-chat`

**Steps**:
1. **Receive Webhook** - Trigger on POST
2. **Extract Inputs** - Get videoId, question, analysisData, chatHistory
3. **Format Context** - Create prompt with analysis data and previous messages
4. **Call AI Chat Model** - Send to your LLM (OpenAI, Claude, etc.)
5. **Return Response**:
   ```json
   {
     "response": "AI's answer about the video"
   }
   ```

### 3. Setting Authorization

For the Bearer token authorization:

1. **In Supabase Edge Functions:**
   - Set environment variable: `N8N_WEBHOOK_AUTH`
   - Edge functions will include: `Authorization: Bearer {N8N_WEBHOOK_AUTH}`

2. **In n8n Webhook:**
   - Add Authentication section
   - Set Header: `Authorization`
   - Set Value: `Bearer <your-token>`
   - n8n will validate the header matches before processing

## Frontend Implementation

### Loading Videos on App Start

```typescript
useEffect(() => {
  loadVideoList();
}, []);

const loadVideoList = async () => {
  const { data, error } = await getUserVideoAnalyses();
  if (data) {
    setVideoList(data);
    setCurrentAnalysis(data[0]); // Select first video
  }
};
```

### Uploading a Video

1. User selects file
2. **Create Entry**: `createVideoAnalysis()` - Creates row with status='uploading'
3. **Upload to Storage**: `uploadVideoToStorage()` - Uploads file to Supabase bucket
4. **Update URL**: `updateVideoAnalysisUrl()` - Updates video_url, sets status='processing'
5. **Trigger Analysis**: `triggerVideoAnalysis()` - Calls `/analyze-video` edge function
6. **Poll Status**: `pollAnalysis()` - Polls every 5 seconds for updates
7. **Receive Callback**: n8n POSTs to `/receive-analysis` - Updates database directly

### Video Session Switching

Users click videos in the sidebar to switch sessions:
```typescript
const handleSelectVideo = (video: VideoAnalysis) => {
  setCurrentAnalysis(video);
  setVideoTime(0);
};
```

The UI immediately loads:
- Video preview (already uploaded)
- Analysis results (if completed)
- Chat history (all previous messages)

### Persistent Chat History

Each message is saved to `chat_history` JSONB array:
```typescript
const updatedHistory = [...currentAnalysis.chat_history, newMessage];
await updateChatHistory(videoId, updatedHistory);
```

## Error Handling

### Video Upload Failures
- Status stays `uploading` or changes to `failed`
- User sees error banner with details
- Can delete and retry

### Analysis Failures
- n8n POSTs callback with status='failed', errorMessage set
- Status changes to `failed`
- User sees error in UI with message
- Video still accessible for deletion/retry

### Network Issues
- Frontend polling retries every 5 seconds (max 60 attempts = 5 minutes)
- If callback webhook fails, status never updates
- User can manually refresh page to see latest status

## Security & RLS

### Row Level Security (RLS) Policies
- Users can only SELECT their own videos
- Users can only INSERT their own videos
- Users can only UPDATE their own videos
- Users can only DELETE their own videos
- Service role edge function bypasses RLS to update on webhooks

### Data Isolation
- All queries filtered by `user_id = auth.uid()`
- Webhooks use service role key (server-side only, never exposed)
- Frontend uses anon key (only reads own data)

## Environment Variables

**Required in Supabase Secrets:**
- `N8N_WEBHOOK_URL`: Base URL of your n8n workflow
- `N8N_WEBHOOK_AUTH`: Bearer token for n8n authentication

**Available to Edge Functions:**
```typescript
const n8nWebhookUrl = Deno.env.get("N8N_WEBHOOK_URL");
const n8nAuth = Deno.env.get("N8N_WEBHOOK_AUTH");
```

## API Endpoints

### Frontend Calls

- **Upload & Analyze**
  ```
  POST /functions/v1/analyze-video
  Authorization: Bearer {ANON_KEY}
  ```

- **Chat**
  ```
  POST /functions/v1/ask-about-video
  Authorization: Bearer {ANON_KEY}
  ```

### n8n Callback

- **Analysis Complete**
  ```
  POST /functions/v1/receive-analysis
  Authorization: Bearer {N8N_WEBHOOK_AUTH}
  ```

## Testing Checklist

- [ ] Upload video and verify it appears in video list
- [ ] Refresh page and verify video list persists
- [ ] Check that status updates from 'uploading' → 'processing' → 'completed'
- [ ] Verify analysis results appear after completion
- [ ] Send chat message and verify response
- [ ] Switch between multiple videos
- [ ] Verify chat history persists per video
- [ ] Delete a video and verify it's removed
- [ ] Test error cases (invalid file, n8n failure, etc.)

## Troubleshooting

### Video disappears on refresh
- Check browser network tab for 401 errors
- Verify user is authenticated
- Check Supabase RLS policies

### Analysis never completes
- Check if n8n webhook is running
- Verify `callbackUrl` format in n8n logs
- Check edge function logs for /receive-analysis errors
- Verify `N8N_WEBHOOK_AUTH` token is correct

### Chat responses not appearing
- Check if analysis_data is populated (analysis must be completed first)
- Verify n8n chat workflow webhook URL is correct
- Check for errors in /ask-about-video edge function logs

### Status always "uploading"
- Frontend might have crashed before triggering analysis
- Check browser console for errors
- Manually refresh to see current status from database

## Future Enhancements

1. **Real-time Updates**: Use Supabase subscriptions instead of polling
2. **Batch Uploads**: Upload multiple videos at once
3. **Export Results**: Download analysis as PDF
4. **Team Sharing**: Share video analyses with team members
5. **Analysis History**: Track how analysis changed over time
