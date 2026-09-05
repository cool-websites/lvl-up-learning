// auth.js — Supabase authentication
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://pzmfsbajmntwvvvxdlra.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6bWZzYmFqbW50d3Z2dnhkbHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NTUyOTEsImV4cCI6MjA5MjEzMTI5MX0.VSX10eIB7abkAgjh1Bf3WDFfOm8vmMEqS1LVDkuopZE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Sign Up ──────────────────────────────────────────────────────────────────
// Returns { user, error }
export async function signUp(email, password, username) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { username }, // stored in user_metadata
        },
    });
    return { user: data?.user ?? null, error };
}

// ── Log In ───────────────────────────────────────────────────────────────────
// Returns { user, error }
export async function logIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { user: data?.user ?? null, error };
}

// ── Log Out ──────────────────────────────────────────────────────────────────
export async function logOut() {
    await supabase.auth.signOut();
}

// ── Get current session (persists across page reloads) ───────────────────────
// Returns the User object or null
export async function getUser() {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user ?? null;
}

// ── Listen for auth state changes ────────────────────────────────────────────
// callback(user) — user is null when logged out
export function onAuthChange(callback) {
    supabase.auth.onAuthStateChange((_event, session) => {
        callback(session?.user ?? null);
    });
}