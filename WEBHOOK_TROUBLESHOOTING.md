# Webhook Configuration & Troubleshooting Guide

## Current Setup

Your webhook configuration uses secret-based authentication with custom header format:

```
N8N_WEBHOOK_URL=https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video
N8N_CHAT_WEBHOOK_URL=https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-chat-video
N8N_WEBHOOK_AUTH=your_secret_key
```

**Authentication Format**: `X-N8N-AUTH: your_secret_key` (no Bearer prefix)

---

## Step 1: Verify Webhook URL Accessibility

### Browser Test
```bash
# Replace YOUR_SECRET with your actual secret
curl -X POST https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video \
  -H "Content-Type: application/json" \
  -H "X-N8N-AUTH: YOUR_SECRET" \
  -d '{"test": "payload"}'
```

### Expected Response
- Status: 200-299 or 404 (webhook received, might not process test data)
- Status: 401/403 (authentication failed - check secret)
- Status: 503/500 (N8N service issue)

### Common Issues:
| Status | Cause | Solution |
|--------|-------|----------|
| 404 | Webhook URL incorrect | Verify URL matches N8N webhook configuration |
| 401 | Wrong/missing authentication | Check secret value and header name |
| 403 | Secret expired/revoked | Regenerate webhook in N8N dashboard |
| 502/503 | N8N not responding | Check N8N service status |
| TIMEOUT | Network/firewall blocking | Check if your ISP/firewall allows outbound connections |

---

## Step 2: Browser Console Debugging

### Enable Debug Logs

Open DevTools (F12) → Console tab and perform these steps:

1. **Locate the logs**: After uploading a video, you'll see timestamped logs:
```
[triggerVideoAnalysis] Starting analysis trigger {
  videoId: "abc-123...",
  fileName: "my-video.mp4",
  fileSize: 123456789,
  endpoint: "https://ozzkxnudcwcekudsmdxy.supabase.co/functions/v1/analyze-video"
}

[triggerVideoAnalysis] Response status: 200
[triggerVideoAnalysis] Success: { success: true, videoId: "abc-123...", ... }
```

2. **Interpret response status**:
   - **200**: Edge function received request ✓
   - **400**: Missing required fields (videoId, fileName)
   - **500**: Edge function error (check server logs)
   - **502/503**: Supabase infrastructure issue

3. **If you see errors**, note them for the next section

---

## Step 3: Check Edge Function Logs

### Access Supabase Logs
1. Go to Supabase Dashboard → Project → Functions → `analyze-video`
2. Click on "Logs" tab
3. Upload a test video and check logs

### Look for These Indicators

**Success Flow**:
```
[analyze-video] Sending to N8N: https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video
[analyze-video] Payload: {"videoId":"...","fileName":"..."}
[analyze-video] N8N Response Status: 200
[analyze-video] N8N Success Response: OK
```

**Authentication Failure**:
```
[analyze-video] N8N Response Status: 401
[analyze-video] N8N Error: {"error":"Unauthorized"}
```
→ **Fix**: Verify N8N_WEBHOOK_AUTH secret value

**URL Incorrect**:
```
[analyze-video] N8N Response Status: 404
[analyze-video] N8N Error: {"error":"Not Found"}
```
→ **Fix**: Check N8N webhook URL matches exactly

**Network Timeout**:
```
[analyze-video] Error: Request timeout
```
→ **Fix**: Check network connectivity or N8N server status

---

## Step 4: N8N Webhook Configuration

### Verify N8N Webhook Setup

1. Open N8N → Workflows
2. Find webhook node with name containing "b3cg-analyze-video"
3. Check these settings:

```
✓ Webhook is Active (toggle enabled)
✓ HTTP Method: POST
✓ Path: /b3cg-analyze-video (should NOT include domain)
✓ Authentication: Custom Headers
✓ Custom Header Name: X-N8N-AUTH
✓ Custom Header Value: [your-secret-key]
✓ Response Format: JSON
```

### Test N8N Webhook Directly

In N8N, use a Manual Trigger to test:

1. Create test workflow with HTTP Request node
2. Send POST to: `https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video`
3. Add header: `X-N8N-AUTH: YOUR_SECRET`
4. Send test payload:
```json
{
  "videoId": "test-123",
  "fileName": "test.mp4",
  "fileSize": 1000000,
  "callbackUrl": "https://your-app.com/callback"
}
```

---

## Step 5: Payload Validation

### Ensure Correct Payload Structure

**analyze-video Function Payload**:
```json
{
  "videoId": "uuid-string",
  "fileName": "video.mp4",
  "fileSize": 123456789,
  "callbackUrl": "https://ozzkxnudcwcekudsmdxy.supabase.co/functions/v1/receive-analysis",
  "timestamp": "2025-01-14T10:30:00.000Z"
}
```

**ask-about-video Function Payload**:
```json
{
  "question": "Where should I improve the hook?",
  "videoId": "uuid-string",
  "analysisData": { /* full analysis object */ },
  "chatHistory": [
    {
      "role": "user",
      "message": "First question?",
      "timestamp": "2025-01-14T10:30:00.000Z"
    }
  ],
  "timestamp": "2025-01-14T10:30:00.000Z"
}
```

### Check Payload in N8N

1. Add "Log" node in N8N workflow after webhook trigger
2. Upload video → Check N8N logs to verify payload structure matches

---

## Step 6: Request Headers Verification

### Headers Sent from Edge Function

The edge function sends:
```
Content-Type: application/json
X-N8N-AUTH: [N8N_WEBHOOK_AUTH value]
```

### Verify in N8N

1. In N8N webhook node → Expression editor
2. Access headers via: `$json.headers`
3. Verify `X-N8N-AUTH` is present

---

## Step 7: Network & Firewall Check

### Test Connection from Browser

```javascript
// Paste this in browser console to test connectivity
fetch('https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-N8N-AUTH': 'YOUR_SECRET'
  },
  body: JSON.stringify({
    videoId: 'test-' + Date.now(),
    fileName: 'test.mp4',
    fileSize: 1000000
  })
})
.then(r => console.log('Status:', r.status, r.statusText))
.catch(e => console.error('Error:', e.message))
```

### Expected Results
- **Success**: Status: 200 or 404 (webhook called)
- **Error**: Network error → Firewall/DNS issue
- **CORS Error**: N8N webhook doesn't allow browser requests (normal for API webhooks)

---

## Common Issues & Solutions

### Issue 1: "Failed to send to N8N" with Status 401

**Cause**: Authentication header incorrect or secret expired

**Solutions**:
1. Verify `N8N_WEBHOOK_AUTH` environment variable is set
2. Check secret matches exactly (case-sensitive)
3. Regenerate webhook in N8N dashboard
4. Confirm header name is `X-N8N-AUTH` (not `Authorization`)

### Issue 2: "Failed to send to N8N" with Status 404

**Cause**: Webhook URL path incorrect

**Solutions**:
1. Copy full webhook URL from N8N webhook node
2. Verify path doesn't have trailing slash
3. Check for typos in webhook path
4. Test URL with curl command (see Step 1)

### Issue 3: "Request timeout" or No Response

**Cause**: N8N service unreachable or network blocked

**Solutions**:
1. Check N8N server status page
2. Test connectivity: `ping zuefer-kilincarslan-n8n.zk-ai.agency`
3. Check firewall rules allow outbound HTTPS
4. Try from different network to isolate ISP block
5. Enable VPN if corporate network blocks webhooks

### Issue 4: Webhook Receives Request but Doesn't Process

**Cause**: N8N workflow logic issue

**Solutions**:
1. Check N8N workflow has proper error handling
2. Verify workflow is marked as "active"
3. Check each node in workflow is configured correctly
4. Add console logs at each workflow step
5. Test workflow with manual trigger first

### Issue 5: Video Analysis Status Never Updates

**Cause**: Callback endpoint not working

**Solutions**:
1. Verify N8N can reach your Supabase webhook callback
2. Check `receive-analysis` function is deployed and active
3. Add logging to `receive-analysis` function
4. Test callback URL directly from N8N webhook response

---

## Step 8: Full Integration Test

### Manual End-to-End Test

1. **Start with console open** (F12)
2. **Upload a small test video** (< 10MB)
3. **Check browser console** for logs:
   - `[triggerVideoAnalysis] Starting...` - Edge function called ✓
   - `[triggerVideoAnalysis] Response status: 200` - Webhook sent ✓
4. **Check Supabase function logs**:
   - `[analyze-video] Sending to N8N...` - N8N webhook attempt ✓
   - `[analyze-video] N8N Response Status: 200` - N8N received ✓
5. **Check N8N logs**: Workflow processed ✓
6. **Monitor database**: Check `video_analyses` table for status update

### Debugging Checklist

```
□ Browser console shows no errors
□ Edge function logs show "N8N Response Status: 200"
□ N8N webhook node receives request
□ N8N workflow completes without errors
□ video_analyses table status changes from "processing" to "completed"
□ Analysis data appears in analysis_data column
□ Chat interface loads with analysis results
```

---

## Environment Variable Setup

### Update .env File

```env
# Supabase
VITE_SUPABASE_URL=https://ozzkxnudcwcekudsmdxy.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# N8N Webhooks
N8N_WEBHOOK_URL=https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video
N8N_CHAT_WEBHOOK_URL=https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-chat-video
N8N_WEBHOOK_AUTH=your_secret_key_here
```

### Important Notes
- Replace `your_secret_key_here` with actual secret from N8N
- No quotes needed around values
- Restart dev server after updating .env
- Don't commit actual secrets to version control

---

## Testing with Real N8N Workflows

### Recommended N8N Workflow Structure

**analyze-video workflow**:
```
Webhook Trigger (X-N8N-AUTH header check)
    ↓
Validate payload (videoId, fileName present)
    ↓
Store video metadata
    ↓
(Run your AI analysis)
    ↓
HTTP Request → Call receive-analysis callback
    ↓
HTTP Response (200 OK)
```

**receive-analysis workflow**:
```
Webhook Trigger (receive results)
    ↓
Parse analysis data
    ↓
Save to external system or database
    ↓
HTTP Response (200 OK)
```

---

## Performance Optimization

### Webhook Timeout Settings

- **Supabase Edge Function**: 600 second timeout (default)
- **N8N Webhook Response**: Keep under 60 seconds
- **Chat Webhook**: Keep under 30 seconds

If workflow takes longer:
1. Use background jobs in N8N
2. Call callback webhook when complete
3. Frontend polls database for status updates

---

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use environment variables** for all secrets
3. **Rotate webhook URLs** periodically
4. **Validate callback source** in receive-analysis function
5. **Use HTTPS only** (no HTTP)
6. **Rate limit webhooks** if needed

---

## Getting Help

### Enable Maximum Debugging

Set environment variable:
```env
DEBUG=*
```

### Collect Diagnostic Info

When reporting issues, include:
1. Browser console logs (full error messages)
2. Supabase edge function logs (timestamp of upload)
3. N8N workflow logs (screenshot of error)
4. Network request headers (from DevTools Network tab)
5. Full error message with stack trace

---

## Quick Reference

### Critical URLs
- Analyze Video: `https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video`
- Chat Video: `https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-chat-video`

### Critical Headers
- Auth: `X-N8N-AUTH: [secret]`
- Content: `Content-Type: application/json`

### Test Command
```bash
curl -X POST https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video \
  -H "Content-Type: application/json" \
  -H "X-N8N-AUTH: YOUR_SECRET" \
  -d '{"videoId":"test","fileName":"test.mp4","fileSize":1000}'
```
