import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalysisCallback {
  videoId: string;
  status: "completed" | "failed";
  analysisData?: Record<string, unknown>;
  errorMessage?: string | null;
}

Deno.serve(async (req: Request) => {
  try {
    console.log("[receive-analysis] Request received:", req.method);

    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      console.error("[receive-analysis] Invalid method:", req.method);
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[receive-analysis] Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log("[receive-analysis] Received payload:", JSON.stringify(body, null, 2));

    const { videoId, status, analysisData, errorMessage }: AnalysisCallback = body;

    if (!videoId || !status) {
      console.error("[receive-analysis] Missing required fields:", { videoId, status });
      return new Response(
        JSON.stringify({ error: "Missing required fields: videoId, status" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["completed", "failed"].includes(status)) {
      console.error("[receive-analysis] Invalid status:", status);
      return new Response(
        JSON.stringify({ error: "Invalid status. Must be 'completed' or 'failed'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[receive-analysis] Processing callback for video ${videoId} with status ${status}`);

    const { data: existingVideo, error: fetchError } = await supabase
      .from("video_analyses")
      .select("id, status")
      .eq("id", videoId)
      .maybeSingle();

    if (fetchError) {
      console.error(`[receive-analysis] Error fetching video ${videoId}:`, fetchError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch video record",
          details: fetchError.message,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!existingVideo) {
      console.error(`[receive-analysis] Video ${videoId} not found in database`);
      return new Response(
        JSON.stringify({
          error: "Video not found",
          videoId,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[receive-analysis] Found existing video with status: ${existingVideo.status}`);

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    };

    if (status === "completed" && analysisData) {
      console.log("[receive-analysis] Adding analysis data to update");
      console.log("[receive-analysis] Analysis data keys:", Object.keys(analysisData));
      updateData.analysis_data = analysisData;
    } else if (status === "failed") {
      const errorMsg = errorMessage && errorMessage !== "NULL" ? errorMessage : "Analysis failed";
      console.log("[receive-analysis] Setting error message:", errorMsg);
      updateData.error_message = errorMsg;
    }

    console.log("[receive-analysis] Update data:", JSON.stringify(updateData, null, 2));

    const { error: updateError } = await supabase
      .from("video_analyses")
      .update(updateData)
      .eq("id", videoId);

    if (updateError) {
      console.error(`[receive-analysis] Database update error for ${videoId}:`, updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to update analysis",
          details: updateError.message,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[receive-analysis] Successfully updated video ${videoId} to status ${status}`);

    return new Response(
      JSON.stringify({
        success: true,
        videoId,
        status,
        message: "Analysis callback received and processed",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[receive-analysis] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});