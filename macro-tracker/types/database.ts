// Placeholder - will be replaced with generated types if needed
export type Database = {
  public: {
    Tables: {
      // Add table types here or generate with Supabase CLI
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
