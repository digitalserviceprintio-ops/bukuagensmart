import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Tidak terautentikasi" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user token
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Tidak terautentikasi" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { code } = await req.json();
    if (!code) {
      return new Response(JSON.stringify({ error: "Kode tidak boleh kosong" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upperCode = code.toUpperCase();
    const isReusable = upperCode === "MD2R-APP-AGEN";

    // Find activation code using admin client (bypasses RLS)
    let query = supabaseAdmin
      .from("activation_codes")
      .select("*")
      .eq("code", upperCode);

    if (!isReusable) {
      query = query.eq("is_used", false);
    }

    const { data: codeData, error: codeError } = await query.maybeSingle();
    if (codeError || !codeData) {
      return new Response(JSON.stringify({ error: "Kode aktivasi tidak valid atau sudah digunakan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already used this code
    const { data: existingLicense } = await supabaseAdmin
      .from("licenses")
      .select("*")
      .eq("user_id", user.id)
      .eq("activation_code", upperCode)
      .maybeSingle();

    if (existingLicense) {
      return new Response(JSON.stringify({ error: "Anda sudah menggunakan kode ini" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expiresAt = codeData.license_type === "lifetime"
      ? null
      : new Date(Date.now() + (codeData.duration_days || 30) * 24 * 60 * 60 * 1000).toISOString();

    // Upsert license
    const { error: upsertError } = await supabaseAdmin
      .from("licenses")
      .upsert({
        user_id: user.id,
        license_type: codeData.license_type,
        activation_code: upperCode,
        activated_at: new Date().toISOString(),
        expires_at: expiresAt,
        is_active: true,
      }, { onConflict: "user_id" });

    if (upsertError) {
      return new Response(JSON.stringify({ error: "Gagal mengaktifkan lisensi" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark code as used (only for non-reusable codes)
    if (!isReusable) {
      await supabaseAdmin
        .from("activation_codes")
        .update({ is_used: true, used_by: user.id, used_at: new Date().toISOString() })
        .eq("id", codeData.id);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
