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
  const [isMuted, setIsMuted] = useState(false); // Start with music unmuted by default for better user experience

  // Store mute preference in localStorage for persistence
  useEffect(() => {
    const storedMuteState = localStorage.getItem('pagertronMusicMuted');
    if (storedMuteState !== null) {
      const shouldMute = storedMuteState === 'true';
      console.log('Found stored music preference:', shouldMute ? 'muted' : 'unmuted');
      setIsMuted(shouldMute);
    } else {
      // If no preference is stored, set a default preference of unmuted
      localStorage.setItem('pagertronMusicMuted', 'false');
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
  
  // Initialize audio on component mount with advanced unlocking strategies
  useEffect(() => {
    console.log("Initializing GameMusic component");

    // Try to unlock any potential browser audio restrictions first
    try {
      // Method 1: Create and resume a new audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const tempContext = new AudioContext();
        tempContext.resume().catch(e => console.log("Context resume error:", e));
        
        // Play a silent buffer
        const buffer = tempContext.createBuffer(1, 1, 22050);
        const source = tempContext.createBufferSource();
        source.buffer = buffer;
        source.connect(tempContext.destination);
        source.start(0);
      }
      
      // Method 2: Check if our global audio context exists and try to resume it
      if (window.PagertronAudio && window.PagertronAudio.context) {
        window.PagertronAudio.context.resume().catch(e => console.log("Global context resume error:", e));
      }
      
      // Method 3: Simulate user interaction
      const tempButton = document.createElement("button");
      document.body.appendChild(tempButton);
      tempButton.click();
      document.body.removeChild(tempButton);
    } catch (e) {
      console.log("Audio context initialization error:", e);
    }

    // Check if audio elements already exist and remove them
    try {
      const existingIntro = document.getElementById('intro-music');
      const existingGameplay = document.getElementById('gameplay-music');
      if (existingIntro) document.body.removeChild(existingIntro);
      if (existingGameplay) document.body.removeChild(existingGameplay);
    } catch (e) {
      console.log("Error removing existing audio elements:", e);
    }
    
    console.log("Creating new audio elements");
    
    // Create and configure audio elements with HTML5 Audio API for better compatibility
    const introMusic = new Audio('/music/Race.mp3');
    introMusic.id = "intro-music";
    introMusic.loop = true;
    introMusic.volume = 0.5;
    introMusic.preload = "auto"; // Force preloading
    introMusic.controls = false; // Hide controls

    const gameplayMusic = new Audio('/music/Fatality.mp3');
    gameplayMusic.id = "gameplay-music";
    gameplayMusic.loop = true;
    gameplayMusic.volume = 0.4;
    gameplayMusic.preload = "auto"; // Force preloading
    gameplayMusic.controls = false; // Hide controls

    // Add audio elements directly to the DOM for better browser compatibility
    document.body.appendChild(introMusic);
    document.body.appendChild(gameplayMusic);

    // Store references
    introMusicRef.current = introMusic;
    gameplayMusicRef.current = gameplayMusic;

    // Force load attempt with multiple strategies
    introMusic.load();
    gameplayMusic.load();

    // Add event listeners to know when audio is loaded
    introMusic.addEventListener('canplaythrough', () => {
      console.log('Intro music loaded and ready to play');
    });

    gameplayMusic.addEventListener('canplaythrough', () => {
      console.log('Gameplay music loaded and ready to play');
    });

    // Comprehensive audio unlock strategy
    const unlockAudioComprehensive = () => {
      console.log("Attempting comprehensive audio unlock");
      
      // First, try a user interaction simulation
      document.body.click();
      
      // Then, try to play and immediately pause both tracks
      try {
        // For intro music
        const introPromise = introMusic.play();
        if (introPromise !== undefined) {
          introPromise.then(() => {
            console.log("Intro music unlocked");
            if (isMuted) {
              introMusic.pause();
            }
          }).catch(e => console.log("Intro music unlock failed:", e));
        }
        
        // For gameplay music (with a slight delay)
        setTimeout(() => {
          const gameplayPromise = gameplayMusic.play();
          if (gameplayPromise !== undefined) {
            gameplayPromise.then(() => {
              console.log("Gameplay music unlocked");
              gameplayMusic.pause();
            }).catch(e => console.log("Gameplay music unlock failed:", e));
          }
        }, 100);
      } catch (e) {
        console.log("Audio unlock attempt error:", e);
      }
    };

    // Multiple unlock attempts with increasing delays
    unlockAudioComprehensive();
    setTimeout(unlockAudioComprehensive, 500);
    setTimeout(unlockAudioComprehensive, 1500);

    // Add event listeners to know when audio is loaded
    introMusicRef.current.addEventListener('canplaythrough', () => {
      console.log('Intro music loaded and ready to play');
    });

    gameplayMusicRef.current.addEventListener('canplaythrough', () => {
      console.log('Gameplay music loaded and ready to play');
    });
    
    // Helper function to start playing intro music
    const startIntroMusic = () => {
      if (!introMusicRef.current) {
        console.error('No intro music reference');
        return;
      }
      
      console.log('Attempting to play intro music, muted state:', isMuted);
      
      if (isMuted) {
        console.log('Music is muted, skipping playback');
        setInitializing(false);
        return;
      }
      
      const promise = introMusicRef.current.play();
      if (promise !== undefined) {
        promise.then(() => {
          console.log('Intro music started successfully');
          setInitializing(false);
        }).catch(err => {
          console.log('Autoplay still prevented. Will try with user gesture.', err);
          
          // Specifically set up for first valid user interaction
          // Use only click and touchstart, not keydown to avoid spacebar conflicts
          const handleFirstInteraction = () => {
            if (!isMuted && introMusicRef.current) {
              console.log('First user interaction detected, trying to play music again');
              introMusicRef.current.play().catch(e => console.error('Still failed to play after interaction:', e));
            }
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
    
    // Try to start music based on mute state
    console.log('Initial music setup, muted state:', isMuted);
    startIntroMusic();

    // Brute force approach - try every 500ms for first 5 seconds
    const autoplayAttempts = [];
    for (let i = 1; i <= 10; i++) {
      autoplayAttempts.push(
        setTimeout(() => {
          if (initializing && !isMuted) {
            console.log(`Autoplay attempt ${i}/10`);
            forcePlay();
            startIntroMusic();
          }
        }, i * 500)
      );
    }
    
    // If starting muted, mark as initialized after a short delay
    if (isMuted) {
      setTimeout(() => setInitializing(false), 100);
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
    // Debug log to see state changes
    console.log("Music transition - Game Started:", isGameStarted, "Game Over:", isGameOver, "Muted:", isMuted);
    console.log("NOTE: gameplay music disabled for performance");
    
    if (isMuted) {
      // Even if muted, ensure both tracks are paused
      if (introMusicRef.current) introMusicRef.current.pause();
      if (gameplayMusicRef.current) gameplayMusicRef.current.pause();
      return; // Skip transitions if muted
    }
    
    // Always stick to intro music for better performance, regardless of game state
    isGameStarted = false;

    const handleMusicTransition = async () => {
      if (!introMusicRef.current || !gameplayMusicRef.current) {
        console.error("Missing audio references during transition");
        return;
      }
      
      if (isGameStarted && !isGameOver) {
        // Transition to gameplay music
        try {
          console.log("Switching to gameplay music");

          // Make sure the audio context is active (if it exists)
          if (window.PagertronAudio && window.PagertronAudio.context) {
            await window.PagertronAudio.context.resume().catch(() => {});
          }

          // Create and use our own audio context to ensure it's running
          try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
              const tempContext = new AudioContext();
              await tempContext.resume().catch(() => {});
            }
          } catch (e) {
            console.log("Audio context creation error:", e);
          }

          // Stop intro music immediately
          introMusicRef.current.pause();
          introMusicRef.current.currentTime = 0;

          // Reset gameplay music to beginning
          gameplayMusicRef.current.currentTime = 0;
          gameplayMusicRef.current.volume = 0.4;
          gameplayMusicRef.current.loop = true; // Ensure looping is enabled
          
          console.log("Attempting to play gameplay music");

          // Force user interaction to enable audio
          forcePlay();
          document.body.click();
          
          // Try explicit load
          gameplayMusicRef.current.load();
          
          // Enhanced aggressive retry mechanism for gameplay music
          const maxRetries = 5;
          const playGameplayMusic = async (retryCount = 0) => {
            if (retryCount >= maxRetries) {
              console.error("Max retries reached for gameplay music");
              return;
            }
            
            try {
              console.log(`Gameplay music play attempt ${retryCount + 1}`);
              // Always make sure volume is set correctly
              gameplayMusicRef.current.volume = 0.4;
              
              const playPromise = gameplayMusicRef.current.play();
              if (playPromise !== undefined) {
                await playPromise;
                console.log("✅ Gameplay music started successfully");
              }
            } catch (err) {
              console.error(`Failed gameplay music attempt ${retryCount + 1}:`, err);
              
              // Force browser to acknowledge user interaction
              forcePlay();
              document.body.click();
              
              // Wait longer with each retry
              const delay = 200 + (retryCount * 300);
              console.log(`Retrying gameplay music in ${delay}ms`);
              
              setTimeout(() => {
                playGameplayMusic(retryCount + 1);
              }, delay);
            }
          };
          
          // Start the retry cascade
          playGameplayMusic();
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

    // Set up multiple delayed retries to handle edge cases
    if (isGameStarted && !isGameOver && !isMuted) {
      const retryTimers = [];
      
      // First retry after 1 second
      retryTimers.push(setTimeout(() => {
        console.log("First retry for gameplay music");
        if (gameplayMusicRef.current && gameplayMusicRef.current.paused) {
          try {
            forcePlay();
            gameplayMusicRef.current.volume = 0.4;
            gameplayMusicRef.current.currentTime = 0;
            gameplayMusicRef.current.load();
            gameplayMusicRef.current.play().catch(() => console.log("First retry failed"));
          } catch (e) {
            console.error("Error in first retry:", e);
          }
        }
      }, 1000));
      
      // Second retry after 2 seconds
      retryTimers.push(setTimeout(() => {
        console.log("Second retry for gameplay music");
        if (gameplayMusicRef.current && gameplayMusicRef.current.paused) {
          try {
            forcePlay();
            
            // Try to use the global audio context if available
            if (window.PagertronAudio && window.PagertronAudio.context) {
              window.PagertronAudio.context.resume().catch(() => {});
            }
            
            // Create a temporary audio context to help unlock audio
            try {
              const AudioContext = window.AudioContext || window.webkitAudioContext;
              const tempContext = new AudioContext();
              tempContext.resume();
            } catch (e) {}
            
            // Finally try to play
            gameplayMusicRef.current.volume = 0.4;
            gameplayMusicRef.current.play().catch(() => console.log("Second retry failed"));
          } catch (e) {
            console.error("Error in second retry:", e);
          }
        }
      }, 2000));
      
      // Third final retry after 4 seconds
      retryTimers.push(setTimeout(() => {
        console.log("Final retry for gameplay music");
        if (gameplayMusicRef.current && gameplayMusicRef.current.paused) {
          try {
            // Create a new audio element as a last resort
            const newGameplayMusic = new Audio('/music/Fatality.mp3');
            newGameplayMusic.id = "gameplay-music-new";
            newGameplayMusic.loop = true;
            newGameplayMusic.volume = 0.4;
            newGameplayMusic.play().then(() => {
              console.log("✅ New gameplay music element started successfully");
              // Replace the old reference if this succeeds
              if (gameplayMusicRef.current) {
                gameplayMusicRef.current.pause();
              }
              gameplayMusicRef.current = newGameplayMusic;
            }).catch(e => {
              console.error("Final retry with new element failed:", e);
              document.body.removeChild(newGameplayMusic);
            });
            document.body.appendChild(newGameplayMusic);
          } catch (e) {
            console.error("Error in final retry:", e);
          }
        }
      }, 4000));
      
      // Clean up all timers when the effect is cleaned up
      return () => {
        retryTimers.forEach(timer => clearTimeout(timer));
      };
    }

  }, [isGameStarted, isGameOver, isMuted]);
  
  // Completely revamped toggle mute function for better reliability
  const toggleMute = () => {
    // Log detailed info for debugging
    console.log("Toggle music button clicked!");
    console.log("Current state:", { isMuted, isGameStarted, isGameOver });
    console.log("Audio elements:", {
      introMusic: introMusicRef.current ? "exists" : "null",
      gameplayMusic: gameplayMusicRef.current ? "exists" : "null"
    });

    // Force immediate audio context unlock with multiple approaches
    try {
      // Method 1: Simple click
      const tempButton = document.createElement("button");
      document.body.appendChild(tempButton);
      tempButton.click();
      document.body.removeChild(tempButton);
      
      // Method 2: Try to trigger the global audio context if it exists
      if (window.PagertronAudio && window.PagertronAudio.context) {
        window.PagertronAudio.context.resume().catch(e => console.log("Context resume error:", e));
      }
      
      // Method 3: Create and play a silent buffer
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContext.resume().catch(e => console.log("Context resume error:", e));
    } catch (e) {
      console.log("Audio context unlock error:", e);
    }

    // Ensure audio elements exist or recreate them
    if (!introMusicRef.current) {
      console.log("Creating new intro music element");
      const introMusic = new Audio('/music/Race.mp3');
      introMusic.id = "intro-music";
      introMusic.loop = true;
      introMusic.volume = 0.5;
      introMusic.preload = "auto";
      document.body.appendChild(introMusic);
      introMusicRef.current = introMusic;
    }
    
    if (!gameplayMusicRef.current) {
      console.log("Creating new gameplay music element");
      const gameplayMusic = new Audio('/music/Fatality.mp3');
      gameplayMusic.id = "gameplay-music";
      gameplayMusic.loop = true;
      gameplayMusic.volume = 0.4;
      gameplayMusic.preload = "auto";
      document.body.appendChild(gameplayMusic);
      gameplayMusicRef.current = gameplayMusic;
    }
    
    // Now we definitely have audio elements
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
      // Unmute - determine which track to play
      try {
        if (isGameStarted && !isGameOver) {
          console.log("Game active - playing gameplay music");
          // Game is active - play gameplay music
          introMusic.pause();

          // Ensure gameplay music is ready
          gameplayMusic.load();
          gameplayMusic.currentTime = 0;
          gameplayMusic.volume = 0.4;

          // Aggressive approach to playing audio
          const playGameMusic = () => {
            console.log("Play attempt: gameplay music");
            try {
              const playPromise = gameplayMusic.play();
              if (playPromise !== undefined) {
                playPromise.catch(e => {
                  console.error("Gameplay music play failed:", e);
                  // Force a user interaction and try again
                  document.body.click();
                  setTimeout(() => {
                    try { gameplayMusic.play(); } catch(e) { console.error("Retry failed:", e); }
                  }, 100);
                });
              }
            } catch (e) {
              console.error("Error playing gameplay music:", e);
            }
          };

          // Try multiple times with increasing delays
          playGameMusic();
          setTimeout(playGameMusic, 200);
          setTimeout(playGameMusic, 500);
        } else {
          console.log("Menu/game over - playing intro music");
          // Menu/game over - play intro music
          gameplayMusic.pause();

          // Ensure intro music is ready
          introMusic.load();
          introMusic.currentTime = 0;
          introMusic.volume = 0.5;

          // Aggressive approach to playing audio
          const playIntroMusic = () => {
            console.log("Play attempt: intro music");
            try {
              const playPromise = introMusic.play();
              if (playPromise !== undefined) {
                playPromise.catch(e => {
                  console.error("Intro music play failed:", e);
                  // Force a user interaction and try again
                  document.body.click();
                  setTimeout(() => {
                    try { introMusic.play(); } catch(e) { console.error("Retry failed:", e); }
                  }, 100);
                });
              }
            } catch (e) {
              console.error("Error playing intro music:", e);
            }
          };

          // Try multiple times with increasing delays
          playIntroMusic();
          setTimeout(playIntroMusic, 200);
          setTimeout(playIntroMusic, 500);
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
          
          // Force a DOM trigger for autoplay policies
          document.body.click();
          
          // Add a dummy audio element and immediately play/pause it to unlock audio context
          try {
            const unlockAudio = document.createElement('audio');
            unlockAudio.setAttribute('src', '/music/Race.mp3');
            unlockAudio.load();
            unlockAudio.volume = 0;
            unlockAudio.play().then(() => {
              unlockAudio.pause();
              unlockAudio.remove();
            }).catch(e => console.log("Audio unlock failed:", e));
          } catch (e) {
            console.log("Audio unlock error:", e);
          }
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
        {isMuted ? '🔈 MENU MUSIC OFF' : '🔊 MENU MUSIC ON'}
      </button>
    </div>
  );
};

export default GameMusic;