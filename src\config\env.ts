import { z } from "zod";
const schema=z.object({APP_ENV:z.enum(["development","staging","production","test"]).default("development"),NEXT_PUBLIC_SUPABASE_URL:z.url().optional(),NEXT_PUBLIC_SUPABASE_ANON_KEY:z.string().min(1).optional(),SUPABASE_SERVICE_ROLE_KEY:z.string().min(1).optional()});
export const env=schema.parse(process.env);
