# Supabase Setup for High Scores

Follow these steps to set up the required database table in Supabase for storing high scores.

## Prerequisites

1. You need a Supabase account and a project set up.
2. You should have the Supabase URL and Anon Key for your project.

## Environment Variables

Make sure you have the following environment variables set in your project:

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For local development, you can create a `.env` file in the root of your project with these variables.

## Create High Scores Table

1. Go to your Supabase Dashboard and select your project.
2. Navigate to the SQL Editor section.
3. Create a new query and paste the following SQL:

```sql
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
```

4. Execute the query to create the table, indexes, policies, and triggers.

## Test the Setup

After setting up your Supabase database, run your application and test the high score functionality:

1. Play the game and get a score
2. When the game ends, the high score modal should appear
3. Enter your name and submit your score
4. Verify that your score appears in the top scores list

## Troubleshooting

If you encounter issues:

1. Check the browser console for error messages
2. Verify that your environment variables are correctly set
3. Check that your Supabase policies allow for the operations you're trying to perform
4. Verify the table structure matches what the application expects