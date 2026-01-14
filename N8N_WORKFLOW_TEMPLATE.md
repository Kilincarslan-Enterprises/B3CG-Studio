# n8n Workflow Templates

## Workflow 1: Video Analysis Trigger (analyze-video)

This workflow receives video metadata from the frontend and processes it through your AI analysis pipeline.

### Configuration

**Workflow Name**: `Video Analysis Pipeline`

**Trigger**: Webhook
- Method: POST
- Authentication: Header Authentication
  - Header: `Authorization`
  - Expected Value: `Bearer {YOUR_TOKEN}`

### Workflow Steps

#### Step 1: Webhook Trigger
- Node: Webhook
- Method: POST
- Authentication: Header (validate Authorization header)

#### Step 2: Extract Variables
```
Input from webhook body:
- videoId: $json.videoId
- fileName: $json.fileName
- fileSize: $json.fileSize
- callbackUrl: $json.callbackUrl
```

#### Step 3: Call Your AI Analysis Service
```
Example with OpenAI:
- Node: HTTP Request
- Method: POST
- URL: https://api.openai.com/v1/chat/completions
- Auth: Bearer {OPENAI_KEY}
- Body:
  {
    "model": "gpt-4-vision",
    "messages": [{
      "role": "user",
      "content": "Analyze this video for virality factors: {{$json.fileName}}"
    }],
    "temperature": 0.7
  }
```

#### Step 4: Process Response
```
- Parse AI response into structured JSON:
  {
    "viralityEvaluation": {
      "overallVerdict": "...",
      "viralityScore": 75,
      "confidenceLevel": "High",
      "primaryRisk": "..."
    },
    "hookEvaluation": {
      "hookPresentFirst2Seconds": true,
      "hookStrength": "strong",
      "reasoning": "..."
    },
    "bestPracticeComparison": [...],
    "retentionAnalysis": {...},
    "loopabilityAnalysis": {...},
    "timestampedImprovements": [...],
    "topThreePriorityActions": [...],
    "safeRewriteSuggestions": {...}
  }
```

#### Step 5: Send Callback to Supabase
- Node: HTTP Request
- Method: POST
- URL: `{{$json.callbackUrl}}`
- Headers:
  ```
  Authorization: Bearer {N8N_WEBHOOK_AUTH}
  Content-Type: application/json
  ```
- Body:
  ```json
  {
    "videoId": "{{$json.videoId}}",
    "status": "completed",
    "analysisData": {{$json.analysis_results}},
    "errorMessage": null
  }
  ```

#### Step 6: Error Handling
- Add catch block to send error callback:
  ```json
  {
    "videoId": "{{$json.videoId}}",
    "status": "failed",
    "analysisData": null,
    "errorMessage": "{{$error.message}}"
  }
  ```

---

## Workflow 2: Video Chat Interface (ask-about-video)

This workflow handles chat questions about analyzed videos.

### Configuration

**Workflow Name**: `Video Chat Interface`

**Trigger**: Webhook
- Method: POST
- Authentication: Header Authentication
  - Header: `Authorization`
  - Expected Value: `Bearer {YOUR_TOKEN}`

### Workflow Steps

#### Step 1: Webhook Trigger
- Node: Webhook
- Method: POST
- Authentication: Header (validate Authorization header)

#### Step 2: Extract Input Variables
```
From request body:
- videoId: $json.videoId
- question: $json.question
- analysisData: $json.analysisData
- chatHistory: $json.chatHistory
```

#### Step 3: Format Chat Context
```
Create a prompt combining:
1. Original analysis data
2. Previous chat history
3. New question

Example:
"Video Analysis Summary:
Score: {{$json.analysisData.viralityEvaluation.viralityScore}}

Previous Messages:
{{$json.chatHistory.map(m => `${m.role}: ${m.message}`).join('\n')}}

New Question: {{$json.question}}"
```

#### Step 4: Call Chat AI Model
```
Node: HTTP Request
Method: POST
URL: https://api.openai.com/v1/chat/completions (or your LLM)
Auth: Bearer {YOUR_LLM_KEY}

Body:
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "You are an expert video analyst. Answer questions about video virality based on the analysis data provided."
    },
    {
      "role": "user",
      "content": "{{formattedContext}}"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 500
}
```

#### Step 5: Extract Response
```
responseText = $json.choices[0].message.content
```

#### Step 6: Return Response to Frontend
- Node: Respond to Webhook
- Response Body:
  ```json
  {
    "response": "{{responseText}}"
  }
  ```

#### Step 7: Error Handling
- Return error response:
  ```json
  {
    "error": "Failed to process chat message",
    "message": "{{$error.message}}"
  }
  ```

---

## Workflow 3: Cleanup & Monitoring (Optional)

Monitor failed analyses and retry logic.

### Steps

#### 1. Check Failed Analyses
- Trigger: Daily schedule
- Query: Check for status='failed' videos older than 1 hour

#### 2. Retry Failed Videos
- For each failed video:
  - Trigger analysis again
  - Update status back to 'processing'

#### 3. Alert on Persistent Failures
- If video fails 3 times:
  - Send admin notification
  - Mark as 'needs_review'

---

## n8n Configuration Checklist

- [ ] Create 3 workflows (Analysis, Chat, Monitoring)
- [ ] Set up webhook authentication headers
- [ ] Configure AI service credentials (OpenAI, etc.)
- [ ] Test each workflow with sample data
- [ ] Set up error notifications
- [ ] Enable workflow logging
- [ ] Set up monitoring/alerts
- [ ] Deploy to production
- [ ] Document webhook URLs for frontend

---

## Testing the Workflows

### Test 1: Analysis Workflow
```bash
curl -X POST https://your-n8n.com/webhook/video-analysis \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "test-123",
    "fileName": "test.mp4",
    "fileSize": 1024000,
    "callbackUrl": "https://your-project.supabase.co/functions/v1/receive-analysis"
  }'
```

### Test 2: Chat Workflow
```bash
curl -X POST https://your-n8n.com/webhook/video-chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "test-123",
    "question": "What is the virality score?",
    "analysisData": {...},
    "chatHistory": []
  }'
```

---

## Troubleshooting

### Webhook not triggering
- Check n8n workflow is active
- Verify authentication header is set correctly
- Check firewall allows incoming requests

### Analysis data format incorrect
- Verify JSON structure matches expected schema
- Check all required fields are present
- Use JSON formatter to validate

### Callback fails to update database
- Verify `callbackUrl` is correct
- Check `Authorization` header value
- Verify `N8N_WEBHOOK_AUTH` environment variable matches token

### Chat responses are slow
- Add caching for similar questions
- Optimize AI model parameters
- Consider using faster model variants

### High error rate
- Check AI service rate limits
- Verify credentials are valid
- Monitor service availability
- Set up retry logic with exponential backoff
