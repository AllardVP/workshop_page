import { createClient } from '@supabase/supabase-js'
import { validateEnvironmentConfig } from './utils.js'

// Initialize Supabase client
const { supabaseUrl, supabaseKey } = validateEnvironmentConfig()

export const supabase = createClient(supabaseUrl, supabaseKey)

console.log('Supabase client initialized successfully')

// Realtime subscription setup
export function setupRealtimeSubscriptions(callbacks) {
    const { onVotesChange, onScriptIdeasChange } = callbacks
    
    // Subscribe to votes changes
    const votesSubscription = supabase
        .channel('votes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes' }, onVotesChange)
        .subscribe()
    
    // Subscribe to script ideas changes
    const scriptIdeasSubscription = supabase
        .channel('script_ideas')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'script_ideas' }, onScriptIdeasChange)
        .subscribe()
    
    return { votesSubscription, scriptIdeasSubscription }
} 