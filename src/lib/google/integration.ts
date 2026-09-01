import { createClient } from "@/lib/supabase/server";
import { refreshAccessToken } from "./oauth";

export interface GoogleIntegration {
  id: string;
  user_id: string;
  google_email: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  scopes: string[];
}

export async function getGoogleIntegration(
  userId: string
): Promise<GoogleIntegration | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("google_integrations")
    .select("*")
    .eq("user_id", userId)
    .single();

  return data as GoogleIntegration | null;
}

export async function getValidAccessToken(
  integration: GoogleIntegration
): Promise<string> {
  const expiresAt = integration.token_expires_at
    ? new Date(integration.token_expires_at).getTime()
    : 0;

  // Refresh 5 minutes before expiry
  if (Date.now() < expiresAt - 5 * 60 * 1000) {
    return integration.access_token;
  }

  if (!integration.refresh_token) {
    throw new Error("Gmail token expired. Please reconnect your account.");
  }

  const tokens = await refreshAccessToken(integration.refresh_token);
  const supabase = await createClient();

  await supabase
    .from("google_integrations")
    .update({
      access_token: tokens.access_token,
      token_expires_at: new Date(
        Date.now() + tokens.expires_in * 1000
      ).toISOString(),
      ...(tokens.refresh_token
        ? { refresh_token: tokens.refresh_token }
        : {}),
    })
    .eq("id", integration.id);

  return tokens.access_token;
}

export async function isGmailConnected(userId: string): Promise<boolean> {
  const integration = await getGoogleIntegration(userId);
  return integration !== null;
}
