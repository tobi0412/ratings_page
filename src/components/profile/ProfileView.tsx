'use client';
import React, { useState } from 'react';
import FootballField from './FootballField';
import { Profile } from '@/types';
import { updatePlayerProfile } from '@/actions/players';

export default function ProfileView({ 
  initialProfile,
  readOnly = false 
}: { 
  initialProfile: Profile;
  readOnly?: boolean;
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(initialProfile.bio || '');
  const [positions, setPositions] = useState<string[]>(initialProfile.favorite_positions || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const { error: saveError } = await updatePlayerProfile(bio, positions);
      if (saveError) throw new Error(saveError);
      
      setProfile({ ...profile, bio, favorite_positions: positions });
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Error guardando el perfil');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setBio(profile.bio || '');
    setPositions(profile.favorite_positions || []);
    setIsEditing(false);
    setError('');
  };

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

      {error && (
        <div className="p-3 rounded-lg bg-[var(--accent-red-soft)] border border-[rgba(255,82,82,0.3)] text-[var(--accent-red)] font-['Barlow'] text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Player Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card-sport p-6 flex flex-col items-center text-center animate-slide-up stagger-1">
            <div className="relative mb-6">
              <div 
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center overflow-hidden z-10 relative"
                style={{ 
                  background: 'var(--accent-lime-soft)',
                  border: '2px solid rgba(0,230,118,0.4)',
                  boxShadow: '0 0 30px rgba(0, 230, 118, 0.15)'
                }}
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-['Bebas_Neue'] text-5xl sm:text-6xl text-[var(--accent-lime)]">
                    {profile.username?.[0]?.toUpperCase() ?? "?"}
                  </span>
                )}
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl font-['Bebas_Neue'] tracking-wider mb-6 text-[var(--text-primary)]">
              {profile.username}
            </h2>

            <hr className="w-full divider-sport mb-5" />

            <div className="w-full text-left">
              <label className="label-sport block mb-2">
                Biografía
              </label>
              
              {isEditing ? (
                <div className="relative">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 150))}
                    maxLength={150}
                    className="input-sport resize-none h-28"
                    placeholder="Describe tu estilo de juego..."
                  />
                  <div className="absolute bottom-2 right-2 text-xs font-['Barlow_Condensed'] font-bold text-[var(--text-muted)]">
                    {bio.length}/150
                  </div>
                </div>
              ) : (
                <p className="text-[var(--text-primary)] font-['Barlow'] text-[0.95rem] leading-relaxed min-h-[3rem]">
                  {profile.bio || <span className="text-[var(--text-muted)] italic">Aún no hay descripción.</span>}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Football Field */}
        <div className="lg:col-span-7">
          <div className="card-sport p-6 h-full animate-slide-up stagger-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
              <h3 className="text-2xl font-['Bebas_Neue'] tracking-wide text-[var(--text-primary)] m-0">
                Posiciones favoritas
              </h3>
              <div className="font-['Barlow_Condensed'] text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                {positions.length} / 4 SELECCIONADAS
              </div>
            </div>
            
            <div className="w-full flex justify-center">
              <FootballField
                isEditing={isEditing}
                selectedPositions={isEditing ? positions : (profile.favorite_positions || [])}
                onChange={setPositions}
              />
            </div>
            
            {isEditing && (
              <div className="mt-6 text-center font-['Barlow_Condensed'] text-sm text-[var(--accent-lime)] tracking-widest uppercase animate-glow-pulse">
                &gt;&gt; Toca la cancha para actualizar posiciones &lt;&lt;
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
