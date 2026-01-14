# Webhook Configuration Summary

## Your Setup

```
AI Video Analyzer System
├── Frontend (React + Vite)
├── Supabase Edge Functions (analyze-video, receive-analysis, ask-about-video)
├── N8N Webhooks (custom secret-based auth)
└── Supabase Database (video_analyses table)
```

## Current Configuration

### N8N Webhooks

**Analyze Video Webhook:**
- URL: `https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video`
- Auth: `X-N8N-AUTH: your_secret_key`

**Chat Video Webhook:**
- URL: `https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-chat-video`
- Auth: `X-N8N-AUTH: your_secret_key`

### Environment Variables (.env)

```env
VITE_SUPABASE_URL=https://ozzkxnudcwcekudsmdxy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

N8N_WEBHOOK_URL=https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video
N8N_CHAT_WEBHOOK_URL=https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-chat-video
N8N_WEBHOOK_AUTH=your_secret_key_here
```

## Request Flow

```
User Uploads Video
    ↓
[Frontend] Creates video_analyses record
    ↓
[Frontend] Uploads video to Supabase Storage
    ↓
[Frontend] Calls analyze-video edge function
    ↓
[Edge Function] Sends POST to N8N webhook with auth header
    ↓
[N8N Webhook] Receives request, validates header
    ↓
[N8N Workflow] Processes video (AI analysis)
    ↓
[N8N] Calls receive-analysis callback with results
    ↓
[Edge Function] Updates database with analysis results
    ↓
[Frontend] Polls database, displays results when complete
    ↓
User Sees Analysis & Can Chat
```

## Edge Functions Deployed

### 1. analyze-video
- **Location:** `https://supabase.co/functions/v1/analyze-video`
- **JWT Required:** Yes
- **Sends:** POST to N8N with video metadata
- **Headers:** X-N8N-AUTH with secret
- **Purpose:** Triggers video analysis workflow

### 2. receive-analysis
- **Location:** `https://supabase.co/functions/v1/receive-analysis`
- **JWT Required:** No (receives from N8N)
- **Receives:** Analysis results from N8N
- **Purpose:** Updates database with AI analysis
- **Stores:** In `analysis_data` column of video_analyses

### 3. ask-about-video
- **Location:** `https://supabase.co/functions/v1/ask-about-video`
- **JWT Required:** Yes
- **Sends:** POST to N8N chat webhook
- **Headers:** X-N8N-AUTH with secret
- **Purpose:** Handles user questions about analysis

## Database Schema

```sql
CREATE TABLE video_analyses (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  video_url text,
  file_name text NOT NULL,
  file_size integer,
  duration integer,
  uploaded_at timestamptz,
  status 'uploading' | 'processing' | 'completed' | 'failed',
  analysis_data jsonb,           -- Full AI analysis results
  chat_history jsonb DEFAULT [],  -- Chat conversation history
  error_message text,
  created_at timestamptz,
  updated_at timestamptz
);
```

**Row Level Security (RLS):** ✓ Enabled
- Users can only access their own analyses

## Testing Checklist

Before deploying:

- [ ] `.env` file has correct values
- [ ] N8N webhook URLs are exactly as configured
- [ ] N8N webhook secrets match
- [ ] N8N webhooks have `X-N8N-AUTH` header configured
- [ ] N8N workflows are activated
- [ ] Supabase Storage bucket "videos" exists
- [ ] Edge functions are deployed and active
- [ ] Database table created with RLS enabled

## Quick Troubleshooting

### Video Upload Fails
1. Check browser console (F12)
2. Look for error message in toasts
3. Verify .env variables
4. Run: `runFullDiagnostics(...)`

### Analysis Never Starts
1. Check Supabase edge function logs
2. Verify N8N webhook URL
3. Test webhook with curl (see WEBHOOK_TROUBLESHOOTING.md)
4. Check N8N webhook is active

### Webhook Not Received
1. Verify X-N8N-AUTH header format
2. Check secret value matches exactly
3. Ensure N8N webhook path is correct
4. Check firewall/network allows outbound HTTPS

### Chat Not Working
1. Verify ask-about-video edge function is deployed
2. Check N8N_CHAT_WEBHOOK_URL in .env
3. Run network monitoring to see requests
4. Check N8N chat webhook is configured

## Documentation Files

| File | Purpose |
|------|---------|
| WEBHOOK_TROUBLESHOOTING.md | Comprehensive troubleshooting guide |
| WEBHOOK_DEBUG_USAGE.md | Browser console debugging tools guide |
| WEBHOOK_SETUP_SUMMARY.md | This file - quick reference |

## Console Debug Tools

Quick access debugging from browser console:

```javascript
// Import utilities
import {
  printQuickReference,
  runFullDiagnostics,
  enableNetworkMonitoring,
  testWebhookConnectivity,
  analyzeWebhookConfig,
  exportDiagnosticsJson
} from './src/lib/webhookDebug.ts'

// Show quick reference
printQuickReference()

// Run full diagnostics
await runFullDiagnostics(
  'https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video',
  'https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-chat-video',
  'your_secret_key'
)

// Enable network monitoring
enableNetworkMonitoring()

// Test single webhook
await testWebhookConnectivity(
  'https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video',
  'your_secret_key'
)
```

## Key Features Implemented

✅ **Video Upload**
- Drag & drop interface
- File validation (format, size)
- Progress tracking
- Metadata extraction (duration)

✅ **Analysis Integration**
- Edge function → N8N webhook
- Custom header authentication
- Callback webhook for results
- Database polling for status

✅ **Results Display**
- Virality score with color coding
- Hook analysis
- Best practices checklist
- Timestamped improvements
- Copyable suggestions

✅ **Chat Interface**
- Real-time chat with AI
- Context-aware responses
- Chat history persistence
- Suggested questions

✅ **Security**
- Row Level Security on all tables
- JWT verification on user endpoints
- Custom header authentication
- Secret-based N8N auth

✅ **Debugging**
- Comprehensive logging
- Browser console tools
- Diagnostic utilities
- Network monitoring

## Next Steps

1. **Update .env** with your N8N webhook secret
2. **Configure N8N webhooks** with custom headers
3. **Test with small video** to verify flow
4. **Use debug tools** if issues occur
5. **Monitor database** for status updates
6. **Scale workflows** as needed

## Support Resources

- **Browser Console Debugging:** WEBHOOK_DEBUG_USAGE.md
- **Webhook Issues:** WEBHOOK_TROUBLESHOOTING.md
- **Configuration:** This file
- **Frontend Code:** src/pages/AIVideoAnalyzer.tsx
- **Services:** src/lib/videoAnalysisApi.ts
- **Debug Tools:** src/lib/webhookDebug.ts

## Performance Notes

- Video upload: ~1-2 MB/s typical
- Analysis start: 10-30 seconds after upload
- Analysis processing: 2-5 minutes (N8N workflow time)
- Chat response: 5-30 seconds (depends on N8N workflow)

## Security Checklist

- [ ] Never commit .env to git
- [ ] Rotate N8N webhook secrets periodically
- [ ] Keep URLs private
- [ ] Use HTTPS only (no HTTP)
- [ ] Validate callback sources in edge functions
- [ ] Monitor database access logs
- [ ] Test RLS policies regularly

## Common Questions

**Q: Can I change N8N webhook URLs?**
A: Yes, update N8N_WEBHOOK_URL and N8N_CHAT_WEBHOOK_URL in .env, restart dev server

**Q: How do I scale this?**
A: Implement job queue in N8N, use background processing, add caching

**Q: Can users share analyses?**
A: Currently no, would need to add sharing table and RLS policies

**Q: How long are videos stored?**
A: Indefinitely, add cleanup job if needed

**Q: Can I use different AI models?**
A: Yes, configure in N8N workflow, update response schema if needed

---

**Last Updated:** January 14, 2025
**Status:** Fully Implemented & Debuggable
