import type { Channel } from "@/lib/types";

export const FORUMS_PER_PAGE = 50;
export const POSTS_PER_PAGE = 100;

export function formatTimestamp(value: number | null) {
  if (!value) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(value * 1000);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count.toLocaleString()} ${count === 1 ? singular : plural}`;
}

export function parsePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function excerpt(text: string | null, maxLength = 180) {
  if (!text) {
    return "";
  }

  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact.slice(0, maxLength - 1)}…`;
}

export function buildChannelTrail(channelId: number, channels: Channel[]) {
  const byId = new Map(channels.map((channel) => [channel.nodeid, channel]));
  const trail: Channel[] = [];
  let current = byId.get(channelId);

  while (current) {
    trail.push(current);
    if (current.parentid < 0 || current.parentid === current.nodeid) {
      break;
    }
    current = byId.get(current.parentid);
  }

  return trail.reverse();
}
