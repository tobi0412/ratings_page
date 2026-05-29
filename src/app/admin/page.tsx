'use client';

import {
  createSession,
  closeSession,
  getAllSessions,
  getActiveSessions,
} from '@/actions/sessions';
import { MatchSession } from '@/types';
import { useEffect, useState } from 'react';

export default function AdminPage() {
  const [sessions, setSessions] = useState<MatchSession[]>([]);
  const [activeSession, setActiveSession] = useState<MatchSession | null>(null);
  const [newSessionName, setNewSessionName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    const [all, active] = await Promise.all([
      getAllSessions(),
      getActiveSessions(),
    ]);
    setSessions(all);
    setActiveSession(active.length > 0 ? active[0] : null);
  }

  async function handleCreateSession() {
    if (!newSessionName.trim()) {
      alert('El nombre de la sesión no puede estar vacío');
      return;
    }

    setLoading(true);
    const result = await createSession(newSessionName);

    if (result.error) {
      alert('Error: ' + result.error);
    } else {
      setNewSessionName('');
      await loadSessions();
    }
    setLoading(false);
  }

  async function handleCloseSession() {
    if (!activeSession) return;

    if (!confirm('¿Estás seguro de que quieres cerrar esta sesión?')) {
      return;
    }

    setLoading(true);
    const result = await closeSession(activeSession.id);

    if (result.error) {
      alert('Error: ' + result.error);
    } else {
      await loadSessions();
    }
    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <h1 className="text-3xl font-bold">Panel de Admin</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-bold">Crear Nueva Sesión</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            placeholder="Ej: Fecha 5, Amistoso vs X"
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <button
            onClick={handleCreateSession}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Crear
          </button>
        </div>
      </div>

      {activeSession && (
        <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200 space-y-4">
          <h2 className="text-xl font-bold text-green-900">Sesión Activa</h2>
          <div>
            <p className="font-bold text-lg">{activeSession.name}</p>
            <p className="text-sm text-gray-600">
              Comenzó: {new Date(activeSession.created_at).toLocaleString()}
            </p>
          </div>
          <button
            onClick={handleCloseSession}
            disabled={loading}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            Cerrar Sesión
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-bold">Historial de Sesiones</h2>
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex justify-between items-center p-3 bg-gray-50 rounded"
            >
              <div>
                <p className="font-medium">{session.name}</p>
                <p className="text-sm text-gray-600">
                  {new Date(session.created_at).toLocaleString()}
                </p>
                {session.closed_at && (
                  <p className="text-sm text-gray-600">
                    Cerrada: {new Date(session.closed_at).toLocaleString()}
                  </p>
                )}
              </div>
              <div>
                <span
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    session.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {session.is_active ? 'Activa' : 'Cerrada'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
