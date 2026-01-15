import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

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
    console.log("[analyze-video] Request received:", req.method);

    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      console.error("[analyze-video] Invalid method:", req.method);
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    console.log("[analyze-video] Received payload:", JSON.stringify(body, null, 2));

    const { videoId, fileName, fileSize }: AnalyzeVideoRequest = body;

    if (!videoId || !fileName) {
      console.error("[analyze-video] Missing required fields:", { videoId, fileName });
      return new Response(
        JSON.stringify({ error: "Missing required fields: videoId, fileName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const n8nWebhookUrl = Deno.env.get("N8N_WEBHOOK_URL");
    const n8nAuth = Deno.env.get("N8N_WEBHOOK_AUTH");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[analyze-video] Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!n8nWebhookUrl) {
      console.error("[analyze-video] N8N_WEBHOOK_URL not configured");
      return new Response(
        JSON.stringify({ error: "N8N webhook URL not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: videoRecord, error: fetchError } = await supabase
      .from("video_analyses")
      .select("video_url, user_id")
      .eq("id", videoId)
      .maybeSingle();

    if (fetchError) {
      console.error(`[analyze-video] Error fetching video ${videoId}:`, fetchError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch video record",
          details: fetchError.message,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!videoRecord) {
      console.error(`[analyze-video] Video ${videoId} not found in database`);
      return new Response(
        JSON.stringify({
          error: "Video not found",
          videoId,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!videoRecord.video_url) {
      console.error(`[analyze-video] Video ${videoId} has no video_url`);
      return new Response(
        JSON.stringify({
          error: "Video URL not available",
          videoId,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[analyze-video] Found video URL for ${videoId}: ${videoRecord.video_url}`);

    const callbackUrl = `${supabaseUrl}/functions/v1/receive-analysis`;

    const webhookPayload = {
      videoId,
      videoUrl: videoRecord.video_url,
      fileName,
      fileSize,
      callbackUrl,
      timestamp: new Date().toISOString(),
    };

    console.log(`[analyze-video] Sending to N8N webhook: ${n8nWebhookUrl}`);
    console.log(`[analyze-video] Payload:`, JSON.stringify(webhookPayload, null, 2));

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (n8nAuth) {
      headers["Authorization"] = `Bearer ${n8nAuth}`;
      console.log("[analyze-video] Using Bearer authentication");
    }

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(webhookPayload),
    });

    console.log(`[analyze-video] N8N Response Status: ${n8nResponse.status}`);

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error(`[analyze-video] N8N Error Response: ${errorText}`);

      await supabase
        .from("video_analyses")
        .update({
          status: "failed",
          error_message: `Failed to send to N8N: ${errorText}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", videoId);

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
    console.error("[analyze-video] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});