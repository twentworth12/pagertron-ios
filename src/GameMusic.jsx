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
      setIsMuted(storedMuteState === 'true');
    }
  }, []);
  const [initializing, setInitializing] = useState(true);
  
  // Initialize audio on component mount
  useEffect(() => {
    console.log("Initializing GameMusic component");

    // Create and configure audio elements with HTML5 Audio API for better compatibility
    const introMusic = new Audio('/music/Race.mp3');
    introMusic.id = "intro-music";
    introMusic.loop = true;
    introMusic.volume = 0.5;
    introMusic.preload = "auto"; // Force preloading

    const gameplayMusic = new Audio('/music/Fatality.mp3');
    gameplayMusic.id = "gameplay-music";
    gameplayMusic.loop = true;
    gameplayMusic.volume = 0.4;
    gameplayMusic.preload = "auto"; // Force preloading

    // Add audio elements directly to the DOM for better browser compatibility
    document.body.appendChild(introMusic);
    document.body.appendChild(gameplayMusic);

    // Store references
    introMusicRef.current = introMusic;
    gameplayMusicRef.current = gameplayMusic;

    // Force load attempt with multiple strategies
    introMusic.load();
    gameplayMusic.load();

    // Try to unlock audio with user interaction simulation
    const unlockAudio = () => {
      const tempButton = document.createElement("button");
      document.body.appendChild(tempButton);
      tempButton.click();
      document.body.removeChild(tempButton);

      // Try to play and immediately pause both tracks to unlock the audio context
      try {
        introMusic.play().then(() => introMusic.pause()).catch(e => console.log("Audio setup:", e));
        gameplayMusic.play().then(() => gameplayMusic.pause()).catch(e => console.log("Audio setup:", e));
      } catch (e) {
        console.log("Initial audio setup error:", e);
      }
    };

    // Try unlock immediately and after a delay
    unlockAudio();
    setTimeout(unlockAudio, 500);

    // Add event listeners to know when audio is loaded
    introMusicRef.current.addEventListener('canplaythrough', () => {
      console.log('Intro music loaded and ready to play');
    });

    gameplayMusicRef.current.addEventListener('canplaythrough', () => {
      console.log('Gameplay music loaded and ready to play');
    });
    
    // Helper function to start playing intro music
    const startIntroMusic = () => {
      if (!introMusicRef.current) return;
      
      const promise = introMusicRef.current.play();
      if (promise !== undefined) {
        promise.then(() => {
          console.log('Intro music started');
          setInitializing(false);
        }).catch(err => {
          console.log('Autoplay still prevented. Will try with user gesture.', err);
          
          // Specifically set up for first valid user interaction
          // Use only click and touchstart, not keydown to avoid spacebar conflicts
          const handleFirstInteraction = () => {
            introMusicRef.current.play().catch(e => console.error(e));
            ['click', 'touchstart'].forEach(type => {
              document.removeEventListener(type, handleFirstInteraction);
            });
          };

          // Only use click and touch events to avoid keydown conflicts with spacebar
          ['click', 'touchstart'].forEach(type => {
            document.addEventListener(type, handleFirstInteraction, { once: true });
          });
        });
      }
    };
    
    // Only try to start music if not muted
    if (!isMuted) {
      // Use various techniques to try to start the music
      startIntroMusic();

      // Brute force approach - try every 500ms for first 5 seconds
      const autoplayAttempts = [];
      for (let i = 1; i <= 10; i++) {
        autoplayAttempts.push(
          setTimeout(() => {
            if (initializing && !isMuted) {
              forcePlay();
              startIntroMusic();
            }
          }, i * 500)
        );
      }
    } else {
      // If starting muted, just mark as initialized
      setInitializing(false);
    }

    // Force audio playback if user clicks anywhere on the page
    const handleAnyClick = () => {
      if (initializing && !isMuted) {
        startIntroMusic();
      }
    };

    // Only add the click listener, not keydown to avoid spacebar conflicts
    document.addEventListener('click', handleAnyClick);

    // Clean up on unmount
    return () => {
      // Clear any timeouts that might have been created
      if (typeof autoplayAttempts !== 'undefined' && autoplayAttempts) {
        autoplayAttempts.forEach(timeout => clearTimeout(timeout));
      }
      document.removeEventListener('click', handleAnyClick);

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
  
  // Handle music transitions based on game state
  useEffect(() => {
    if (isMuted) return; // Skip transitions if muted

    // Debug log to see state changes
    console.log("Music transition - Game Started:", isGameStarted, "Game Over:", isGameOver);

    const handleMusicTransition = async () => {
      if (!introMusicRef.current || !gameplayMusicRef.current) return;
      
      if (isGameStarted && !isGameOver) {
        // Transition to gameplay music
        try {
          console.log("Switching to gameplay music");

          // Stop intro music immediately
          introMusicRef.current.pause();
          introMusicRef.current.currentTime = 0;

          // Immediately start gameplay music with a very short delay
          gameplayMusicRef.current.currentTime = 0;
          console.log("Attempting to play gameplay music");

          // Force user interaction to enable audio
          forcePlay();
          document.body.click();

          // Try to play with aggressive retry
          const playPromise = gameplayMusicRef.current.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log("Gameplay music started successfully");
            }).catch(e => {
              console.error('Failed to play gameplay music:', e);
              // Try multiple times with increasing delay
              setTimeout(() => {
                forcePlay();
                gameplayMusicRef.current.play().catch(err => {
                  console.error('Second attempt failed:', err);
                  // One more try after a longer delay
                  setTimeout(() => {
                    forcePlay();
                    gameplayMusicRef.current.play().catch(console.error);
                  }, 500);
                });
              }, 100);
            });
          }
        } catch (error) {
          console.error('Error in music transition to gameplay:', error);
        }
      } else if (isGameOver) {
        // Fade out gameplay music and start intro music again
        try {
          // Fade out gameplay music
          const fadeOut = setInterval(() => {
            if (gameplayMusicRef.current) {
              if (gameplayMusicRef.current.volume > 0.1) {
                gameplayMusicRef.current.volume -= 0.1;
              } else {
                clearInterval(fadeOut);
                gameplayMusicRef.current.pause();
                gameplayMusicRef.current.volume = 0.4; // Reset volume for next time
                
                // Restart the intro music
                introMusicRef.current.currentTime = 0;
                introMusicRef.current.volume = 0.5;
                introMusicRef.current.play().catch(e => {
                  console.error('Failed to restart intro music after game over:', e);
                  forcePlay();
                  introMusicRef.current.play().catch(console.error);
                });
              }
            } else {
              clearInterval(fadeOut);
            }
          }, 100);
        } catch (error) {
          console.error('Error in music transition to game over:', error);
        }
      } else if (!isGameStarted && !isGameOver && !introMusicRef.current.paused) {
        // Already playing intro music, nothing to do
      } else if (!isGameStarted && !isGameOver) {
        // Start/restart intro music if it's not playing
        try {
          gameplayMusicRef.current.pause();
          
          introMusicRef.current.currentTime = 0;
          introMusicRef.current.play().catch(e => {
            console.error('Failed to play intro music:', e);
            forcePlay();
            introMusicRef.current.play().catch(console.error);
          });
        } catch (error) {
          console.error('Error restarting intro music:', error);
        }
      }
    };
    
    // Run the music transition immediately
    handleMusicTransition();

    // Also set up a delayed retry to handle edge cases
    if (isGameStarted && !isGameOver && !isMuted) {
      const retryTimer = setTimeout(() => {
        console.log("Retry playing gameplay music");
        if (gameplayMusicRef.current && gameplayMusicRef.current.paused) {
          forcePlay();
          gameplayMusicRef.current.play().catch(console.error);
        }
      }, 1000);

      return () => clearTimeout(retryTimer);
    }

  }, [isGameStarted, isGameOver, isMuted]);
  
  // More robust toggle mute function
  const toggleMute = () => {
    // Log detailed info for debugging
    console.log("Toggle music button clicked!");
    console.log("Current state:", { isMuted, isGameStarted, isGameOver });
    console.log("Audio elements:", {
      introMusic: introMusicRef.current ? "exists" : "null",
      gameplayMusic: gameplayMusicRef.current ? "exists" : "null"
    });

    // Force immediate audio context unlock with a user gesture
    const tempButton = document.createElement("button");
    document.body.appendChild(tempButton);
    tempButton.click();
    document.body.removeChild(tempButton);

    // Get direct references to audio elements
    const introMusic = introMusicRef.current;
    const gameplayMusic = gameplayMusicRef.current;

    // Verify audio elements exist
    if (!introMusic || !gameplayMusic) {
      console.error("Audio elements not properly initialized!");
      // Try to recreate them
      if (!introMusicRef.current) {
        introMusicRef.current = new Audio('/music/Race.mp3');
        introMusicRef.current.loop = true;
        introMusicRef.current.volume = 0.5;
      }
      if (!gameplayMusicRef.current) {
        gameplayMusicRef.current = new Audio('/music/Fatality.mp3');
        gameplayMusicRef.current.loop = true;
        gameplayMusicRef.current.volume = 0.4;
      }
      return; // Try again next click
    }

    // Toggle the mute state
    const newMuted = !isMuted;
    console.log(`Setting music to ${newMuted ? "OFF" : "ON"}`);
    setIsMuted(newMuted);

    // Store preference in localStorage
    localStorage.setItem('pagertronMusicMuted', newMuted.toString());

    // Handle audio based on new state with direct DOM manipulation
    if (newMuted) {
      // Mute - pause both tracks
      introMusic.pause();
      gameplayMusic.pause();
      console.log("All music paused");
    } else {
      // Unmute - determine which track to play
      if (isGameStarted && !isGameOver) {
        // Game is active - play gameplay music
        introMusic.pause();

        // Reset and play gameplay music with direct method
        gameplayMusic.currentTime = 0;
        gameplayMusic.volume = 0.4;

        // Force play with timeout as fallback
        const playGameMusic = () => {
          console.log("Attempting to play gameplay music");
          const playPromise = gameplayMusic.play();
          if (playPromise) {
            playPromise.catch(e => {
              console.error("Gameplay music play failed:", e);
              // Try one more time after a short delay
              setTimeout(() => gameplayMusic.play().catch(console.error), 100);
            });
          }
        };

        // Try immediately and with a small delay
        playGameMusic();
        setTimeout(playGameMusic, 200);
      } else {
        // Menu/game over - play intro music
        gameplayMusic.pause();

        // Reset and play intro music with direct method
        introMusic.currentTime = 0;
        introMusic.volume = 0.5;

        // Force play with timeout as fallback
        const playIntroMusic = () => {
          console.log("Attempting to play intro music");
          const playPromise = introMusic.play();
          if (playPromise) {
            playPromise.catch(e => {
              console.error("Intro music play failed:", e);
              // Try one more time after a short delay
              setTimeout(() => introMusic.play().catch(console.error), 100);
            });
          }
        };

        // Try immediately and with a small delay
        playIntroMusic();
        setTimeout(playIntroMusic, 200);
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
        left: 0,
        width: '100%',
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
        }}
        style={{
          position: 'relative',
          margin: '10px auto',
          display: 'block',
          backgroundColor: isMuted ? '#ff3333' : '#33cc33', // Brighter solid colors
          border: '4px solid white', // Very thick border
          borderRadius: '10px',
          color: 'white',
          fontFamily: "'Press Start 2P', cursive",
          fontSize: '16px', // Larger text
          fontWeight: 'bold',
          padding: '12px 24px', // Extra large clickable area
          cursor: 'pointer',
          pointerEvents: 'auto', // Ensure clicks are detected on this element
          boxShadow: '0 0 25px white, 0 0 15px yellow', // Extra bright glow
          animation: isMuted ? 'pulse 1s infinite alternate' : 'pulse 3s infinite alternate',
          textShadow: '2px 2px 4px #000000', // Text shadow for better visibility
          width: '180px', // Fixed width for consistency
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