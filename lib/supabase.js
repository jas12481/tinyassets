/**
 * Supabase Client Configuration
 * For use in Next.js App Router and API Routes
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env or .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
}

// Client for client-side components
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client (for API routes)
// Use this in API routes for admin operations
export function createServerClient() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey) {
        // Fallback to anon key if service role not available
        return createClient(supabaseUrl, supabaseAnonKey);
    }
    
    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}
