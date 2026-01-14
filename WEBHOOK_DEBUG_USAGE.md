# Webhook Debugging Tools - Usage Guide

This guide explains how to use the built-in webhook debugging utilities to troubleshoot video analysis and chat webhook delivery issues.

## Quick Start

### 1. Enable Debugging in Browser Console

Open your browser's Developer Tools (F12) and paste this command:

```javascript
// Import the debug utilities
import { printQuickReference, enableNetworkMonitoring } from './src/lib/webhookDebug.ts'

// Show quick reference
printQuickReference()

// Enable network monitoring for all API calls
enableNetworkMonitoring()
```

### 2. Test Your Webhook Configuration

Replace `your_secret_key` with your actual N8N webhook secret:

```javascript
import { runFullDiagnostics } from './src/lib/webhookDebug.ts'

runFullDiagnostics(
  'https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video',
  'https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-chat-video',
  'your_secret_key'
)
```

This will:
- ✓ Check environment configuration
- ✓ Test analyze-video webhook connectivity
- ✓ Test chat-video webhook connectivity
- ✓ Show response times and status codes
- ✓ Display diagnostic summary

### 3. Test Single Webhook

```javascript
import { testWebhookConnectivity } from './src/lib/webhookDebug.ts'

testWebhookConnectivity(
  'https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video',
  'your_secret_key'
)
```

## Available Debug Functions

### analyzeWebhookConfig()

Check if webhook environment variables are configured:

```javascript
import { analyzeWebhookConfig } from './src/lib/webhookDebug.ts'
analyzeWebhookConfig()
```

**Output shows:**
- ✓ or ✗ for each configured variable
- ⚠️ Warnings if variables are missing

### testWebhookConnectivity(url, secret, payload?)

Test a single webhook endpoint:

```javascript
import { testWebhookConnectivity } from './src/lib/webhookDebug.ts'

const result = await testWebhookConnectivity(
  'https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video',
  'your_secret_key',
  {
    videoId: 'custom-test-123',
    fileName: 'custom-video.mp4',
    fileSize: 5000000
  }
)

// Result contains:
// - url, method, status, statusText
// - duration (in ms)
// - success (boolean)
// - responseBody (raw response)
// - headers (sent headers)
// - error (if failed)
```

### enableNetworkMonitoring()

Intercept and log all API calls to Supabase and N8N:

```javascript
import { enableNetworkMonitoring } from './src/lib/webhookDebug.ts'

// Enable monitoring
enableNetworkMonitoring()

// Now upload a video and watch the console
// Every API call will be logged with:
// - Timestamp
// - HTTP method (GET, POST, etc)
// - Full URL
// - Request headers
// - Request body (parsed as JSON if possible)
```

**Console output example:**
```
[14:30:45] POST https://ozzkxnudcwcekudsmdxy.supabase.co/functions/v1/analyze-video
  Headers: { Authorization: "Bearer ..." }
  Body: { videoId: "...", fileName: "test.mp4" }

[14:30:46] POST https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video
  Headers: { X-N8N-AUTH: "***" }
  Body: { videoId: "...", fileName: "test.mp4", ... }
```

### runFullDiagnostics(analyzeUrl, chatUrl, secret)

Run comprehensive end-to-end diagnostics:

```javascript
import { runFullDiagnostics } from './src/lib/webhookDebug.ts'

await runFullDiagnostics(
  'https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video',
  'https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-chat-video',
  'your_secret_key'
)
```

**Tests:**
1. Environment configuration
2. Analyze webhook connectivity
3. Chat webhook connectivity
4. Response times
5. Overall summary

### exportDiagnosticsJson(analyzeUrl, chatUrl, secret)

Export diagnostic results as JSON (for sharing with developers):

```javascript
import { exportDiagnosticsJson } from './src/lib/webhookDebug.ts'

const json = await exportDiagnosticsJson(
  'https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video',
  'https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-chat-video',
  'your_secret_key'
)

console.log(json)
// Copy-paste this JSON when reporting issues
```

### printQuickReference()

Display a quick reference guide in the console:

```javascript
import { printQuickReference } from './src/lib/webhookDebug.ts'
printQuickReference()
```

## Complete Debugging Workflow

### Step 1: Setup Debugging

```javascript
import {
  printQuickReference,
  enableNetworkMonitoring,
  runFullDiagnostics
} from './src/lib/webhookDebug.ts'

// Show quick reference
printQuickReference()

// Enable network monitoring
enableNetworkMonitoring()
```

### Step 2: Run Initial Diagnostics

```javascript
// Test current configuration
await runFullDiagnostics(
  'https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video',
  'https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-chat-video',
  'your_secret_key'
)
```

### Step 3: Upload Test Video

1. Click "Upload & Preview" section
2. Select a small video file (< 10MB)
3. Watch the console for logs

### Step 4: Analyze Console Output

**Expected flow:**
```
✅ [triggerVideoAnalysis] Starting analysis trigger
✅ [triggerVideoAnalysis] Response status: 200
✅ [analyze-video] Sending to N8N: https://...
✅ [analyze-video] N8N Response Status: 200
```

### Step 5: Check Database

Monitor the `video_analyses` table:

```sql
SELECT id, status, analysis_data, error_message
FROM video_analyses
WHERE id = 'your-video-id'
ORDER BY created_at DESC
LIMIT 1
```

## Troubleshooting with Debug Tools

### Issue: "Failed to send to N8N" with Status 401

**Debug steps:**

```javascript
// 1. Check if secret is being sent
enableNetworkMonitoring()
// Upload video and check if X-N8N-AUTH header is present in console

// 2. Test webhook directly with known good payload
import { testWebhookConnectivity } from './src/lib/webhookDebug.ts'
const result = await testWebhookConnectivity(
  'https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video',
  'your_secret_key'
)
console.log(result)
```

### Issue: "Failed to send to N8N" with Status 404

**Debug steps:**

```javascript
// 1. Verify URL is correct
console.log('Expected URL: https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video')

// 2. Test URL directly
import { testWebhookConnectivity } from './src/lib/webhookDebug.ts'
const result = await testWebhookConnectivity(
  'https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video',
  'test_secret'
)
console.log('Status:', result.status) // Should NOT be 404 with valid path
```

### Issue: Request Times Out

**Debug steps:**

```javascript
// 1. Enable network monitoring to see actual request
enableNetworkMonitoring()

// 2. Run diagnostics to measure response times
import { runFullDiagnostics } from './src/lib/webhookDebug.ts'
await runFullDiagnostics(
  'https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video',
  'https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-chat-video',
  'your_secret_key'
)
// Check duration values - if > 30000ms, network issue likely

// 3. Test connectivity from browser
fetch('https://zuefer-kilincarslan-n8n.zk-ai.agency/')
  .then(r => console.log('N8N reachable:', r.status))
  .catch(e => console.error('N8N unreachable:', e.message))
```

## Environment Variables

Before debugging, ensure `.env` is properly configured:

```env
VITE_SUPABASE_URL=https://ozzkxnudcwcekudsmdxy.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

N8N_WEBHOOK_URL=https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video
N8N_CHAT_WEBHOOK_URL=https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-chat-video
N8N_WEBHOOK_AUTH=your_secret_key_here
```

**After updating .env:**
1. Stop dev server (Ctrl+C)
2. Restart dev server (npm run dev)
3. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
4. Try debugging again

## Console Log Reference

### Success Logs

When everything works, you'll see:

```
[triggerVideoAnalysis] Starting analysis trigger {
  videoId: "abc-123...",
  endpoint: "https://ozzkxnudcwcekudsmdxy.supabase.co/functions/v1/analyze-video"
}

[triggerVideoAnalysis] Response status: 200

[triggerVideoAnalysis] Success: {
  success: true,
  videoId: "abc-123...",
  message: "Video queued for analysis",
  callbackUrl: "https://..."
}

[analyze-video] Sending to N8N: https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video

[analyze-video] N8N Response Status: 200

[analyze-video] N8N Success Response: OK
```

### Error Logs

Common errors and their meanings:

```
// Authentication failed
[analyze-video] N8N Response Status: 401
[analyze-video] N8N Error: {"error":"Unauthorized"}
→ Check N8N_WEBHOOK_AUTH secret

// Wrong URL
[analyze-video] N8N Response Status: 404
[analyze-video] N8N Error: {"error":"Not Found"}
→ Check N8N_WEBHOOK_URL path

// N8N server down
[analyze-video] N8N Response Status: 503
[analyze-video] N8N Error: Service Unavailable
→ Check N8N server status

// Network timeout
[analyze-video] Error: Request timeout
→ Check firewall/network connectivity
```

## Tips & Best Practices

1. **Always enable network monitoring first** before uploading videos
2. **Run diagnostics after changing .env** to verify configuration
3. **Save diagnostic JSON** for future reference or when reporting issues
4. **Check browser console first** - most issues show up there
5. **Test webhooks independently** before testing full flow
6. **Keep secret safe** - don't share console output with others
7. **Restart dev server after .env changes** - environment variables don't hot-reload

## Getting Help

If debugging doesn't solve the issue, gather this information:

```javascript
import { exportDiagnosticsJson } from './src/lib/webhookDebug.ts'

const diagnostics = await exportDiagnosticsJson(
  'https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video',
  'https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-chat-video',
  'your_secret_key'
)

// Share this JSON + console logs + error messages with developers
console.log(diagnostics)
```

Include:
- Full console output (F12 → Console tab)
- Diagnostic JSON
- Error messages
- Browser information
- N8N webhook logs (if available)
