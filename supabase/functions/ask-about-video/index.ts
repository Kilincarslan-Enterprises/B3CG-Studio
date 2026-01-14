import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatRequest {
  question: string;
  videoId: string;
  analysisData: Record<string, unknown>;
  chatHistory: Array<{
    role: string;
    message: string;
    timestamp: string;
  }>;
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

    const { question, videoId, analysisData, chatHistory }: ChatRequest = await req.json();

    if (!question || !videoId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: question, videoId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const n8nWebhookUrl = Deno.env.get("N8N_CHAT_WEBHOOK_URL");
    const n8nAuth = Deno.env.get("N8N_WEBHOOK_AUTH");

    if (!n8nWebhookUrl) {
      console.error("N8N_CHAT_WEBHOOK_URL not configured");
      return new Response(
        JSON.stringify({ error: "Chat webhook URL not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const chatPayload = {
      question,
      videoId,
      analysisData,
      chatHistory,
      timestamp: new Date().toISOString(),
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (n8nAuth) {
      headers["Authorization"] = `Bearer ${n8nAuth}`;
    }

    console.log(`[ask-about-video] Sending to N8N: ${n8nWebhookUrl}`);
    console.log(`[ask-about-video] Question: ${question}`);

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(chatPayload),
    });

    console.log(`[ask-about-video] N8N Response Status: ${n8nResponse.status}`);

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error(`[ask-about-video] N8N Error: ${errorText}`);
      return new Response(
        JSON.stringify({
          error: "Failed to process question",
          status: n8nResponse.status,
          details: errorText,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const n8nResult = await n8nResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        videoId,
        response: n8nResult.response || n8nResult,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[ask-about-video] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});