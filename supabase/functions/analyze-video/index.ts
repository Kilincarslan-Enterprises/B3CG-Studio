import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalyzeVideoRequest {
  videoId: string;
  fileName: string;
  fileSize: number;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { videoId, fileName, fileSize }: AnalyzeVideoRequest = await req.json();

    if (!videoId || !fileName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: videoId, fileName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const n8nWebhookUrl = Deno.env.get("N8N_WEBHOOK_URL");
    const n8nAuth = Deno.env.get("N8N_WEBHOOK_AUTH");

    if (!n8nWebhookUrl) {
      console.error("N8N_WEBHOOK_URL not configured");
      return new Response(
        JSON.stringify({ error: "N8N webhook URL not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    const callbackUrl = `${supabaseUrl}/functions/v1/receive-analysis`;

    const webhookPayload = {
      videoId,
      fileName,
      fileSize,
      callbackUrl,
      timestamp: new Date().toISOString(),
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (n8nAuth) {
      headers["Authorization"] = `Bearer ${n8nAuth}`;
    }

    console.log(`[analyze-video] Sending to N8N: ${n8nWebhookUrl}`);
    console.log(`[analyze-video] Payload:`, JSON.stringify(webhookPayload));

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(webhookPayload),
    });

    console.log(`[analyze-video] N8N Response Status: ${n8nResponse.status}`);

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error(`[analyze-video] N8N Error: ${errorText}`);
      return new Response(
        JSON.stringify({
          error: "Failed to send to N8N",
          status: n8nResponse.status,
          details: errorText,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const responseData = await n8nResponse.text();
    console.log(`[analyze-video] N8N Success Response: ${responseData}`);

    return new Response(
      JSON.stringify({
        success: true,
        videoId,
        message: "Video queued for analysis",
        callbackUrl,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[analyze-video] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});