import React, { useState, useEffect } from 'react';
import { getTopHighScores } from './highScoreService';

function HighScoreTicker() {
  const defaultScores = [
    { player_name: 'CPU', score: 10000, level: 10 },
    { player_name: 'ANT', score: 8000, level: 8 },
    { player_name: 'CLO', score: 6000, level: 6 },
    { player_name: 'UDE', score: 4000, level: 4 },
    { player_name: 'INC', score: 2000, level: 2 }
  ];
  
  const [scores, setScores] = useState(defaultScores);
  const [showScores, setShowScores] = useState(true);
  
  // Initial load of real scores
  useEffect(() => {
    const loadScores = async () => {
      try {
        const result = await getTopHighScores(5);
        if (result && result.length > 0) {
          setScores(result);
        }
      } catch (error) {
        console.log("Using default scores");
        // Keep default scores on error
      }
    };
    
    loadScores();
    
    // Classic attract mode: Toggle between showing title and showing scores
    const intervalId = setInterval(() => {
      setShowScores(prev => !prev);
    }, 8000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Take only the top 5 scores for display
  const displayScores = scores.slice(0, 5);
  
  // Classic 80s arcade cabinet high score table design
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '120px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: showScores ? 'flex' : 'none',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 6,
        fontFamily: "'Press Start 2P', cursive",
        borderTop: '2px solid #ff00ff',
        boxShadow: '0 -2px 10px rgba(255, 0, 255, 0.5)',
        transition: 'opacity 0.5s',
        opacity: showScores ? 1 : 0,
      }}
    >
      <div
        style={{
          fontSize: '18px',
          color: '#ffff00',
          marginBottom: '10px',
          textShadow: '0 0 10px rgba(255, 255, 0, 0.7), 0 0 20px rgba(255, 255, 0, 0.5)',
          animation: 'pulse 1.5s infinite alternate',
          transform: 'scale(1, 1.2)', // Slight vertical stretch like CRT
        }}
      >
        TODAY'S TOP SCORES
      </div>
      
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '5px 20px',
          borderWidth: '2px',
          borderStyle: 'solid',
          borderImage: 'linear-gradient(45deg, #00ffff, #ff00ff) 1',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          boxShadow: '0 0 10px rgba(0, 255, 255, 0.3), 0 0 20px rgba(255, 0, 255, 0.3)',
          width: '90%',
        }}
      >
        {displayScores.map((score, index) => (
          <div 
            key={index}
            style={{
              width: 'calc(100% / 5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '5px',
              borderRight: index < displayScores.length - 1 ? '1px dashed rgba(255, 255, 255, 0.3)' : 'none',
              animation: `pixel-shift ${0.5 + index * 0.1}s step-end infinite`,
            }}
          >
            <div style={{ 
              fontSize: '12px', 
              color: '#ffffff',
              textShadow: '1px 1px 0 #000',
              marginBottom: '2px',
            }}>
              #{index + 1}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#ff88ff',
              textShadow: '1px 1px 0 #000',
              marginBottom: '2px',
            }}>
              {score.player_name}
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#88ff88',
              textShadow: '1px 1px 0 #000',
              marginBottom: '2px',
            }}>
              {score.score}
            </div>
            <div style={{ 
              fontSize: '10px', 
              color: '#ffffff',
              opacity: 0.7,
            }}>
              LVL {score.level}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HighScoreTicker;