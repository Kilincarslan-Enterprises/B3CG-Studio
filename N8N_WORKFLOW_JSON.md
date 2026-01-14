# n8n Workflow Import Templates

## Workflow 1: Video Analysis (Import JSON)

Copy this JSON into n8n to create the video analysis workflow:

```json
{
  "name": "Video Analysis Pipeline",
  "active": true,
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "video-analysis",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "node1",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [0, 0]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=YOUR_AI_ENDPOINT",
        "authentication": "genericCredentialType",
        "genericCredentials": "={{$credentials.openai}}",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "model",
              "value": "gpt-4"
            },
            {
              "name": "messages",
              "value": "=[{\"role\": \"user\", \"content\": \"Analyze this video for virality: \" + $json.fileName}]"
            }
          ]
        },
        "options": {}
      },
      "id": "node2",
      "name": "Call AI Analysis",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [200, 0]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=$json.callbackUrl",
        "authentication": "predefinedCredentialType",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{$env.N8N_WEBHOOK_AUTH}}"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "videoId",
              "value": "=$json.videoId"
            },
            {
              "name": "status",
              "value": "completed"
            },
            {
              "name": "analysisData",
              "value": "=$json"
            },
            {
              "name": "errorMessage",
              "value": "=null"
            }
          ]
        },
        "options": {}
      },
      "id": "node3",
      "name": "Send Callback",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [400, 0]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=$json.callbackUrl",
        "authentication": "predefinedCredentialType",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{$env.N8N_WEBHOOK_AUTH}}"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "videoId",
              "value": "=$json.videoId"
            },
            {
              "name": "status",
              "value": "failed"
            },
            {
              "name": "analysisData",
              "value": "=null"
            },
            {
              "name": "errorMessage",
              "value": "={{error.message}}"
            }
          ]
        },
        "options": {}
      },
      "id": "node4",
      "name": "Send Error Callback",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [400, 100],
      "onError": "continueRegardless"
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Call AI Analysis",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Call AI Analysis": {
      "main": [
        [
          {
            "node": "Send Callback",
            "type": "main",
            "index": 0
          }
        ]
      ],
      "error": [
        [
          {
            "node": "Send Error Callback",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  },
  "versionId": "00000000-0000-0000-0000-000000000000",
  "meta": {
    "instanceId": "local"
  },
  "pinData": null
}
```

### Setup Instructions for Workflow 1

1. **Create new workflow** in n8n
2. **Add Webhook node**:
   - Method: POST
   - Path: `video-analysis`
   - Click "Webhook" → set up authentication

3. **Configure Webhook Authentication**:
   - Click "Authentication" tab
   - Select "Header Authentication"
   - Header name: `Authorization`
   - Header value: `Bearer YOUR_TOKEN`

4. **Add HTTP Request (AI Analysis)**:
   - Method: POST
   - URL: Your AI endpoint (OpenAI, Claude, etc.)
   - Headers: Include API key
   - Body: Include videoId, fileName in prompt

5. **Add HTTP Request (Send Callback)**:
   - Method: POST
   - URL: `$json.callbackUrl` (from webhook data)
   - Headers: `Authorization: Bearer {{$env.N8N_WEBHOOK_AUTH}}`
   - Body:
     ```json
     {
       "videoId": "=webhook.videoId",
       "status": "completed",
       "analysisData": "=ai_response",
       "errorMessage": null
     }
     ```

6. **Connect with error handler**:
   - Right-click "AI Analysis" node → "Add error output"
   - Connect error to "Send Error Callback"
   - Error callback sends `status: "failed"`

7. **Deploy and test**

---

## Workflow 2: Video Chat (Import JSON)

```json
{
  "name": "Video Chat Interface",
  "active": true,
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "video-chat",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "node1",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [0, 0]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=YOUR_AI_ENDPOINT",
        "authentication": "genericCredentialType",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "model",
              "value": "gpt-4"
            },
            {
              "name": "messages",
              "value": "=[...chatHistory, {\"role\": \"user\", \"content\": question}]"
            }
          ]
        },
        "options": {}
      },
      "id": "node2",
      "name": "Chat Model",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [200, 0]
    },
    {
      "parameters": {
        "respondWithOutput": true
      },
      "id": "node3",
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [400, 0]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Chat Model",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Chat Model": {
      "main": [
        [
          {
            "node": "Respond",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

### Setup Instructions for Workflow 2

1. **Create new workflow** in n8n
2. **Add Webhook node**:
   - Method: POST
   - Path: `video-chat`
   - Set up header authentication (same as Workflow 1)

3. **Add HTTP Request (Chat Model)**:
   - Method: POST
   - URL: Your LLM endpoint
   - Body format:
     ```json
     {
       "model": "gpt-4",
       "messages": [
         {"role": "system", "content": "You are a video analysis AI..."},
         ...chatHistory,
         {"role": "user", "content": "question"}
       ]
     }
     ```

4. **Add Respond to Webhook node**:
   - Configure to return response
   - Responds with AI message

5. **Deploy and test**

---

## Step-by-Step Workflow Creation (Alternative Method)

If JSON import doesn't work, follow these steps:

### Workflow 1: Analysis

1. **New Workflow** → Name: "Video Analysis Pipeline"

2. **Add Webhook Node**
   - Click `+` → Search "Webhook"
   - Select "Webhook" node
   - Authentication: Enable "Header Authentication"
     - Header: `Authorization`
     - Value: `Bearer <your-token>`

3. **Add HTTP Request Node** (AI Call)
   - Connect from Webhook
   - Method: POST
   - URL: `https://api.openai.com/v1/chat/completions`
   - Authentication: API Key (your OpenAI key)
   - Headers:
     ```
     Content-Type: application/json
     ```
   - Body:
     ```json
     {
       "model": "gpt-4",
       "messages": [{
         "role": "user",
         "content": "Analyze video '{{$json.fileName}}' for virality. Return structured analysis with: viralityScore (0-100), hookStrength (weak/medium/strong), improvements[]"
       }],
       "temperature": 0.7
     }
     ```

4. **Add HTTP Request Node** (Success Callback)
   - Connect from AI Call node
   - Method: POST
   - URL: Use expression: `={{$json.callbackUrl}}`
   - Headers:
     ```
     Authorization: Bearer {{$env.N8N_WEBHOOK_AUTH}}
     Content-Type: application/json
     ```
   - Body:
     ```json
     {
       "videoId": "={{$json.videoId}}",
       "status": "completed",
       "analysisData": "={{$json}}",
       "errorMessage": null
     }
     ```

5. **Add Error Handler**
   - Right-click AI Call node → "Add Error Output"
   - Add another HTTP Request (Error Callback)
   - Same as Success but with:
     ```json
     {
       "videoId": "={{$json.videoId}}",
       "status": "failed",
       "analysisData": null,
       "errorMessage": "={{error.message}}"
     }
     ```

6. **Save & Activate**

### Workflow 2: Chat

1. **New Workflow** → Name: "Video Chat Interface"

2. **Add Webhook Node**
   - Same authentication as Workflow 1
   - Path: `video-chat`

3. **Add HTTP Request Node** (Chat)
   - Method: POST
   - URL: Your LLM endpoint
   - Headers: Your LLM API auth
   - Body:
     ```json
     {
       "model": "gpt-4",
       "messages": [
         {
           "role": "system",
           "content": "You are an expert video analyst. Answer questions about video virality based on the provided analysis."
         },
         ...ChatHistory,
         {"role": "user", "content": "={{$json.question}}"}
       ]
     }
     ```

4. **Add Response Node**
   - Respond with LLM response
   - Body:
     ```json
     {
       "response": "={{$json.choices[0].message.content}}"
     }
     ```

5. **Save & Activate**

---

## Testing the Workflows

### Test Video Analysis
```bash
curl -X POST https://your-n8n.example.com/webhook/video-analysis \
  -H "Authorization: Bearer your-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "test-123",
    "fileName": "sample.mp4",
    "fileSize": 5000000,
    "callbackUrl": "https://your-project.supabase.co/functions/v1/receive-analysis"
  }'
```

Expected response:
```json
{
  "success": true,
  "videoId": "test-123",
  "message": "Video queued for analysis"
}
```

### Test Video Chat
```bash
curl -X POST https://your-n8n.example.com/webhook/video-chat \
  -H "Authorization: Bearer your-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "test-123",
    "question": "What is the virality score?",
    "analysisData": {
      "viralityEvaluation": {"viralityScore": 75}
    },
    "chatHistory": []
  }'
```

Expected response:
```json
{
  "response": "Based on the analysis, the virality score is 75..."
}
```

---

## Environment Variables in n8n

Set in n8n Settings → Environment:

```
N8N_WEBHOOK_AUTH=your-secure-token-here
OPENAI_API_KEY=sk-...
```

Then reference as: `{{$env.N8N_WEBHOOK_AUTH}}`

---

## Troubleshooting

### Webhook not triggering
- Verify Authentication header format
- Check webhook URL path matches exactly
- Test with curl first

### Callback failing
- Verify `callbackUrl` is in request body
- Check Authorization header in callback
- Verify `N8N_WEBHOOK_AUTH` matches token

### Chat not returning response
- Check if analysis_data is populated
- Verify LLM API credentials
- Check message format for your LLM

### High latency
- Consider caching popular questions
- Use faster LLM models (gpt-3.5 instead of gpt-4)
- Add timeout handling
