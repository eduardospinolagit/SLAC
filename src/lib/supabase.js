import { createClient } from '@supabase/supabase-js'

const SUPA_URL = 'https://jqmnmudfxxdcjfradvcj.supabase.co'
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxbW5tdWRmeHhkY2pmcmFkdmNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDAxNTMsImV4cCI6MjA4OTYxNjE1M30.LKZz_djPhIc_PvdLxAAhLaV-BZxX70nGup-qODIDEF4'

export const sb = createClient(SUPA_URL, SUPA_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Desativa o lock de storage — resolve o bug de aba inativa
    lock: async (name, acquireTimeout, fn) => {
      return await fn()
    }
  }
})
