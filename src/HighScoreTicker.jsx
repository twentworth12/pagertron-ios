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
  }, []);
  
  // Take only the top 5 scores for display
  const displayScores = scores.slice(0, 5);
  
  // Arcade style high score display that matches game theme
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '100px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 6,
        fontFamily: "'Press Start 2P', cursive",
        borderTop: '2px solid #F25533',
        boxShadow: '0 -4px 15px rgba(242, 85, 51, 0.4)',
      }}
    >
      <div
        style={{
          fontSize: '16px',
          color: '#ffffff',
          marginBottom: '10px',
          textShadow: '2px 2px 0px #000',
          letterSpacing: '1px',
        }}
      >
        HIGH SCORES
      </div>
      
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '5px 20px',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
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
              borderRight: index < displayScores.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
            }}
          >
            <div style={{ 
              fontSize: '12px', 
              color: '#F25533',
              textShadow: '1px 1px 0 #000',
              marginBottom: '2px',
              fontWeight: 'bold',
            }}>
              #{index + 1}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#ffffff',
              textShadow: '1px 1px 0 #000',
              marginBottom: '2px',
            }}>
              {score.player_name}
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#ffffff',
              textShadow: '1px 1px 0 #000',
              marginBottom: '2px',
            }}>
              {score.score}
            </div>
            <div style={{ 
              fontSize: '10px', 
              color: '#F25533',
              textShadow: '1px 1px 0 #000',
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