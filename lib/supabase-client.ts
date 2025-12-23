import { createClient, SupabaseClient } from '@supabase/supabase-js'

let cachedClient: SupabaseClient | null = null

export function getServiceSupabase(): SupabaseClient {
    if (cachedClient) return cachedClient

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // 디버그 로그 추가 (키 전체 노출 방지)
    console.log('[Supabase Debug] URL:', supabaseUrl)
    console.log('[Supabase Debug] Service Key Length:', serviceKey?.length)
    console.log('[Supabase Debug] Service Key Start:', serviceKey?.substring(0, 15), '...')

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

