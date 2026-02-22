import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    const today = new Date().toISOString().slice(0, 10)

    // Get all users
    const { data: profiles } = await supabase.from('profiles').select('user_id')
    if (!profiles) throw new Error('No profiles found')

    for (const profile of profiles) {
      const userId = profile.user_id

      // Get all data for this user
      const [txRes, cashRes, tokoRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', userId),
        supabase.from('cash_book').select('*').eq('user_id', userId),
        supabase.from('buka_toko').select('*').eq('user_id', userId),
      ])

      const backupData = {
        date: today,
        user_id: userId,
        transactions: txRes.data || [],
        cash_book: cashRes.data || [],
        buka_toko: tokoRes.data || [],
      }

      const fileName = `${userId}/backup-${today}.json`
      const content = JSON.stringify(backupData, null, 2)

      // Upload to storage
      await supabase.storage
        .from('backups')
        .upload(fileName, new Blob([content], { type: 'application/json' }), { upsert: true })

      // Record backup
      await supabase.from('backups').insert({
        user_id: userId,
        backup_date: today,
        file_url: fileName,
        status: 'completed',
      })
    }

    return new Response(JSON.stringify({ success: true, date: today }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
