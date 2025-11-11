// Database types with subscription fields
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth_id: string;
          email: string;
          full_name: string | null;
          account_tier: 'free' | 'trial' | 'premium';
          ai_messages_used: number;
          ai_messages_limit: number;
          email_verified_at: string | null;
          stripe_customer_id: string | null;
          trial_started_at: string | null;
          trial_ends_at: string | null;
          subscription_status: string | null;
          subscription_current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
    };
    Functions: {
      can_user_send_ai_message: {
        Args: { p_user_id: string };
        Returns: {
          can_send: boolean;
          reason: string | null;
          messages_remaining: number;
        };
      };
      increment_ai_message_usage: {
        Args: {
          p_user_id: string;
          p_input_tokens: number;
          p_output_tokens: number;
          p_model_name: string;
        };
        Returns: void;
      };
    };
  };
};

export type UserSettings = {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'auto';
  measurement_units: 'metric' | 'imperial';
  first_day_of_week: number;
  created_at: string;
  updated_at: string;
};
