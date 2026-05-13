// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = "https://qgolxqsnpxwyxmggmicx.supabase.co"; // ← tu Project URL
const supabaseAnonKey = "sb_publishable_PgWWA14rQ4y7TeoQBEBC2A_E3rpUEUd"; // ← tu anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);