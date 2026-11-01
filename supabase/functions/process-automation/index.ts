// Supabase Edge Function: process-automation
// Invoked by Supabase Database Webhook when meetings.processing_status updates to 'completed'

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

interface WebhookPayload {
  type: "UPDATE" | "INSERT" | "DELETE";
  table: string;
  schema: string;
  record: {
    id: string;
    title: string;
    processing_status: string;
    meeting_date: string;
  };
  old_record?: {
    processing_status: string;
  };
}

serve(async (req: Request) => {
  const timestamp = new Date().toISOString();

  // Allow CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
      },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const webhookSecret = Deno.env.get("SUPABASE_WEBHOOK_SECRET");

    // Verify webhook secret if configured
    if (webhookSecret) {
      const authHeader = req.headers.get("x-webhook-secret");
      if (authHeader !== webhookSecret) {
        return new Response(JSON.stringify({ error: "Unauthorized webhook caller" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const payload: WebhookPayload = await req.json();

    // 1. Validate payload
    if (!payload || !payload.record || !payload.record.id) {
      return new Response(JSON.stringify({ error: "Missing meeting record in webhook payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const meetingId = payload.record.id;
    const currentStatus = payload.record.processing_status;
    const oldStatus = payload.old_record?.processing_status;

    // Only process if status transitioned to 'completed'
    if (currentStatus !== "completed") {
      return new Response(
        JSON.stringify({ message: `Ignored status transition to ${currentStatus}`, meetingId }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Fetch existing action items for this meeting
    const { data: actionItems, error: itemsError } = await supabase
      .from("action_items")
      .select("*")
      .eq("meeting_id", meetingId);

    if (itemsError) {
      throw new Error(`Failed to query action items: ${itemsError.message}`);
    }

    const taskCount = actionItems ? actionItems.length : 0;
    const pendingCount = actionItems ? actionItems.filter((i) => i.status === "pending").length : 0;

    // 3. Log the successful automation execution to automation_logs (Idempotent event log)
    const logDetails = {
      source: "supabase_edge_function",
      event: "meeting_completed",
      meeting_title: payload.record.title,
      tasks_verified: taskCount,
      pending_tasks: pendingCount,
      old_status: oldStatus || "unknown",
      new_status: currentStatus,
      executed_at: timestamp,
    };

    const { error: logError } = await supabase.from("automation_logs").insert({
      meeting_id: meetingId,
      event_type: "database_webhook:meeting_completed",
      execution_status: "success",
      execution_details: logDetails,
      executed_at: timestamp,
    });

    if (logError) {
      console.error("Failed to insert automation log:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Automation processed successfully",
        meetingId,
        tasksVerified: taskCount,
        details: logDetails,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err: any) {
    console.error("Automation error:", err);

    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Internal automation error",
        timestamp,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
