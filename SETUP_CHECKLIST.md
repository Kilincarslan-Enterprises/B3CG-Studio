# Setup Checklist - Video Analysis System

## Phase 1: Verify Deployment ✓

### Backend Verification
- [x] Database migration applied: `20250114_video_analysis_persistence`
  - Table created: `video_analyses`
  - RLS policies active
  - Indexes created

- [x] Edge functions deployed:
  - [x] `/analyze-video`
  - [x] `/receive-analysis`
  - [x] `/ask-about-video`

- [x] Frontend updated:
  - [x] AIVideoAnalyzer.tsx - Video list sidebar
  - [x] videoAnalysisApi.ts - New functions
  - [x] Build successful: ✓ 2565 modules

## Phase 2: Configuration (REQUIRED)

### Step 1: Set Supabase Secrets
```bash
Location: Supabase Dashboard → Settings → Secrets
```

Required secrets:
- [ ] `N8N_WEBHOOK_URL`
  - Value: `https://your-n8n-instance.com/webhook/video-analysis`
  - Get from: n8n Workflow Settings → Webhook URL

- [ ] `N8N_WEBHOOK_AUTH`
  - Value: `your-secure-bearer-token`
  - Create: Any secure random string (also use in n8n webhook header)

### Step 2: Create n8n Workflows

#### Workflow 1: Video Analysis
- [ ] Create new workflow: "Video Analysis Pipeline"
- [ ] Add Webhook node
  - Path: `video-analysis`
  - Authentication: Header
    - Header: `Authorization`
    - Value: `Bearer {YOUR_TOKEN}`
- [ ] Add AI service call (OpenAI, Claude, etc.)
- [ ] Add callback to `/receive-analysis`
- [ ] Add error handler
- [ ] Deploy workflow
- [ ] Copy webhook URL → Set as `N8N_WEBHOOK_URL`

#### Workflow 2: Video Chat
- [ ] Create new workflow: "Video Chat Interface"
- [ ] Add Webhook node
  - Path: `video-chat`
  - Same authentication as Workflow 1
- [ ] Add chat AI model call
- [ ] Add response node
- [ ] Deploy workflow

Reference: `N8N_WORKFLOW_JSON.md` or `N8N_WORKFLOW_TEMPLATE.md`

## Phase 3: Testing

### Test 1: Authentication
- [ ] User can log in
- [ ] User gets session token
- [ ] `console.log(Supabase session)` shows auth user

### Test 2: Database Access
```typescript
// In browser console
import { supabase } from './src/lib/supabase';
const { data } = await supabase.from('video_analyses').select('*');
console.log(data); // Should show empty array or videos
```
- [ ] Returns array (empty or with videos)
- [ ] No "permission denied" error

### Test 3: Video Upload
- [ ] Navigate to AI Video Analyzer page
- [ ] Click upload zone
- [ ] Select small video file (~1-5 MB)
- [ ] Progress bar appears
- [ ] Video appears in sidebar list
- [ ] Status shows "uploading"

### Test 4: n8n Analysis Trigger
- [ ] Status changes from "uploading" to "processing"
- [ ] Check n8n workflow logs for incoming request
- [ ] Verify webhook was received with correct data
- [ ] Response status is 200

### Test 5: Analysis Callback
- [ ] Status changes to "completed" (or "failed")
- [ ] Analysis results appear in UI
- [ ] Check edge function logs for `/receive-analysis`
- [ ] Verify callback was received with analysis data

### Test 6: Chat Interface
- [ ] Click on analysis results section
- [ ] Type a question in chat
- [ ] Send message
- [ ] Message appears in chat history
- [ ] AI response appears after ~2-5 seconds
- [ ] Full conversation visible in sidebar

### Test 7: Persistence
- [ ] Refresh page (Cmd+R / Ctrl+R)
- [ ] Video list still shows all videos
- [ ] Analysis results still visible
- [ ] Chat history intact
- [ ] Status preserved

### Test 8: Multi-Video Sessions
- [ ] Upload second video
- [ ] Both appear in sidebar
- [ ] Click first video → see its analysis
- [ ] Click second video → see its analysis
- [ ] Each has independent chat history

### Test 9: Error Handling
- [ ] Try to upload non-video file → error shown
- [ ] Simulate n8n failure → "failed" status shown
- [ ] Delete video → removed from list
- [ ] Refresh shows deletion persisted

### Test 10: Load Testing
- [ ] Upload 5+ videos
- [ ] List loads quickly
- [ ] No lag when switching videos
- [ ] All persist on refresh

## Phase 4: Verification Checklists

### Frontend Checks
```
[ ] Video upload works
[ ] Upload progress bar visible
[ ] Video appears in sidebar immediately
[ ] Can click to switch videos
[ ] Sidebar shows file name, date, status
[ ] Current video highlighted
[ ] Can scroll through video list
[ ] Delete button appears on hover
[ ] Refresh maintains video list
```

### Backend Checks
```
[ ] /analyze-video receives requests
[ ] /analyze-video forwards to n8n
[ ] /receive-analysis receives callbacks
[ ] /receive-analysis updates database
[ ] Database shows status changes
[ ] analysis_data populated on completion
[ ] Error messages stored on failure
[ ] RLS prevents cross-user access
```

### n8n Checks
```
[ ] Video Analysis workflow active
[ ] Webhook receives POST requests
[ ] Authorization header validates
[ ] Webhook path: /video-analysis
[ ] Video Chat workflow active
[ ] Webhook path: /video-chat
[ ] Both workflows trigger correctly
[ ] Callbacks include correct data
[ ] Error handling works
```

### Data Integrity
```
[ ] User A videos not visible to User B
[ ] Chat history correct per video
[ ] Analysis data matches video
[ ] Timestamps accurate
[ ] File sizes match original
[ ] No duplicate records
[ ] Deleted videos gone from DB
```

## Phase 5: Performance Testing

### Response Times
- [ ] Video list loads in < 500ms
- [ ] Upload completes in < 1 minute (for 5MB file)
- [ ] Video switch < 100ms
- [ ] Chat response < 5 seconds
- [ ] Polling (every 5s) doesn't cause lag

### Database
- [ ] Query 1-5 videos: < 100ms
- [ ] Query 50+ videos: < 500ms
- [ ] Update operations: < 200ms
- [ ] Indexes working: `EXPLAIN ANALYZE` shows index use

### Throughput
- [ ] Multiple uploads in parallel work
- [ ] 10 concurrent chat messages processed
- [ ] 5+ webhooks per second handled

## Phase 6: Production Readiness

### Monitoring
- [ ] Error logs accessible
- [ ] Edge function logs visible
- [ ] n8n workflow logs tracked
- [ ] Database logs available

### Backup
- [ ] Database backups enabled
- [ ] Backup schedule set
- [ ] Test restore procedure

### Documentation
- [ ] Team knows how system works
- [ ] Troubleshooting guide available
- [ ] Deployment procedure documented
- [ ] Support contacts listed

## Common Issues & Quick Fixes

### Issue: 401 Unauthorized
```bash
❌ Error: Unauthorized user
✓ Check: User is logged in
✓ Fix: User must authenticate first
```

### Issue: Webhooks not triggering
```bash
❌ Webhook not received
✓ Check: n8n workflow active
✓ Check: Webhook path matches exactly
✓ Check: Bearer token set in n8n
✓ Fix: Recreate webhook in n8n
```

### Issue: Analysis never completes
```bash
❌ Status stuck on "processing"
✓ Check: n8n workflow logs for errors
✓ Check: Callback URL correct
✓ Check: N8N_WEBHOOK_AUTH set
✓ Fix: Check n8n workflow runs successfully
```

### Issue: Chat not working
```bash
❌ Chat sends but no response
✓ Check: Analysis completed (analysis_data exists)
✓ Check: n8n chat workflow active
✓ Check: Bearer token in n8n chat webhook
✓ Fix: Trigger chat workflow manually to test
```

### Issue: Videos disappear on refresh
```bash
❌ Refresh loses video list
✓ Check: User authenticated
✓ Check: Browser console for errors
✓ Check: Database connection
✓ Fix: Verify RLS policies allow SELECT
```

## Quick Validation Script

Run this in browser console to validate setup:

```javascript
// Check authentication
const { data: { user } } = await supabase.auth.getUser();
console.log('Auth user:', user?.email || 'NOT AUTHENTICATED');

// Check database access
const { data: videos, error: dbError } = await supabase
  .from('video_analyses')
  .select('*')
  .limit(1);
console.log('DB access:', dbError ? 'FAILED' + dbError.message : 'OK');

// Check edge function
const response = await fetch(
  import.meta.env.VITE_SUPABASE_URL + '/functions/v1/analyze-video',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + import.meta.env.VITE_SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      videoId: 'test',
      fileName: 'test.mp4',
      fileSize: 1000
    })
  }
);
console.log('Edge function:', response.status === 400 ? 'OK (validation error expected)' : response.status);
```

Expected output:
```
Auth user: user@example.com
DB access: OK
Edge function: OK (validation error expected)
```

## Timeline

- **Phase 1**: Already Complete ✓
- **Phase 2**: ~30 minutes (n8n setup)
- **Phase 3-4**: ~45 minutes (thorough testing)
- **Phase 5-6**: ~30 minutes (performance & production)

**Total**: ~2-3 hours to full production

## Sign-Off

When complete, verify:

- [ ] All tests passing
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Team trained
- [ ] Documentation updated
- [ ] Monitoring active
- [ ] Backups configured

**System Ready for Production**: ___________
