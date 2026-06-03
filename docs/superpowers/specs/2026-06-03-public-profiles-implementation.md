# Public Profiles & Stats Card Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to view profiles of other players via a dynamic route `/profile/[id]` and view a summary card of the selected player in the history personal tab.

**Architecture:** Add a new server action `getPlayerProfileById` to retrieve arbitrary profiles by ID. Update `ProfileView` client component to support a `readOnly` state. Create Next.js server route `/profile/[id]/page.tsx` that renders `ProfileView` in read-only mode. Inject a Profile Overview card in `PersonalTab` statistics view.

**Tech Stack:** Next.js (App Router), Supabase SSR, React (TypeScript), Tailwind CSS / Vanilla CSS.

---

### Task 1: Add `getPlayerProfileById` Server Action

**Files:**
- Modify: `src/actions/players.ts`

- [ ] **Step 1: Export the `getPlayerProfileById` function**
  Add the following implementation to `src/actions/players.ts`:
  ```typescript
  export async function getPlayerProfileById(
    playerId: string
  ): Promise<Profile | null> {
    const profile = await getCurrentProfile();
    if (!profile) return null;

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", playerId)
      .single();

    if (error) {
      console.error("Error fetching player profile by id:", error.message);
      return null;
    }

    return data;
  }
  ```

- [ ] **Step 2: Verify code compiling**
  Run: `npm run build`
  Expected: No TypeScript errors or compilation errors related to `src/actions/players.ts`.

---

### Task 2: Update `ProfileView` client component

**Files:**
- Modify: `src/components/profile/ProfileView.tsx`

- [ ] **Step 1: Update signature and add readOnly prop**
  Replace lines 7-9 of `src/components/profile/ProfileView.tsx` with:
  ```tsx
  export default function ProfileView({ 
    initialProfile, 
    readOnly = false 
  }: { 
    initialProfile: Profile; 
    readOnly?: boolean; 
  }) {
    const [profile, setProfile] = useState(initialProfile);
    const [isEditing, setIsEditing] = useState(false);
  ```

- [ ] **Step 2: Update header and conditional buttons**
  Replace lines 40-75 of `src/components/profile/ProfileView.tsx` with the following block:
  ```tsx
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in space-y-8">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="section-heading !mb-0">
            <h1 className="text-3xl sm:text-4xl m-0 text-[var(--text-primary)] uppercase">
              {readOnly ? `PERFIL DE ${profile.username.toUpperCase()}` : 'MI PERFIL'}
            </h1>
          </div>
          
          {!readOnly && (
            isEditing ? (
              <div className="flex gap-3">
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="btn-danger"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-lime"
                >
                  {saving ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-outline-lime"
              >
                Editar Perfil
              </button>
            )
          )}
        </div>
  ```

- [ ] **Step 3: Verify component renders correctly**
  Run: `npm run build`
  Expected: Successful compilation without errors.

---

### Task 3: Create Dynamic Route `/profile/[id]`

**Files:**
- Create: `src/app/profile/[id]/page.tsx`

- [ ] **Step 1: Implement the dynamic public profile page server component**
  Write the following content to `src/app/profile/[id]/page.tsx`:
  ```tsx
  import { getPlayerProfileById } from '@/actions/players';
  import { getCurrentProfile } from '@/actions/auth';
  import { redirect, notFound } from 'next/navigation';
  import ProfileView from '@/components/profile/ProfileView';

  export const dynamic = 'force-dynamic';

  interface Props {
    params: {
      id: string;
    };
  }

  export default async function PublicProfilePage({ params }: Props) {
    const currentUser = await getCurrentProfile();
    if (!currentUser) {
      redirect('/auth/login');
    }

    const targetProfile = await getPlayerProfileById(params.id);
    if (!targetProfile) {
      notFound();
    }

    // Permitir edición si entra a su propio ID
    const isOwnProfile = currentUser.id === targetProfile.id;

    return <ProfileView initialProfile={targetProfile} readOnly={!isOwnProfile} />;
  }
  ```

- [ ] **Step 2: Verify Page compiles**
  Run: `npm run build`
  Expected: Successful compilation.

---

### Task 4: Integrate Profile Overview Card in `PersonalTab.tsx`

**Files:**
- Modify: `src/components/history/PersonalTab.tsx`

- [ ] **Step 1: Add Next.js Link import**
  Add the following import at the top of `src/components/history/PersonalTab.tsx`:
  ```typescript
  import Link from "next/link";
  ```

- [ ] **Step 2: Render Profile Card beneath player selector**
  Find the following code block in `PersonalTab.tsx`:
  ```tsx
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* 1. Player selector */}
        {renderPlayerSelector()}
  ```
  Immediately after `{renderPlayerSelector()}`, add the profile card rendering logic:
  ```tsx
        {/* Profile Info Card */}
        {selectedPlayer?.profile && (
          <div
            className="card-sport animate-slide-up"
            style={{
              padding: "1.25rem",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1.5rem",
              flexWrap: "wrap",
              marginTop: "0.25rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
              {/* Avatar */}
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "var(--accent-lime-soft)",
                  border: "1.5px solid rgba(0,230,118,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {selectedPlayer.profile.avatar_url ? (
                  <img
                    src={selectedPlayer.profile.avatar_url}
                    alt={selectedPlayer.profile.username}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", color: "var(--accent-lime)" }}>
                    {selectedPlayer.profile.username?.[0]?.toUpperCase() ?? "?"}
                  </span>
                )}
              </div>

              {/* Username & Bio */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", maxWidth: "450px" }}>
                <h3
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "1.6rem",
                    margin: 0,
                    color: "#e4f0e8",
                    letterSpacing: "0.05em",
                  }}
                >
                  {selectedPlayer.profile.username}
                </h3>
                <p
                  style={{
                    fontFamily: "'Barlow', sans-serif",
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    margin: 0,
                    lineHeight: "1.3",
                  }}
                >
                  {selectedPlayer.profile.bio || <span style={{ fontStyle: "italic", opacity: 0.6 }}>Sin biografía</span>}
                </p>
              </div>
            </div>

            {/* Positions & Link Button */}
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
              {selectedPlayer.profile.favorite_positions && selectedPlayer.profile.favorite_positions.length > 0 && (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {selectedPlayer.profile.favorite_positions.map((pos) => (
                    <span
                      key={pos}
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "var(--accent-lime)",
                        background: "rgba(0, 230, 118, 0.15)",
                        border: "1px solid var(--accent-lime)",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {pos}
                    </span>
                  ))}
                </div>
              )}

              <Link
                href={`/profile/${selectedPlayer.profile.id}`}
                className="btn-outline-lime"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  padding: "0.4rem 0.85rem",
                  borderRadius: "6px",
                  letterSpacing: "0.05em",
                  textDecoration: "none",
                  display: "inline-block",
                  lineHeight: "normal"
                }}
              >
                Ver Perfil Completo
              </Link>
            </div>
          </div>
        )}
  ```

- [ ] **Step 3: Verify compilation**
  Run: `npm run build`
  Expected: Successful compilation without errors.
