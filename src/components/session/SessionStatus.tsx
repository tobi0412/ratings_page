'use client';

import { MatchSession } from '@/types';

interface SessionStatusProps {
  session: MatchSession | null;
}

export default function SessionStatus({ session }: SessionStatusProps) {
  if (!session) {
    return (
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <p className="text-sm text-yellow-800">
          No hay sesión activa. Espera a que el admin cree una.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
      <h2 className="font-bold text-lg text-green-900">Sesión Activa</h2>
      <p className="text-sm text-green-700">{session.name}</p>
      <p className="text-xs text-green-600 mt-1">
        Comenzó: {new Date(session.created_at).toLocaleString()}
      </p>
    </div>
  );
}
