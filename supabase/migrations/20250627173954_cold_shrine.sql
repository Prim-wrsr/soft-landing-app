/*
  # Create user_data table for storing business analysis data

  1. New Tables
    - `user_data`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `business_type` (text)
      - `file_name` (text)
      - `data` (jsonb) - stores the parsed business data
      - `mapped_columns` (jsonb) - stores column mapping configuration
      - `health_score` (integer) - data quality score
      - `is_clean` (boolean) - whether data has been cleaned
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_data` table
    - Add policy for users to only access their own data
*/

CREATE TABLE IF NOT EXISTS user_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_type text NOT NULL,
  file_name text NOT NULL,
  data jsonb NOT NULL DEFAULT '[]'::jsonb,
  mapped_columns jsonb NOT NULL DEFAULT '{}'::jsonb,
  health_score integer DEFAULT 0 CHECK (health_score >= 0 AND health_score <= 100),
  is_clean boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only access their own data
CREATE POLICY "Users can manage their own data"
  ON user_data
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS user_data_user_id_idx ON user_data(user_id);
CREATE INDEX IF NOT EXISTS user_data_created_at_idx ON user_data(created_at DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_data_updated_at
  BEFORE UPDATE ON user_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();