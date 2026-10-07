import { useEffect, useState } from "react";
import { chatApi } from "../lib/auth";

type Stats = { users: number; conversations: number; messages: number; messages24h: number };

export function Overview() {
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    chatApi<Stats>("/admin/stats").then(setS).catch((e: Error) => setErr(e.message));
  }, []);

  if (err) return <p className="error">Couldn't load stats ({err}). Is hvr-chat running, and have you signed out and in since becoming admin?</p>;
  if (!s) return <p className="muted">Loading…</p>;

  const rows: [string, number][] = [
    ["People who have used chat", s.users],
    ["Conversations", s.conversations],
    ["Messages, all time", s.messages],
    ["Messages, last 24 hours", s.messages24h],
  ];
  return (
    <dl className="stats">
      {rows.map(([label, n]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{n.toLocaleString()}</dd>
        </div>
      ))}
    </dl>
  );
}
