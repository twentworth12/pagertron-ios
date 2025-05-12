-- Create high_scores table
CREATE TABLE high_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  level INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster sorting by score
CREATE INDEX idx_high_scores_score ON high_scores(score DESC);

-- Set up row-level security
ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read high scores
CREATE POLICY "Anyone can read high scores" 
  ON high_scores FOR SELECT USING (true);

-- Create policy to allow anyone to insert high scores
CREATE POLICY "Anyone can insert high scores" 
  ON high_scores FOR INSERT WITH CHECK (true);

-- Optional: Create a function to limit to 10 high scores
CREATE OR REPLACE FUNCTION maintain_top_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- After inserting a new score, delete excess scores beyond top 10
  DELETE FROM high_scores
  WHERE id IN (
    SELECT id FROM high_scores
    ORDER BY score DESC, created_at ASC
    OFFSET 10
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run after each insert
CREATE TRIGGER trigger_maintain_top_scores
AFTER INSERT ON high_scores
FOR EACH STATEMENT
EXECUTE FUNCTION maintain_top_scores();