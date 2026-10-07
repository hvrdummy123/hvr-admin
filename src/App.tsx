import { useState, type FormEvent } from "react";
import { authClient, clearToken } from "./lib/auth";
import { Messages } from "./pages/Messages";
import { Overview } from "./pages/Overview";
import { Users } from "./pages/Users";

type Tab = "overview" | "users" | "messages";

function Login({ denied }: { denied?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await authClient.signIn.email({ email, password });
    if (res.error) setError(res.error.message ?? "Couldn't sign in");
  }

  return (
    <main className="login">
      <form onSubmit={submit}>
        <h1>HVR Admin</h1>
        {denied && (
          <p className="error" role="alert">
            This account isn't an admin. Run <code>npm run make-admin -- your@email</code> in hvr-auth, then sign in again.
          </p>
        )}
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary">Sign in</button>
      </form>
    </main>
  );
}

export default function App() {
  const { data, isPending } = authClient.useSession();
  const [tab, setTab] = useState<Tab>("overview");

  if (isPending) return <main className="login"><p className="muted">Loading…</p></main>;
  if (!data?.user) return <Login />;
  const user = data.user as typeof data.user & { role?: string };
  if (user.role !== "admin") {
    return (
      <>
        <Login denied />
        <p className="center"><button className="link" onClick={() => authClient.signOut()}>Sign out of {user.email}</button></p>
      </>
    );
  }

  return (
    <div className="shell">
      <nav>
        <strong>HVR Admin</strong>
        {(["overview", "users", "messages"] as Tab[]).map((t) => (
          <button key={t} className={t === tab ? "tab active" : "tab"} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
        <span className="spacer" />
        <span className="muted small">{user.email}</span>
        <button className="link" onClick={async () => { clearToken(); await authClient.signOut(); }}>Sign out</button>
      </nav>
      <main>
        {tab === "overview" && <Overview />}
        {tab === "users" && <Users meId={user.id} />}
        {tab === "messages" && <Messages />}
      </main>
    </div>
  );
}
