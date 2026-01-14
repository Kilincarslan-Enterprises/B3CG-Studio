/**
 * Webhook Debugging Utilities
 *
 * Use these functions in browser console to troubleshoot webhook delivery
 */

interface WebhookTestResult {
  url: string;
  method: string;
  status: number;
  statusText: string;
  duration: number;
  success: boolean;
  headers: Record<string, string>;
  responseBody: string;
  error?: string;
}

/**
 * Test webhook connectivity with custom authentication
 */
export async function testWebhookConnectivity(
  webhookUrl: string,
  secret: string,
  testPayload: Record<string, unknown> = {}
): Promise<WebhookTestResult> {
  const startTime = performance.now();

  const defaultPayload = {
    videoId: `test-${Date.now()}`,
    fileName: 'test-video.mp4',
    fileSize: 1000000,
    timestamp: new Date().toISOString(),
    ...testPayload,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-N8N-AUTH': secret,
  };

  try {
    console.log('🧪 Testing webhook connectivity...');
    console.log('URL:', webhookUrl);
    console.log('Payload:', defaultPayload);
    console.log('Headers:', headers);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(defaultPayload),
    });

    const duration = performance.now() - startTime;
    const responseBody = await response.text();

    const result: WebhookTestResult = {
      url: webhookUrl,
      method: 'POST',
      status: response.status,
      statusText: response.statusText,
      duration: Math.round(duration),
      success: response.ok,
      headers,
      responseBody,
    };

    logWebhookResult(result);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    const result: WebhookTestResult = {
      url: webhookUrl,
      method: 'POST',
      status: 0,
      statusText: 'Network Error',
      duration: Math.round(duration),
      success: false,
      headers,
      responseBody: '',
      error: error instanceof Error ? error.message : String(error),
    };

    logWebhookResult(result);
    return result;
  }
}

/**
 * Log webhook test result with formatting
 */
function logWebhookResult(result: WebhookTestResult): void {
  const statusEmoji = result.success ? '✅' : '❌';
  const statusColor = result.success ? 'color: green' : 'color: red';

  console.group(`${statusEmoji} Webhook Test Result`);
  console.log(`%cStatus: ${result.status} ${result.statusText}`, statusColor);
  console.log(`Duration: ${result.duration}ms`);
  console.log(`URL: ${result.url}`);

  if (result.error) {
    console.error('Error:', result.error);
  }

  if (result.responseBody) {
    try {
      const parsed = JSON.parse(result.responseBody);
      console.log('Response:', parsed);
    } catch {
      console.log('Response (raw):', result.responseBody);
    }
  }

  console.groupEnd();
}

/**
 * Analyze webhook configuration from environment
 */
export function analyzeWebhookConfig(): void {
  console.group('🔍 Webhook Configuration Analysis');

  const n8nUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
  const n8nChatUrl = import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL;
  const n8nSecret = import.meta.env.VITE_N8N_WEBHOOK_AUTH;

  console.log('Analyze Video URL:', n8nUrl ? '✓ Set' : '❌ Not set');
  console.log('Chat Video URL:', n8nChatUrl ? '✓ Set' : '❌ Not set');
  console.log('Webhook Secret:', n8nSecret ? '✓ Set' : '❌ Not set');

  if (!n8nUrl) {
    console.warn(
      '⚠️  N8N_WEBHOOK_URL not configured. Update .env file with webhook URL'
    );
  }

  if (!n8nSecret) {
    console.warn(
      '⚠️  N8N_WEBHOOK_AUTH not configured. Update .env file with webhook secret'
    );
  }

  console.groupEnd();
}

/**
 * Monitor API calls and log them
 * Call this once to intercept all fetch calls
 */
export function enableNetworkMonitoring(): void {
  const originalFetch = window.fetch;

  (window as any).fetch = function (
    this: any,
    url: RequestInfo | URL,
    init?: RequestInit
  ) {
    const urlStr = String(url);

    // Only log Supabase and N8N calls
    if (
      urlStr.includes('supabase.co/functions') ||
      urlStr.includes('n8n')
    ) {
      const method = (init?.method as string) || 'GET';
      const timestamp = new Date().toLocaleTimeString();

      console.group(
        `%c[${timestamp}] ${method} ${urlStr}`,
        'color: #666; font-weight: bold'
      );

      if (init?.headers) {
        console.log('Headers:', init.headers);
      }

      if (init?.body) {
        try {
          const body = JSON.parse(init.body as string);
          console.log('Body:', body);
        } catch {
          console.log('Body:', init.body);
        }
      }

      console.groupEnd();
    }

    return originalFetch.call(this, url, init);
  } as typeof fetch;

  console.log('✅ Network monitoring enabled. Check console for API calls.');
}

/**
 * Get comprehensive webhook diagnostics
 */
export async function runFullDiagnostics(
  analyzeWebhookUrl: string,
  chatWebhookUrl: string,
  secret: string
): Promise<void> {
  console.clear();
  console.log('%c🔧 Running Full Webhook Diagnostics', 'font-size: 18px; font-weight: bold');

  // Step 1: Check environment
  console.group('Step 1: Environment Check');
  analyzeWebhookConfig();
  console.groupEnd();

  // Step 2: Test analyze-video webhook
  console.group('Step 2: Test Analyze Video Webhook');
  const analyzeResult = await testWebhookConnectivity(
    analyzeWebhookUrl,
    secret,
    {
      videoId: `diagnostic-${Date.now()}`,
      fileName: 'diagnostic-video.mp4',
      fileSize: 5242880,
    }
  );
  console.groupEnd();

  // Step 3: Test chat webhook
  console.group('Step 3: Test Chat Video Webhook');
  const chatResult = await testWebhookConnectivity(
    chatWebhookUrl,
    secret,
    {
      videoId: `diagnostic-${Date.now()}`,
      question: 'Is this a diagnostic test?',
      analysisData: {},
      chatHistory: [],
    }
  );
  console.groupEnd();

  // Step 4: Summary
  console.group('%c📊 Diagnostic Summary', 'color: #0066cc; font-weight: bold');
  console.table({
    'Analyze Webhook': {
      Status: analyzeResult.status,
      Success: analyzeResult.success ? '✓' : '✗',
      Duration: `${analyzeResult.duration}ms`,
    },
    'Chat Webhook': {
      Status: chatResult.status,
      Success: chatResult.success ? '✓' : '✗',
      Duration: `${chatResult.duration}ms`,
    },
  });

  if (analyzeResult.success && chatResult.success) {
    console.log(
      '%c✅ All webhooks responding correctly!',
      'color: green; font-weight: bold'
    );
  } else {
    console.log(
      '%c⚠️  Some webhooks are not responding. Check configuration.',
      'color: orange; font-weight: bold'
    );
  }

  console.groupEnd();
}

/**
 * Export diagnostics as JSON for sharing
 */
export async function exportDiagnosticsJson(
  analyzeWebhookUrl: string,
  chatWebhookUrl: string,
  secret: string
): Promise<string> {
  const analyzeResult = await testWebhookConnectivity(analyzeWebhookUrl, secret);
  const chatResult = await testWebhookConnectivity(chatWebhookUrl, secret);

  const diagnostics = {
    timestamp: new Date().toISOString(),
    webhooks: {
      analyze: {
        url: analyzeResult.url,
        status: analyzeResult.status,
        success: analyzeResult.success,
        duration: analyzeResult.duration,
        error: analyzeResult.error,
      },
      chat: {
        url: chatResult.url,
        status: chatResult.status,
        success: chatResult.success,
        duration: chatResult.duration,
        error: chatResult.error,
      },
    },
    browser: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      onLine: navigator.onLine,
    },
  };

  return JSON.stringify(diagnostics, null, 2);
}

/**
 * Print quick reference guide in console
 */
export function printQuickReference(): void {
  console.clear();
  console.log(`
╔════════════════════════════════════════════════════════════╗
║         🎯 WEBHOOK DEBUGGING QUICK REFERENCE              ║
╚════════════════════════════════════════════════════════════╝

1️⃣  CHECK CONFIGURATION:
   analyzeWebhookConfig()

2️⃣  TEST SINGLE WEBHOOK:
   testWebhookConnectivity(
     'https://your-webhook-url',
     'your_secret'
   )

3️⃣  RUN FULL DIAGNOSTICS:
   runFullDiagnostics(
     'https://analyze-webhook-url',
     'https://chat-webhook-url',
     'your_secret'
   )

4️⃣  ENABLE NETWORK MONITORING:
   enableNetworkMonitoring()

   Then perform video upload to see all API calls

5️⃣  EXPORT DIAGNOSTICS:
   const json = await exportDiagnosticsJson(
     'https://analyze-url',
     'https://chat-url',
     'secret'
   )
   console.log(json)

────────────────────────────────────────────────────────────

🔗 WEBHOOK URLS (from your config):
   Analyze: https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-analyze-video
   Chat: https://zuefer-kilincarslan-n8n.zk-ai.agency/webhook/b3cg-chat-video

🔐 AUTH HEADER:
   X-N8N-AUTH: your_secret_key

────────────────────────────────────────────────────────────

📖 STATUS CODES GUIDE:
   200 - OK (webhook received) ✓
   400 - Bad Request (check payload)
   401 - Unauthorized (check secret)
   403 - Forbidden (check permissions)
   404 - Not Found (check URL)
   502 - Bad Gateway (N8N down)
   TIMEOUT - Network issue (firewall?)

  `);
}
