const DEFAULT_REGION = process.env.RECALL_REGION || "us-west-2";

function recallBase() {
  return `https://${DEFAULT_REGION}.recall.ai/api/v1`;
}

export function recallConfigured() {
  return Boolean(process.env.RECALL_API_KEY);
}

async function recallFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${recallBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Token ${process.env.RECALL_API_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Recall.ai ${path} failed: ${await res.text()}`);
  }
  return res.json();
}

export async function createRecallBot(options: {
  meetingUrl: string;
  botName?: string;
}) {
  return recallFetch("/bot/", {
    method: "POST",
    body: JSON.stringify({
      meeting_url: options.meetingUrl,
      bot_name: options.botName ?? "RapiLedge Notetaker",
      recording_config: {
        transcript: {
          provider: {
            meeting_captions: {},
          },
        },
      },
    }),
  }) as Promise<{ id: string; status?: string }>;
}

export async function getRecallBot(botId: string) {
  return recallFetch(`/bot/${botId}/`);
}

export async function listCalendarMeetings() {
  return recallFetch("/calendar/meetings/");
}

export async function createCalendarAuth(redirectUrl: string) {
  return recallFetch("/calendar/authenticate/", {
    method: "POST",
    body: JSON.stringify({ oauth_email_redirect_url: redirectUrl }),
  }) as Promise<{ oauth_url?: string; url?: string }>;
}
