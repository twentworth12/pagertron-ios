import React, { useState, useEffect } from 'react';
import { getTopHighScores } from './highScoreService';

function HighScoreTicker() {
  const defaultScores = [
    { player_name: 'PLAYER1', score: 1200, level: 6 },
    { player_name: 'PLAYER2', score: 900, level: 5 },
    { player_name: 'PLAYER3', score: 800, level: 4 },
    { player_name: 'PLAYER4', score: 700, level: 4 },
    { player_name: 'PLAYER5', score: 600, level: 3 }
  ];
  
  const [scores, setScores] = useState(defaultScores);
  
  // Initial load of real scores
  useEffect(() => {
    const loadScores = async () => {
      try {
        const topScores = await getTopHighScores();
        if (topScores && topScores.length > 0) {
          setScores(topScores);
        }
      } catch (error) {
        console.error("Error loading high scores:", error);
      }
    };
    
    loadScores();
  }, []);

  // Format the scores for display
  const scoreItems = scores.map((score, index) => 
    `${index + 1}. ${score.player_name} - ${score.score} PTS (LVL ${score.level})`
  ).join('   •   ');
  
  // Repeat the string to ensure continuous scrolling
  const repeatedScores = `${scoreItems}   •   ${scoreItems}   •   ${scoreItems}`;
  
  return (
    <>
      {/* Static "Top Scores" header */}
      <div
        style={{
          position: 'absolute',
          bottom: '35%',
          width: '100%',
          textAlign: 'center',
          color: 'white',
          fontFamily: "'Press Start 2P', cursive",
          fontSize: '22px',
          textShadow: '2px 2px 0px rgba(0, 0, 0, 0.7)',
          zIndex: 5,
        }}
        className="score-highlight"
      >
        TOP SCORES
      </div>
      
      {/* Simple marquee element instead of custom animation */}
      <div style={{
        position: 'absolute',
        bottom: '30%',
        width: '100%',
        height: '30px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        zIndex: 5,
      }}>
        <marquee
          scrollamount="3.3"
          behavior="scroll"
          direction="left"
          style={{
            fontFamily: "'Press Start 2P', cursive",
            fontSize: '16px',
            color: 'white',
            lineHeight: '30px',
            height: '100%',
            width: '100%',
          }}
        >
          {repeatedScores}
        </marquee>
      </div>
    </>
  );
}

export default HighScoreTicker;