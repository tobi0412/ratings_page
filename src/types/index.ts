export interface Profile {
  id: string;
  auth_id: string;
  username: string;
  role: "admin" | "player";
  status: "pending" | "approved" | "rejected";
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchSession {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  closed_at: string | null;
  is_active: boolean;
}

export interface Rating {
  id: string;
  match_id: string;
  voter_id: string;
  receiver_id: string;
  tecnica: number;
  fisico: number;
  actitud: number;
  vision_juego: number;
  is_mvp: boolean;
  created_at: string;
  updated_at: string;
}

export interface HistoricalRating {
  id: string;
  player_id: string;
  match_id: string;
  avg_tecnica: number | null;
  avg_fisico: number | null;
  avg_actitud: number | null;
  avg_vision_juego: number | null;
  avg_total: number | null;
  mvp_count: number;
  computed_at: string;
}

export interface RatingInput {
  match_id: string;
  receiver_id: string;
  tecnica: number;
  fisico: number;
  actitud: number;
  vision_juego: number;
  is_mvp: boolean;
}
