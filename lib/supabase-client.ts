import { createClient, SupabaseClient } from '@supabase/supabase-js'

let cachedClient: SupabaseClient | null = null

export function getServiceSupabase(): SupabaseClient {
    if (cachedClient) return cachedClient

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Environment variables check
    if (!supabaseUrl || !serviceKey) {
        throw new Error('Supabase environment variables are missing')
    }

    cachedClient = createClient(supabaseUrl, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })

    return cachedClient
}

