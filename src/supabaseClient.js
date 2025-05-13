// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// In Vite, environment variables are accessed via import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Mock client for development or when credentials are missing
const mockClient = {
  from: (table) => ({
    insert: (data) => ({
      select: () => Promise.resolve({ data: data || [], error: null })
    }),
    select: () => Promise.resolve({
      data: [
        { id: 1, player_name: 'Player 1', score: 100, level: 5 },
        { id: 2, player_name: 'Player 2', score: 90, level: 4 },
        { id: 3, player_name: 'Player 3', score: 80, level: 4 }
      ],
      error: null
    }),
    order: () => ({
      limit: () => Promise.resolve({
        data: [
          { id: 1, player_name: 'Player 1', score: 100, level: 5 },
          { id: 2, player_name: 'Player 2', score: 90, level: 4 },
          { id: 3, player_name: 'Player 3', score: 80, level: 4 }
        ],
        error: null
      })
    })
  })
};

// Create the client or use mock
let supabase;

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("Connected to Supabase");
  } else {
    console.warn("Supabase credentials missing, using mock client. High scores won't be saved.");
    supabase = mockClient;
  }
} catch (error) {
  console.error("Error initializing Supabase:", error);
  supabase = mockClient;
}

export { supabase };