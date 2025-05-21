import React, { useEffect, useRef, useState } from 'react';

// Force browser to load and autoplay without affecting the game's spacebar controls
const forcePlay = () => {
  try {
    // Only simulate a click event, never a keyboard event to avoid spacebar issues
    const click = new MouseEvent('click', {
      bubbles: false, // Prevent event bubbling to avoid affecting game controls
      cancelable: true,
      view: window
    });

    // Create a temporary element to dispatch the event on, to prevent global document events
    const tempButton = document.createElement('button');
    tempButton.style.display = 'none';
    document.body.appendChild(tempButton);
    tempButton.dispatchEvent(click);
    document.body.removeChild(tempButton);

  } catch (e) {
    console.log('Error simulating click for audio context:', e);
  }
};

const GameMusic = ({ isGameStarted, isGameOver }) => {
  const introMusicRef = useRef(null);
  const gameplayMusicRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true); // Start with music muted by default

  // Store mute preference in localStorage for persistence
  useEffect(() => {
    const storedMuteState = localStorage.getItem('pagertronMusicMuted');
    if (storedMuteState !== null) {
      const shouldMute = storedMuteState === 'true';
      console.log('Found stored music preference:', shouldMute ? 'muted' : 'unmuted');
      setIsMuted(shouldMute);
    } else {
      // If no preference is stored, set a default preference of muted
      localStorage.setItem('pagertronMusicMuted', 'true');
    }
    
    // Try to reset any existing audio elements
    try {
      const existingIntro = document.getElementById('intro-music');
      const existingGameplay = document.getElementById('gameplay-music');
      if (existingIntro) existingIntro.volume = 0.5;
      if (existingGameplay) existingGameplay.volume = 0.4;
    } catch (e) {
      console.log("Audio reset error:", e);
    }
  }, []);
  const [initializing, setInitializing] = useState(true);
  
  // Simplified audio initialization
  useEffect(() => {
    console.log("Initializing GameMusic component");

    // Clean up any existing audio elements
    try {
      const existingIntro = document.getElementById('intro-music');
      const existingGameplay = document.getElementById('gameplay-music');
      if (existingIntro) document.body.removeChild(existingIntro);
      if (existingGameplay) document.body.removeChild(existingGameplay);
    } catch (e) {
      console.log("Error cleaning up existing audio elements:", e);
    }
    
    // Create and configure audio elements with basic settings
    const introMusic = new Audio('/music/Race.mp3');
    introMusic.id = "intro-music";
    introMusic.loop = true;
    introMusic.volume = 0.5;
    introMusic.preload = "auto";

    const gameplayMusic = new Audio('/music/Fatality.mp3');
    gameplayMusic.id = "gameplay-music";
    gameplayMusic.loop = true;
    gameplayMusic.volume = 0.4;
    gameplayMusic.preload = "auto";

    // Add audio elements to DOM
    document.body.appendChild(introMusic);
    document.body.appendChild(gameplayMusic);

    // Store references
    introMusicRef.current = introMusic;
    gameplayMusicRef.current = gameplayMusic;

    // Single attempt to unlock audio
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const tempContext = new AudioContext();
        tempContext.resume().catch(() => {});
      }
    } catch (e) {
      console.log("Audio context initialization error:", e);
    }

    // Add event listeners to log when audio is loaded
    introMusic.addEventListener('canplaythrough', () => {
      console.log('Intro music loaded and ready to play');
    });

    // Initialize music playback if not muted
    if (!isMuted) {
      console.log('Attempting to play intro music');
      
      const playPromise = introMusic.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('Intro music started successfully');
          setInitializing(false);
        }).catch(err => {
          console.log('Autoplay prevented. Will wait for user interaction.', err);
          setInitializing(false);
          
          // Set up a one-time event listener for first click
          const handleFirstClick = () => {
            if (!isMuted && introMusicRef.current) {
              introMusicRef.current.play().catch(() => {});
            }
            document.removeEventListener('click', handleFirstClick);
          };
          
          document.addEventListener('click', handleFirstClick, { once: true });
        });
      }
    } else {
      // If muted, just mark as initialized
      setInitializing(false);
    }

    // Clean up on unmount
    return () => {
      // Clean up audio elements
      if (introMusicRef.current) {
        introMusicRef.current.pause();
        introMusicRef.current.src = '';
        try {
          document.body.removeChild(document.getElementById('intro-music'));
        } catch (e) {}
      }

      if (gameplayMusicRef.current) {
        gameplayMusicRef.current.pause();
        gameplayMusicRef.current.src = '';
        try {
          document.body.removeChild(document.getElementById('gameplay-music'));
        } catch (e) {}
      }
    };
  }, [initializing, isMuted]);
  
  // Simplified music transitions based on game state
  useEffect(() => {
    // Debug log to see state changes
    console.log("Music transition - Game Started:", isGameStarted, "Game Over:", isGameOver, "Muted:", isMuted);
    console.log("Music transition handling both intro and gameplay music");
    
    // Check if audio references exist
    if (!introMusicRef.current || !gameplayMusicRef.current) {
      console.error("Missing audio references during transition");
      return;
    }
    
    // Handle muted state
    if (isMuted) {
      // Ensure both tracks are paused if muted
      introMusicRef.current.pause();
      gameplayMusicRef.current.pause();
      return; // Skip transitions if muted
    }
    
    // Play appropriate music based on game state
    const introMusic = introMusicRef.current;
    const gameplayMusic = gameplayMusicRef.current;
    
    if (isGameStarted && !isGameOver) {
      // In active gameplay, use gameplay music
      introMusic.pause();
      
      // Only play gameplay music if it's paused (prevent unnecessary restarts)
      if (gameplayMusic.paused) {
        console.log("Starting gameplay music");
        
        // Try to resume audio context if needed
        try {
          if (window.PagertronAudio && window.PagertronAudio.context) {
            window.PagertronAudio.context.resume().catch(() => {});
          }
        } catch (e) {}
        
        // Set volume
        gameplayMusic.volume = 0.4;
        
        // Single attempt to play without reloading or resetting position
        gameplayMusic.play().catch(error => {
          console.error('Failed to play gameplay music:', error);
        });
      }
    } else {
      // In menu or game over, use intro music
      gameplayMusic.pause();
      
      // Only play intro music if it's paused (prevent unnecessary restarts)
      if (introMusic.paused) {
        console.log("Starting intro music");
        
        // Try to resume audio context if needed
        try {
          if (window.PagertronAudio && window.PagertronAudio.context) {
            window.PagertronAudio.context.resume().catch(() => {});
          }
        } catch (e) {}
        
        // Set volume
        introMusic.volume = 0.5;
        
        // Single attempt to play without reloading or resetting position
        introMusic.play().catch(error => {
          console.error('Failed to play intro music:', error);
        });
      }
    }
    
    // No return cleanup function - simplifies the code and prevents issues

  }, [isGameStarted, isGameOver, isMuted]);
  
  // Fixed toggle mute function to prevent music restarting
  const toggleMute = () => {
    console.log("Toggle music button clicked!");
    console.log("Current state:", { isMuted, isGameStarted, isGameOver });
    
    // Force immediate audio context unlock (simplified)
    try {
      if (window.PagertronAudio && window.PagertronAudio.context) {
        window.PagertronAudio.context.resume().catch(e => console.log("Context resume error:", e));
      }
    } catch (e) {
      console.log("Audio context unlock error:", e);
    }

    // Check if audio elements exist
    if (!introMusicRef.current || !gameplayMusicRef.current) {
      console.log("Music references missing, cannot toggle");
      return;
    }
    
    // Get current references
    const introMusic = introMusicRef.current;
    const gameplayMusic = gameplayMusicRef.current;
    
    // Toggle the mute state
    const newMuted = !isMuted;
    console.log(`Setting music to ${newMuted ? "OFF" : "ON"}`);
    setIsMuted(newMuted);

    // Store preference in localStorage
    localStorage.setItem('pagertronMusicMuted', newMuted.toString());

    // Handle audio based on new state
    if (newMuted) {
      // Mute - pause both tracks
      try {
        introMusic.pause();
        gameplayMusic.pause();
        console.log("All music paused successfully");
      } catch (e) {
        console.error("Error pausing music:", e);
      }
    } else {
      // Unmute - determine which track to play based on what was active before
      try {
        // Only one attempt to play music, no reloading or resetting currentTime
        if (isGameStarted && !isGameOver) {
          console.log("Game active - playing gameplay music");
          introMusic.pause();
          gameplayMusic.volume = 0.4;
          
          const playPromise = gameplayMusic.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              console.error("Gameplay music play failed:", e);
              document.body.click(); // One user interaction attempt
            });
          }
        } else {
          console.log("Menu/game over - playing intro music");
          gameplayMusic.pause();
          introMusic.volume = 0.5;
          
          const playPromise = introMusic.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              console.error("Intro music play failed:", e);
              document.body.click(); // One user interaction attempt
            });
          }
        }
      } catch (e) {
        console.error("Error in music toggle logic:", e);
      }
    }
  };
  
  // Removed event listeners for better performance

  // Render mute/unmute button wrapped in a div to ensure clicks work
  return (
    <div
      style={{
        position: 'absolute',
        top: 15,
        right: 15,
        zIndex: 10000, // Absolute highest z-index
        pointerEvents: 'none', // Let events pass through to game elements
      }}
    >
      <button
        id="music-toggle-button"
        tabIndex="0" // Allow button to receive focus
        onClick={(e) => {
          // Explicitly stop event propagation
          e.preventDefault();
          e.stopPropagation();
          // Log to verify click is detected
          console.log("Music button clicked, current state:", isMuted);
          // Toggle music state
          toggleMute();
          
          // Simplified audio context unlock without creating new audio elements
          try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
              const tempContext = new AudioContext();
              tempContext.resume().catch(() => {});
            }
          } catch (e) {
            console.log("Audio unlock error:", e);
          }
        }}
        style={{
          backgroundColor: isMuted ? '#ff3333' : '#33cc33', // Brighter solid colors
          border: '4px solid white', // Very thick border
          borderRadius: '10px',
          color: 'white',
          fontFamily: "'Press Start 2P', cursive",
          fontSize: '14px', // Slightly smaller text
          fontWeight: 'bold',
          padding: '8px 16px', // Smaller button
          cursor: 'pointer',
          pointerEvents: 'auto', // Ensure clicks are detected on this element
          boxShadow: '0 0 15px white, 0 0 10px yellow', // Slightly less intense glow
          animation: isMuted ? 'pulse 1s infinite alternate' : 'pulse 3s infinite alternate',
          textShadow: '2px 2px 4px #000000', // Text shadow for better visibility
          userSelect: 'none', // Prevent text selection
          WebkitTapHighlightColor: 'transparent', // Remove mobile tap highlight
          outline: 'none', // Remove focus outline
          zIndex: 1000 // Ensure button is above other elements
        }}
      >
        {isMuted ? '🔈 MUSIC OFF' : '🔊 MUSIC ON'}
      </button>
    </div>
  );
};

export default GameMusic;