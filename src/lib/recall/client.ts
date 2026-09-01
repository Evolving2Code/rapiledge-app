const DEFAULT_REGION = process.env.RECALL_REGION || "us-west-2";

function recallHost() {
  return `https://${DEFAULT_REGION}.recall.ai`;
}

export function recallConfigured() {
  return Boolean(process.env.RECALL_API_KEY);
}

async function recallFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${recallHost()}${path}`, {
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
  return recallFetch("/api/v1/bot/", {
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
  return recallFetch(`/api/v1/bot/${botId}/`);
}

export type RecallCalendar = {
  id: string;
  platform?: string;
  status?: string;
};

export type RecallCalendarEvent = {
  id: string;
  start_time?: string;
  end_time?: string;
  meeting_url?: string | null;
  title?: string;
  raw?: {
    summary?: string;
    attendees?: ({ email?: string; emailAddress?: string } | string)[];
  };
  attendees?: ({ email?: string; emailAddress?: string } | string)[];
  bots?: { bot_id?: string }[];
};

export async function listCalendars() {
  return recallFetch("/api/v2/calendars/") as Promise<{
    results?: RecallCalendar[];
  }>;
}

export async function listCalendarEvents(calendarId: string) {
  const url = `/api/v2/calendar-events/?calendar_id=${encodeURIComponent(calendarId)}`;
  return recallFetch(url) as Promise<{ results?: RecallCalendarEvent[] }>;
}

export async function scheduleCalendarBot(eventId: string) {
  return recallFetch(`/api/v2/calendar-events/${eventId}/bot/`, {
    method: "POST",
    body: JSON.stringify({
      deduplication_key: `rapiledge:${eventId}`,
      bot_config: {
        bot_name: "RapiLedge Notetaker",
        recording_config: {
          transcript: { provider: { meeting_captions: {} } },
        },
      },
    }),
  }) as Promise<{
    id?: string;
    bot_id?: string;
    meeting_url?: string | null;
  }>;
}

export async function createCalendarAuth(redirectUrl: string) {
  return recallFetch("/api/v1/calendar/authenticate/", {
    method: "POST",
    body: JSON.stringify({ oauth_email_redirect_url: redirectUrl }),
  }) as Promise<{ oauth_url?: string; url?: string }>;
}
