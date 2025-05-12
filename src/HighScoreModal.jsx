import React, { useState, useEffect } from 'react';
import { saveHighScore, getTopHighScores, isTopScore } from './highScoreService';

function HighScoreModal({ score, level, onClose, isVisible }) {
  const [playerName, setPlayerName] = useState('');
  const [topScores, setTopScores] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [qualifies, setQualifies] = useState(false);
  const [isTopHighScore, setIsTopHighScore] = useState(false);

  useEffect(() => {
    // Load top scores when component mounts
    loadTopScores();

    // Check if current score qualifies for top 10 and if it's the #1 score
    const checkScoreStatus = async () => {
      try {
        const scores = await getTopHighScores();

        if (!scores || scores.length === 0) {
          // If there are no scores yet, this score qualifies and is top
          setQualifies(true);
          setIsTopHighScore(true);
          return;
        }

        // Sort scores in descending order to be sure
        const sortedScores = [...scores].sort((a, b) => b.score - a.score);

        // Check if the current score qualifies for top 10
        const qualifies = sortedScores.length < 10 || score > sortedScores[Math.min(sortedScores.length - 1, 9)].score;
        setQualifies(qualifies);

        // Check if it's the top score (higher than the current highest)
        const isTop = score > sortedScores[0].score;
        setIsTopHighScore(isTop);

        console.log(`Score check: ${score} vs top ${sortedScores[0]?.score}, isTop: ${isTop}, qualifies: ${qualifies}`);
      } catch (error) {
        console.error("Error checking score status:", error);
        // Default to qualifying to let the player submit
        setQualifies(true);
        setIsTopHighScore(false);
      }
    };

    checkScoreStatus();
  }, [score]);

  const loadTopScores = async () => {
    const scores = await getTopHighScores();
    setTopScores(scores || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!playerName.trim()) return;
    
    // Make sure name is exactly 3 characters (pad with spaces if needed)
    const formattedName = playerName.trim().padEnd(3, ' ').slice(0, 3);
    
    setIsSubmitting(true);
    
    try {
      await saveHighScore(formattedName, score, level);
      setSubmitted(true);
      // Reload the scores to show the updated list
      await loadTopScores();
    } catch (error) {
      console.error('Error submitting score:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes - convert to uppercase and enforce 3-char limit
  const handleNameChange = (e) => {
    const input = e.target.value;
    setPlayerName(input.toUpperCase().slice(0, 3));
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 20,
      fontFamily: "'Press Start 2P', cursive",
      color: 'white',
      overflow: 'hidden'
    }}>
      <div style={{
        background: '#F25533',
        padding: '20px',
        borderRadius: '8px',
        border: '5px solid white',
        width: '90%',
        maxWidth: '700px',
        height: '90%',
        maxHeight: '90%',
        minHeight: '500px',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
      }}>
        <h2 style={{ fontSize: '28px', textAlign: 'center', margin: '0' }}>
          High Scores
        </h2>
        
        {qualifies && !submitted && (
          <div style={{ width: '100%' }}>
            <h3 style={{ textAlign: 'center', fontSize: '18px' }}>
              Your score: {score} (Level {level})
            </h3>
            <p style={{ textAlign: 'center', marginBottom: '15px' }}>
              Congratulations! You made the top 10!
            </p>
            <p style={{ textAlign: 'center', fontSize: '14px', color: '#ffff00' }}>
              ENTER YOUR 3 INITIALS:
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="AAA"
                value={playerName}
                onChange={handleNameChange}
                maxLength={3}
                autoFocus
                style={{
                  padding: '10px',
                  marginBottom: '15px',
                  width: '100px',
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '24px',
                  textAlign: 'center',
                  letterSpacing: '8px',
                  backgroundColor: 'black',
                  color: '#ffff00',
                  border: '2px solid white',
                }}
              />
              <button
                type="submit"
                disabled={isSubmitting || playerName.length < 1}
                style={{
                  padding: '10px 20px',
                  background: playerName.length >= 1 ? '#4CAF50' : '#999',
                  color: 'white',
                  border: 'none',
                  cursor: playerName.length >= 1 ? 'pointer' : 'not-allowed',
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '14px',
                }}
              >
                {isSubmitting ? 'Saving...' : 'Save Score'}
              </button>
            </form>
          </div>
        )}
        
        {!qualifies && (
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <h3 style={{ fontSize: '18px' }}>
              Your score: {score} (Level {level})
            </h3>
            <p>Keep trying to make the top 10!</p>
          </div>
        )}
        
        {submitted && !isTopHighScore && (
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <p>Your score has been saved!</p>
          </div>
        )}

        {submitted && isTopHighScore && (
          <div className="top-score-celebration" style={{ padding: '8px 5px', marginBottom: 0 }}>
            <h2 style={{ fontSize: '22px', margin: '5px 0' }}>NEW HIGH SCORE!</h2>

            {/* Consolidated layout with crown and name on same line */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '3px 0'
            }}>
              <span style={{ fontSize: '28px', marginRight: '5px' }}>👑</span>
              <div style={{
                fontSize: '24px',
                color: '#ffff00',
                textShadow: '0 0 5px #ffffff',
                letterSpacing: '3px',
                fontWeight: 'bold'
              }}>
                {playerName}
              </div>
            </div>

            {/* Score */}
            <div style={{
              fontSize: '18px',
              color: '#88ff88',
              margin: '3px 0',
              animation: 'pulse 1.2s infinite alternate'
            }}>
              {score} POINTS
            </div>

            {/* Congrats */}
            <div style={{
              fontSize: '16px',
              color: '#ffffff',
              textShadow: '0 0 5px #00ffff',
              margin: '3px 0'
            }}>
              PAGER DESTROYER!
            </div>

            {/* 80s arcade-style swag button */}
            <a
              href="https://incident.io"
              target="_blank"
              rel="noopener noreferrer"
              className="swag-button"
            >
              GET YOUR SWAG HERE
            </a>

            {/* Minimal celebration text */}
            <div style={{
              fontSize: '12px',
              color: '#ffff88',
              margin: '5px 0 2px',
              textAlign: 'center'
            }}>
              ⭐ CHAMPION ⭐
            </div>
          </div>
        )}
        
        <div style={{ width: '100%', marginTop: 'auto' }}>
          <h3 style={{ textAlign: 'center', fontSize: '18px', marginBottom: '15px' }}>
            Top 10 Scores
          </h3>
          
          {topScores.length === 0 ? (
            <p style={{ textAlign: 'center' }}>No scores yet. Be the first!</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid white' }}>Rank</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid white' }}>Player</th>
                  <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid white' }}>Score</th>
                  <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid white' }}>Level</th>
                </tr>
              </thead>
              <tbody>
                {topScores.map((entry, index) => (
                  <tr key={index} style={{ 
                    backgroundColor: entry.player_name.trim() === playerName.trim() && submitted ? 'rgba(255, 255, 0, 0.2)' : 'transparent'
                  }}>
                    <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>{index + 1}</td>
                    <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid rgba(255, 255, 255, 0.2)', fontFamily: "'Press Start 2P', cursive" }}>{entry.player_name}</td>
                    <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>{entry.score}</td>
                    <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>{entry.level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <button
          onClick={onClose}
          style={{
            padding: '10px 20px',
            background: '#333',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'Press Start 2P', cursive",
            fontSize: '14px',
            marginTop: '15px',
            marginBottom: '10px',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default HighScoreModal;