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

// Create static refs outside the component to persist across re-renders
const introMusicStaticRef = { current: null };
const gameplayMusicStaticRef = { current: null };

const GameMusic = ({ isGameStarted, isGameOver }) => {
  // Use the static refs to ensure music persistence
  const introMusicRef = useRef(introMusicStaticRef);
  const gameplayMusicRef = useRef(gameplayMusicStaticRef);
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

    // Only create new audio elements if they don't already exist
    if (!introMusicRef.current.current || !gameplayMusicRef.current.current) {
      console.log("Creating new audio elements");
      
      // Create and configure intro music
      const introMusic = new Audio('/music/Race.mp3');
      introMusic.id = "intro-music";
      introMusic.loop = true;
      introMusic.volume = 0.5;
      introMusic.preload = "auto";

      // Create and configure gameplay music
      const gameplayMusic = new Audio('/music/Fatality.mp3');
      gameplayMusic.id = "gameplay-music";
      gameplayMusic.loop = true;
      gameplayMusic.volume = 0.4;
      gameplayMusic.preload = "auto";

      // Store references in our static refs
      introMusicRef.current.current = introMusic;
      gameplayMusicRef.current.current = gameplayMusic;
      
      // Log success
      console.log("Successfully created and stored audio elements");
    } else {
      console.log("Using existing audio elements");
    }

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
    if (introMusicRef.current.current) {
      introMusicRef.current.current.addEventListener('canplaythrough', () => {
        console.log('Intro music loaded and ready to play');
      });
    }

    // Initialize music playback if not muted
    if (!isMuted && introMusicRef.current.current) {
      console.log('Attempting to play intro music');
      
      const playPromise = introMusicRef.current.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('Intro music started successfully');
          setInitializing(false);
        }).catch(err => {
          console.log('Autoplay prevented. Will wait for user interaction.', err);
          setInitializing(false);
          
          // Set up a one-time event listener for first click
          const handleFirstClick = () => {
            if (!isMuted && introMusicRef.current.current) {
              introMusicRef.current.current.play().catch(() => {});
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

    // No cleanup on unmount to persist audio across renders
    // This is intentional to allow music to continue playing during transitions
    return () => {
      console.log("GameMusic component unmounting, but keeping audio elements");
    };
  }, [initializing, isMuted]);
  
  // Improved music transitions that prevent restart during transitions
  useEffect(() => {
    // Debug log to see state changes
    console.log("Music transition - Game Started:", isGameStarted, "Game Over:", isGameOver, "Muted:", isMuted);
    
    // Check if audio references exist
    if (!introMusicRef.current.current || !gameplayMusicRef.current.current) {
      console.error("Missing audio references during transition");
      return;
    }
    
    // Handle muted state
    if (isMuted) {
      // Ensure both tracks are paused if muted
      introMusicRef.current.current.pause();
      gameplayMusicRef.current.current.pause();
      return; // Skip transitions if muted
    }
    
    // Get references to both audio elements
    const introMusic = introMusicRef.current.current;
    const gameplayMusic = gameplayMusicRef.current.current;
    
    // Store current playing state before making changes
    const introWasPlaying = !introMusic.paused;
    const gameplayWasPlaying = !gameplayMusic.paused;
    
    // Log the current state for debugging
    console.log("Current playback state:", { 
      introWasPlaying, 
      gameplayWasPlaying, 
      introCurrentTime: introMusic.currentTime,
      gameplayCurrentTime: gameplayMusic.currentTime,
      isGameStarted,
      isGameOver
    });
    
    if (isGameStarted && !isGameOver) {
      // We want gameplay music to be playing in this state
      if (!gameplayWasPlaying) {
        // Gameplay music isn't playing, so we need to start it
        console.log("Starting gameplay music - it wasn't already playing");
        
        // Pause intro music if it was playing
        if (introWasPlaying) {
          console.log("Pausing intro music that was playing");
          introMusic.pause();
        }
        
        // Set volume
        gameplayMusic.volume = 0.4;
        
        // Try to resume audio context if needed
        try {
          if (window.AudioContext || window.webkitAudioContext) {
            const tempContext = new (window.AudioContext || window.webkitAudioContext)();
            tempContext.resume().catch(() => {});
          }
        } catch (e) {}
        
        // Single attempt to play without reloading or resetting position
        const playPromise = gameplayMusic.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Failed to play gameplay music:', error);
            
            // Retry once on user interaction to handle autoplay restrictions
            const unlockAudio = () => {
              gameplayMusic.play().catch(e => console.log("Still can't play:", e));
              document.removeEventListener('click', unlockAudio);
            };
            document.addEventListener('click', unlockAudio, { once: true });
          });
        }
      } else {
        // Gameplay music is already playing, just ensure intro is paused
        console.log("Gameplay music already playing, keeping it going");
        introMusic.pause();
        
        // Ensure volume is set correctly in case it was changed
        gameplayMusic.volume = 0.4;
      }
    } else {
      // We want intro music to be playing in this state
      if (!introWasPlaying) {
        // Intro music isn't playing, so we need to start it
        console.log("Starting intro music - it wasn't already playing");
        
        // Pause gameplay music if it was playing
        if (gameplayWasPlaying) {
          console.log("Pausing gameplay music that was playing");
          gameplayMusic.pause();
        }
        
        // Set volume
        introMusic.volume = 0.5;
        
        // Try to resume audio context if needed
        try {
          if (window.AudioContext || window.webkitAudioContext) {
            const tempContext = new (window.AudioContext || window.webkitAudioContext)();
            tempContext.resume().catch(() => {});
          }
        } catch (e) {}
        
        // Single attempt to play without reloading or resetting position
        const playPromise = introMusic.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Failed to play intro music:', error);
            
            // Retry once on user interaction to handle autoplay restrictions
            const unlockAudio = () => {
              introMusic.play().catch(e => console.log("Still can't play:", e));
              document.removeEventListener('click', unlockAudio);
            };
            document.addEventListener('click', unlockAudio, { once: true });
          });
        }
      } else {
        // Intro music is already playing, just ensure gameplay is paused
        console.log("Intro music already playing, keeping it going");
        gameplayMusic.pause();
        
        // Ensure volume is set correctly in case it was changed
        introMusic.volume = 0.5;
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