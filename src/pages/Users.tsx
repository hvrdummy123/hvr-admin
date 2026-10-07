import { useCallback, useEffect, useState } from "react";
import { authClient } from "../lib/auth";

type U = { id: string; name: string; email: string; role?: string | null; banned?: boolean | null; createdAt: Date | string };

export function Users({ meId }: { meId: string }) {
  const [users, setUsers] = useState<U[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setErr("");
    const { data, error } = await authClient.admin.listUsers({
      query: { limit: 50, sortBy: "createdAt", sortDirection: "desc", ...(q.trim() ? { searchValue: q.trim(), searchField: "email" as const, searchOperator: "contains" as const } : {}) },
    });
    if (error) return setErr(error.message ?? "Couldn't load users");
    setUsers(data.users as unknown as U[]);
    setTotal(data.total);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  async function act(fn: () => Promise<{ error: { message?: string } | null }>, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    const { error } = await fn();
    if (error) setErr(error.message ?? "Action failed");
    await load();
  }

  return (
    <>
      <div className="toolbar">
        <input placeholder="Search by email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search users" />
        <span className="muted">{total} total</span>
      </div>
      {err && <p className="error" role="alert">{err}</p>}
      <table>
        <thead>
          <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role ?? "user"}</td>
              <td>{u.banned ? <span className="error">Banned</span> : "Active"}</td>
              <td className="actions">
                {u.id !== meId && (
                  <>
                    {u.banned ? (
                      <button onClick={() => act(() => authClient.admin.unbanUser({ userId: u.id }))}>Unban</button>
                    ) : (
                      <button onClick={() => act(() => authClient.admin.banUser({ userId: u.id, banReason: "Banned by admin" }), `Ban ${u.email}? They will be signed out everywhere.`)}>Ban</button>
                    )}
                    <button onClick={() => act(() => authClient.admin.setRole({ userId: u.id, role: u.role === "admin" ? "user" : "admin" }), `Change role for ${u.email}?`)}>
                      {u.role === "admin" ? "Remove admin" : "Make admin"}
                    </button>
                    <button onClick={() => act(() => authClient.admin.revokeUserSessions({ userId: u.id }), `Sign ${u.email} out of every device?`)}>Sign out everywhere</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
