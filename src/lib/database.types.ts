export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          pseudo: string
          email_newsletter: boolean
          level: number
          experience_points: number
          role: 'user' | 'admin'
          published_quiz_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          pseudo: string
          email_newsletter?: boolean
          level?: number
          experience_points?: number
          role?: 'user' | 'admin'
          published_quiz_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pseudo?: string
          email_newsletter?: boolean
          level?: number
          experience_points?: number
          role?: 'user' | 'admin'
          published_quiz_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      badges: {
        Row: {
          id: string
          name: string
          description: string
          icon: string
          requirement_type: string
          requirement_value: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon?: string
          requirement_type: string
          requirement_value: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string
          requirement_type?: string
          requirement_value?: number
          created_at?: string
        }
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_id: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_id?: string
          earned_at?: string
        }
      }
      titles: {
        Row: {
          id: string
          name: string
          description: string
          requirement_type: string
          requirement_value: number
          is_special: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          requirement_type: string
          requirement_value: number
          is_special?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          requirement_type?: string
          requirement_value?: number
          is_special?: boolean
          created_at?: string
        }
      }
      user_titles: {
        Row: {
          id: string
          user_id: string
          title_id: string
          is_active: boolean
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title_id: string
          is_active?: boolean
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title_id?: string
          is_active?: boolean
          earned_at?: string
        }
      }
      quizzes: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string | null
          category: 'flags' | 'capitals' | 'maps' | 'borders' | 'regions' | 'mixed'
          is_public: boolean
          is_global: boolean
          difficulty: 'easy' | 'medium' | 'hard'
          time_limit_seconds: number | null
          total_plays: number
          average_score: number
          created_at: string
          published_at: string | null
          is_reported: boolean
          report_count: number
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          description?: string | null
          category: 'flags' | 'capitals' | 'maps' | 'borders' | 'regions' | 'mixed'
          is_public?: boolean
          is_global?: boolean
          difficulty?: 'easy' | 'medium' | 'hard'
          time_limit_seconds?: number | null
          total_plays?: number
          average_score?: number
          created_at?: string
          published_at?: string | null
          is_reported?: boolean
          report_count?: number
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string
          description?: string | null
          category?: 'flags' | 'capitals' | 'maps' | 'borders' | 'regions' | 'mixed'
          is_public?: boolean
          is_global?: boolean
          difficulty?: 'easy' | 'medium' | 'hard'
          time_limit_seconds?: number | null
          total_plays?: number
          average_score?: number
          created_at?: string
          published_at?: string | null
          is_reported?: boolean
          report_count?: number
        }
      }
      questions: {
        Row: {
          id: string
          quiz_id: string
          question_text: string
          question_type: 'mcq' | 'single_answer' | 'map_click' | 'text_free'
          correct_answer: string
          options: Json | null
          map_data: Json | null
          points: number
          order_index: number
          created_at: string
          complement_if_wrong?: string;
        }
        Insert: {
          id?: string
          quiz_id: string
          question_text: string
          question_type: 'mcq' | 'single_answer' | 'map_click' | 'text_free'
          correct_answer: string
          options?: Json | null
          map_data?: Json | null
          points?: number
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          question_text?: string
          question_type?: 'mcq' | 'single_answer' | 'map_click' | 'text_free'
          correct_answer?: string
          options?: Json | null
          map_data?: Json | null
          points?: number
          order_index?: number
          created_at?: string
        }
      }
      game_sessions: {
        Row: {
          id: string
          quiz_id: string
          player_id: string
          mode: 'solo' | 'duel'
          score: number
          accuracy_percentage: number
          time_taken_seconds: number
          completed: boolean
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          quiz_id: string
          player_id: string
          mode?: 'solo' | 'duel'
          score?: number
          accuracy_percentage?: number
          time_taken_seconds?: number
          completed?: boolean
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          quiz_id?: string
          player_id?: string
          mode?: 'solo' | 'duel'
          score?: number
          accuracy_percentage?: number
          time_taken_seconds?: number
          completed?: boolean
          started_at?: string
          completed_at?: string | null
        }
      }
      game_answers: {
        Row: {
          id: string
          session_id: string
          question_id: string
          user_answer: string
          is_correct: boolean
          time_taken_seconds: number
          points_earned: number
          answered_at: string
        }
        Insert: {
          id?: string
          session_id: string
          question_id: string
          user_answer: string
          is_correct: boolean
          time_taken_seconds: number
          points_earned?: number
          answered_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          question_id?: string
          user_answer?: string
          is_correct?: boolean
          time_taken_seconds?: number
          points_earned?: number
          answered_at?: string
        }
      }
      duels: {
        Row: {
          id: string
          quiz_id: string
          player1_id: string
          player2_id: string
          player1_session_id: string | null
          player2_session_id: string | null
          winner_id: string | null
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          created_at: string
          started_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          quiz_id: string
          player1_id: string
          player2_id: string
          player1_session_id?: string | null
          player2_session_id?: string | null
          winner_id?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          quiz_id?: string
          player1_id?: string
          player2_id?: string
          player1_session_id?: string | null
          player2_session_id?: string | null
          winner_id?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
      }
      friendships: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          accepted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          accepted_at?: string | null
        }
      }
      duel_invitations: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          quiz_id: string
          status: 'pending' | 'accepted' | 'declined' | 'expired'
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          quiz_id: string
          status?: 'pending' | 'accepted' | 'declined' | 'expired'
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          quiz_id?: string
          status?: 'pending' | 'accepted' | 'declined' | 'expired'
          created_at?: string
          expires_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          message?: string
          is_read?: boolean
          created_at?: string
        }
      }
      quiz_shares: {
        Row: {
          id: string
          quiz_id: string
          shared_by_user_id: string
          shared_with_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          shared_by_user_id: string
          shared_with_user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          shared_by_user_id?: string
          shared_with_user_id?: string
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          quiz_id: string | null
          message_id: string | null
          reason: string
          description: string | null
          status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          reviewed_by: string | null
          created_at: string
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          reporter_id: string
          quiz_id?: string | null
          message_id?: string | null
          reason: string
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          reviewed_by?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
        Update: {
          id?: string
          reporter_id?: string
          quiz_id?: string | null
          message_id?: string | null
          reason?: string
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          reviewed_by?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
      }
      password_reset_tokens: {
        Row: {
          id: string
          user_id: string
          token: string
          expires_at: string
          used: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          expires_at: string
          used?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          expires_at?: string
          used?: boolean
          created_at?: string
        }
      }
    }
  }
}
