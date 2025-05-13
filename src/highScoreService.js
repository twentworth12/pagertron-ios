// highScoreService.js
import { supabase } from './supabaseClient';

/**
 * Saves a high score to the database
 * @param {string} playerName - The name of the player
 * @param {number} score - The score achieved
 * @param {number} level - The level reached
 * @returns {Promise} - Promise resolving to the saved score data
 */
export const saveHighScore = async (playerName, score, level) => {
  try {
    const { data, error } = await supabase
      .from('high_scores_anthropic')
      .insert([
        { player_name: playerName, score, level }
      ])
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving high score:', error);
    return null;
  }
};

/**
 * Gets the top 10 high scores from the database
 * @returns {Promise} - Promise resolving to array of high scores
 */
export const getTopHighScores = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('high_scores_anthropic')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching high scores:', error);
    return [];
  }
};

/**
 * Checks if a score qualifies for the top 10
 * @param {number} score - The score to check
 * @returns {Promise<boolean>} - Whether the score qualifies
 */
export const isTopScore = async (score) => {
  try {
    const topScores = await getTopHighScores();

    // If we have fewer than 10 scores, any score qualifies
    if (topScores.length < 10) return true;

    // Otherwise, check if this score is higher than the lowest top score
    const lowestTopScore = topScores[topScores.length - 1].score;
    return score > lowestTopScore;
  } catch (error) {
    console.error('Error checking if score qualifies:', error);
    return false;
  }
};