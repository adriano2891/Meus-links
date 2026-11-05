import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.SUPABASE_URL || "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

export const isSupabaseReady = Boolean(url && key);

export const supabaseAdmin = isSupabaseReady
  ? createClient(url, key, {
      auth: { persistSession: false }
    })
  : null;
