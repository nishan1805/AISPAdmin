import { supabaseAnonKey, supabaseUrl } from "@/lib/env";
import { createClient } from "@supabase/supabase-js";


export const supabase = createClient(supabaseUrl, supabaseAnonKey);