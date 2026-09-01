import { createAdminClient } from "@/lib/supabase/admin";

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
].join(" ");

type TokenSet = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
};

export function gmailConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
}

export function gmailRedirectUri() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/gmail/callback`;
}

export function gmailAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: gmailRedirectUri(),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: GMAIL_SCOPES,
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<TokenSet> {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: gmailRedirectUri(),
    grant_type: "authorization_code",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${await res.text()}`);
  }
  return res.json();
}

async function refreshAccessToken(refreshToken: string): Promise<TokenSet> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Google refresh failed: ${await res.text()}`);
  }
  return res.json();
}

export async function getGmailAccessToken(ownerId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("provider", "gmail")
    .maybeSingle();
  if (error || !data?.access_token) {
    throw new Error("Gmail is not connected.");
  }

  const expiresAt = data.expires_at ? new Date(data.expires_at).getTime() : 0;
  if (expiresAt - Date.now() > 60_000) {
    return data.access_token as string;
  }
  if (!data.refresh_token) {
    throw new Error("Gmail refresh token missing. Reconnect Gmail.");
  }
  const refreshed = await refreshAccessToken(data.refresh_token);
  const nextExpiry = new Date(
    Date.now() + (refreshed.expires_in ?? 3600) * 1000,
  ).toISOString();
  await supabase
    .from("integrations")
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token ?? data.refresh_token,
      expires_at: nextExpiry,
    })
    .eq("id", data.id);
  return refreshed.access_token;
}

function encodeRawEmail(from: string, to: string, subject: string, body: string) {
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ].join("\r\n");
  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendGmail(options: {
  ownerId: string;
  to: string;
  subject: string;
  body: string;
}) {
  const token = await getGmailAccessToken(options.ownerId);
  const profileRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/profile",
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const profile = (await profileRes.json()) as { emailAddress?: string };
  const raw = encodeRawEmail(
    profile.emailAddress ?? "",
    options.to,
    options.subject,
    options.body,
  );
  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    },
  );
  if (!res.ok) {
    throw new Error(`Gmail send failed: ${await res.text()}`);
  }
  return res.json() as Promise<{ id: string; threadId: string }>;
}

export async function startGmailWatch(ownerId: string) {
  const topic = process.env.GMAIL_PUBSUB_TOPIC;
  if (!topic) {
    throw new Error("GMAIL_PUBSUB_TOPIC is not set.");
  }
  const token = await getGmailAccessToken(ownerId);
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/watch", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topicName: topic,
      labelIds: ["INBOX"],
    }),
  });
  if (!res.ok) {
    throw new Error(`Gmail watch failed: ${await res.text()}`);
  }
  const data = (await res.json()) as { historyId: string; expiration: string };
  const supabase = createAdminClient();
  await supabase.from("gmail_watches").upsert(
    {
      owner_id: ownerId,
      history_id: data.historyId,
      expiration: new Date(Number(data.expiration)).toISOString(),
      topic_name: topic,
    },
    { onConflict: "owner_id" },
  );
  return data;
}

export async function listHistory(ownerId: string, startHistoryId: string) {
  const token = await getGmailAccessToken(ownerId);
  const url = new URL(
    "https://gmail.googleapis.com/gmail/v1/users/me/history",
  );
  url.searchParams.set("startHistoryId", startHistoryId);
  url.searchParams.set("historyTypes", "messageAdded");
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Gmail history failed: ${await res.text()}`);
  }
  return res.json() as Promise<{
    history?: { messagesAdded?: { message: { id: string; threadId: string } }[] }[];
    historyId?: string;
  }>;
}

export async function getGmailMessage(ownerId: string, messageId: string) {
  const token = await getGmailAccessToken(ownerId);
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    throw new Error(`Gmail message failed: ${await res.text()}`);
  }
  return res.json() as Promise<{
    id: string;
    threadId: string;
    snippet?: string;
    internalDate?: string;
    payload?: {
      headers?: { name: string; value: string }[];
      body?: { data?: string };
      parts?: { mimeType?: string; body?: { data?: string } }[];
    };
  }>;
}

function decodePart(data?: string) {
  if (!data) return "";
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
    "utf8",
  );
}

export function parseGmailMessage(message: Awaited<ReturnType<typeof getGmailMessage>>) {
  const headers = message.payload?.headers ?? [];
  const get = (name: string) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
  let body = decodePart(message.payload?.body?.data);
  if (!body && message.payload?.parts) {
    const text = message.payload.parts.find((p) => p.mimeType === "text/plain");
    body = decodePart(text?.body?.data);
  }
  const from = get("From");
  const emailMatch = from.match(/<([^>]+)>/);
  return {
    id: message.id,
    threadId: message.threadId,
    snippet: message.snippet ?? "",
    subject: get("Subject"),
    from,
    fromEmail: (emailMatch?.[1] || from).trim().toLowerCase(),
    to: get("To"),
    body,
    date: message.internalDate
      ? new Date(Number(message.internalDate)).toISOString()
      : new Date().toISOString(),
  };
}
