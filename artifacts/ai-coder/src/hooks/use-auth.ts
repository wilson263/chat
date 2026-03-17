import { useState, useEffect } from 'react';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
}

let globalUser: AuthUser | null = null;
let listeners: Array<(user: AuthUser | null) => void> = [];

function notify(user: AuthUser | null) {
  globalUser = user;
  listeners.forEach(fn => fn(user));
}

export async function fetchMe(): Promise<AuthUser | null> {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) { notify(null); return null; }
    const user = await res.json();
    notify(user);
    return user;
  } catch {
    notify(null);
    return null;
  }
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  notify(data);
  return data;
}

export async function register(name: string, email: string, password: string): Promise<AuthUser> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  notify(data);
  return data;
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  notify(null);
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(globalUser);
  const [loading, setLoading] = useState(globalUser === null);

  useEffect(() => {
    listeners.push(setUser);
    if (globalUser === null) {
      fetchMe().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    return () => { listeners = listeners.filter(fn => fn !== setUser); };
  }, []);

  return { user, loading };
}
