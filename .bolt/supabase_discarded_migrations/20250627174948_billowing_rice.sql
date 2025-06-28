/*
  # Create notes table for business analysis comments

  1. New Tables
    - `notes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `user_data_id` (uuid, foreign key to user_data, optional)
      - `title` (text)
      - `content` (text)
      - `tags` (text array, optional)
      - `is_pinned` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `notes` table
    - Add policy for authenticated users to manage their own notes

  3. Indexes
    - Index on user_id for performance
    - Index on created_at for sorting
    - Index on user_data_id for filtering by analysis
*/

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_data_id uuid REFERENCES user_data(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  tags text[] DEFAULT '{}',
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only access their own notes
CREATE POLICY "Users can manage their own notes"
  ON notes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes(user_id);
CREATE INDEX IF NOT EXISTS notes_created_at_idx ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS notes_user_data_id_idx ON notes(user_data_id);
CREATE INDEX IF NOT EXISTS notes_is_pinned_idx ON notes(is_pinned) WHERE is_pinned = true;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();