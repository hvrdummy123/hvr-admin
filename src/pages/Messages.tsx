import { useCallback, useEffect, useState } from "react";
import { chatApi } from "../lib/auth";

type M = { id: string; seq: number; body: string; createdAt: string; deleted: boolean; sender: string; participants: string };

export function Messages() {
  const [rows, setRows] = useState<M[]>([]);
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    chatApi<M[]>("/admin/messages?limit=100").then(setRows).catch((e: Error) => setErr(e.message));
  }, []);
  useEffect(load, [load]);

  async function remove(m: M) {
    if (!confirm("Remove this message for everyone in the conversation?")) return;
    await chatApi(`/admin/messages/${m.id}`, { method: "DELETE" });
    load();
  }

  if (err) return <p className="error">Couldn't load messages ({err}).</p>;
  return (
    <>
      <div className="toolbar"><button onClick={load}>Refresh</button><span className="muted">Newest 100 messages</span></div>
      <table>
        <thead>
          <tr><th>When</th><th>From</th><th>Conversation</th><th>Message</th><th /></tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id}>
              <td>{new Date(m.createdAt).toLocaleString()}</td>
              <td>{m.sender}</td>
              <td>{m.participants}</td>
              <td className="body">{m.deleted ? <em className="muted">Removed: {m.body}</em> : m.body}</td>
              <td>{!m.deleted && <button onClick={() => remove(m)}>Remove</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
