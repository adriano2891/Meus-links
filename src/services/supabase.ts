import { createClient } from "@supabase/supabase-js";

// Read from Vite client env or process env
const metaEnv = typeof import.meta !== "undefined" && (import.meta as any).env ? (import.meta as any).env : {};
const procEnv = typeof process !== "undefined" && process.env ? process.env : {};

const supabaseUrl = metaEnv.VITE_SUPABASE_URL || procEnv.SUPABASE_URL || "";
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || procEnv.SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
