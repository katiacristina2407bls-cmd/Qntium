import { createClient } from '@supabase/supabase-js';

// NOTE: In a real environment, these should be in .env files.
const supabaseUrl = 'https://xmvgwngdmzkvnrzoxgat.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhtdmd3bmdkbXprdm5yem94Z2F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NjI1ODksImV4cCI6MjA3OTEzODU4OX0.16lwKPt2G2peHLIo0rHDjXAG00JcFfNOeIYjMfJsO9s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);