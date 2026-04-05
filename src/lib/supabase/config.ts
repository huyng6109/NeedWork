function requiredEnv(value: string | undefined, message: string): string {
  if (!value) {
    throw new Error(message);
  }

  return value;
}

const supabaseUrl = requiredEnv(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "Missing NEXT_PUBLIC_SUPABASE_URL."
);

const supabasePublishableKey = requiredEnv(
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY."
);

export { supabasePublishableKey, supabaseUrl };
