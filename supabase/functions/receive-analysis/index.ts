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
  errorMessage?: string;
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { videoId, status, analysisData, errorMessage }: AnalysisCallback = await req.json();

    if (!videoId || !status) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: videoId, status" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["completed", "failed"].includes(status)) {
      return new Response(
        JSON.stringify({ error: "Invalid status. Must be 'completed' or 'failed'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[receive-analysis] Processing callback for video ${videoId} with status ${status}`);

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    };

    if (status === "completed" && analysisData) {
      updateData.analysis_data = analysisData;
    } else if (status === "failed") {
      updateData.error_message = errorMessage && errorMessage !== "NULL" ? errorMessage : "Analysis failed";
    }

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

    console.log(`[receive-analysis] Successfully updated video ${videoId}`);

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
    console.error("[receive-analysis] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});