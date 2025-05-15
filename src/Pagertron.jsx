import React, { useEffect, useState } from "react";
import './Pagertron.css';
import HighScoreModal from './HighScoreModal';
import HighScoreTicker from './HighScoreTicker';
// Import GameMusic with a key to force complete remount when game state changes
import GameMusic from './GameMusic';
import anthropicLogo from './assets/anthropic-logo.svg';
import claudeLogo from './assets/claude-logo.svg';

function PagerTron() {
  const SCREEN_WIDTH = 1280;
  const SCREEN_HEIGHT = 720;
  const PLAYER_SIZE = 50;
  const PAGER_SIZE = 50;
  const MISSILE_SIZE = 15;
  const KONAMI_MISSILE_SIZE = 15 * 5; // 75px
  const COLLISION_RADIUS = 20;
  const TRANSITION_DURATION = 2000;
  const SAFE_DISTANCE = 250; // Minimum distance from (640,360)

  // Helper: Generate random pager positions at least SAFE_DISTANCE away from (640,360)
  function generateRandomPagers(count) {
    const positions = [];
    for (let i = 0; i < count; i++) {
      let x, y;
      do {
        x = Math.floor(Math.random() * (SCREEN_WIDTH - PAGER_SIZE));
        y = Math.floor(Math.random() * (SCREEN_HEIGHT - PAGER_SIZE));
      } while (Math.sqrt((x - 640) ** 2 + (y - 360) ** 2) < SAFE_DISTANCE);
      positions.push({ id: i + 1, x, y });
    }
    return positions;
  }

  // Mobile device detection (phone, not tablet)
  const isMobile = /Mobi|Android.*Mobile/.test(navigator.userAgent);
  if (isMobile) {
    return (
      <div style={{
        backgroundColor: "#F25533",
        width: "100%",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        color: "white",
        fontFamily: "'Press Start 2P', cursive",
        padding: "20px",
        position: "relative"
      }}>
        <GameMusic
          key={`music-mobile-${Date.now()}`}
          isGameStarted={false}
          isGameOver={false}
        />
        <div style={{
          fontSize: "48px",
          color: "rgba(255, 255, 255, 0.2)",
          lineHeight: "1.2",
          maxWidth: "90%",
          margin: "0 auto"
        }}>
          Coming soon, check it out on your desktop for now
        </div>
      </div>
    );
  }

  // Regular game state variables
  const [pagers, setPagers] = useState(generateRandomPagers(7));
  const [gameStarted, setGameStarted] = useState(false);
  // Enhanced player state with rotation angle and velocity for Asteroids-style controls
  const [player, setPlayer] = useState({
    x: 640,
    y: 360,
    rotation: 0, // in degrees, 0 = up, 90 = right, etc.
    direction: "up", // kept for compatibility
    velocityX: 0,
    velocityY: 0
  });

  // Track close encounters for visual hitbox indicators
  const [closeEncounters, setCloseEncounters] = useState([]);
  const [missiles, setMissiles] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [konamiActive, setKonamiActive] = useState(false);
  const [konamiMessageVisible, setKonamiMessageVisible] = useState(false);

  // Finale effect state
  const [finaleActive, setFinaleActive] = useState(false);
  // finalComplete becomes true after a 5-second delay once finaleActive is triggered.
  const [finalComplete, setFinalComplete] = useState(false);
  const [finalMissiles, setFinalMissiles] = useState([]);
  const [explosions, setExplosions] = useState([]);
  const [showHighScoreModal, setShowHighScoreModal] = useState(false);

  const konamiCode = [
    "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight"
  ];
  const [konamiInput, setKonamiInput] = useState([]);

  // Track thruster state for visual effects
  const [thrusterActive, setThrusterActive] = useState(false);

  // Main game loop (runs when game is active and not over)
  useEffect(() => {
    if (!gameStarted || gameOver || isTransitioning) return;
    // Keep the original update rate for the main game loop
    const gameLoop = setInterval(() => {
      // First update player position based on velocity (Asteroids physics)
      setPlayer(prevPlayer => {
        // Apply current velocity to position
        let newX = prevPlayer.x + prevPlayer.velocityX;
        let newY = prevPlayer.y + prevPlayer.velocityY;

        // Apply drag/friction to gradually slow down
        const drag = 0.98; // Reduce velocity by 2% each frame
        const newVelocityX = prevPlayer.velocityX * drag;
        const newVelocityY = prevPlayer.velocityY * drag;

        // Handle screen wrapping (Asteroids style)
        if (newX < 0) newX = SCREEN_WIDTH;
        if (newX > SCREEN_WIDTH) newX = 0;
        if (newY < 0) newY = SCREEN_HEIGHT;
        if (newY > SCREEN_HEIGHT) newY = 0;

        // Auto-decay thruster effect if it's active
        if (thrusterActive) {
          setThrusterActive(Math.random() > 0.2); // 80% chance to keep it on each frame
        }

        return {
          ...prevPlayer,
          x: newX,
          y: newY,
          velocityX: newVelocityX,
          velocityY: newVelocityY
        };
      });

      // Then update missiles with vector-based movement
      setMissiles(prevMissiles => {
        const updatedMissiles = prevMissiles
          .map(missile => {
            // If missile has velocity components from the new system, use those
            if (missile.velocityX !== undefined && missile.velocityY !== undefined) {
              const missileSpeed = 12; // Faster than regular speed
              const newX = missile.x + missile.velocityX * missileSpeed;
              const newY = missile.y + missile.velocityY * missileSpeed;
              return { ...missile, x: newX, y: newY };
            }
            // Fallback to old direction-based movement
            else {
              let newX = missile.x;
              let newY = missile.y;
              const speed = 8;
              if (missile.direction === "up") newY -= speed;
              if (missile.direction === "down") newY += speed;
              if (missile.direction === "left") newX -= speed;
              if (missile.direction === "right") newX += speed;
              return { ...missile, x: newX, y: newY };
            }
          })
          .filter(
            missile =>
              missile.y > 0 &&
              missile.y < SCREEN_HEIGHT &&
              missile.x > 0 &&
              missile.x < SCREEN_WIDTH
          );

      setPagers(prevPagers => {
        let pagersToRemove = [];
        const updatedPagers = prevPagers
          .map(pager => {
            const baseSpeed = 1;
            const speed = baseSpeed * Math.pow(1.2, level - 1);
            const dx = player.x - pager.x;
            const dy = player.y - pager.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            let moveX = distance > 0 ? (dx / distance) * speed : 0;
            let moveY = distance > 0 ? (dy / distance) * speed : 0;
            if (Math.random() < 0.2) {
              const jitterAmount = speed * 0.5;
              const randomAngle = Math.random() * 2 * Math.PI;
              moveX += Math.cos(randomAngle) * jitterAmount;
              moveY += Math.sin(randomAngle) * jitterAmount;
            }
            return { ...pager, x: pager.x + moveX, y: pager.y + moveY };
          })
          .filter(pager => {
            const hitByMissile = updatedMissiles.some((missile, missileIndex) => {
              // Get the centers of the missile and pager
              const missileCenterX = missile.x;  // Missile coordinates already represent center
              const missileCenterY = missile.y;
              const pagerCenterX = pager.x + PAGER_SIZE / 2;
              const pagerCenterY = pager.y + PAGER_SIZE / 2;

              // Calculate distance between centers
              const distance = Math.sqrt(
                Math.pow(missileCenterX - pagerCenterX, 2) +
                Math.pow(missileCenterY - pagerCenterY, 2)
              );

              // Calculate effective collision radius based on actual sprite sizes
              // Use slightly larger hitbox for missiles to make hitting easier
              const missileSize = konamiActive ? KONAMI_MISSILE_SIZE : MISSILE_SIZE;
              const missileRadius = missileSize * 0.6;  // Larger than visual size for easier hits
              const pagerRadius = PAGER_SIZE * 0.4;     // Same as player collision
              const collisionDistance = missileRadius + pagerRadius;

              // Check if collision occurred
              if (distance < collisionDistance) {
                pagersToRemove.push(pager);
                setMissiles(prev => prev.filter((_, index) => index !== missileIndex));
                return true;
              }
              return false;
            });
            return !hitByMissile;
          });

        if (pagersToRemove.length > 0) {
          setScore(prevScore => prevScore + pagersToRemove.length * 10);
        }

        const playerHit = updatedPagers.some(pager => {
          // Get the centers of the player and pager
          const playerCenterX = player.x + PLAYER_SIZE / 2;
          const playerCenterY = player.y + PLAYER_SIZE / 2;
          const pagerCenterX = pager.x + PAGER_SIZE / 2;
          const pagerCenterY = pager.y + PAGER_SIZE / 2;

          // Calculate distance between centers
          const distance = Math.sqrt(
            Math.pow(playerCenterX - pagerCenterX, 2) +
            Math.pow(playerCenterY - pagerCenterY, 2)
          );

          // Calculate effective collision radius based on actual sprite sizes
          // Use 60% of the actual size for more forgiving hit detection
          const playerRadius = PLAYER_SIZE * 0.35;  // Smaller than visual size
          const pagerRadius = PAGER_SIZE * 0.4;    // Smaller than visual size
          const collisionDistance = playerRadius + pagerRadius;

          // Track close encounters for visual indicators
          const isClose = distance < collisionDistance * 1.8;
          const isCollision = distance < collisionDistance;

          // Update close encounters state
          if (isClose) {
            // Keep track of this pager as a close encounter
            setCloseEncounters(prev => {
              // Add this pager if not already tracked
              const exists = prev.some(enc => enc.pagerId === pager.id);
              if (!exists) {
                return [...prev, {
                  pagerId: pager.id,
                  distance: distance,
                  threshold: collisionDistance,
                  danger: distance / collisionDistance // 0-1 value, lower means closer to collision
                }];
              }
              // Update existing entry
              return prev.map(enc =>
                enc.pagerId === pager.id
                  ? { ...enc, distance, threshold: collisionDistance, danger: distance / collisionDistance }
                  : enc
              );
            });
          } else {
            // Remove this pager from close encounters if it exists
            setCloseEncounters(prev => prev.filter(enc => enc.pagerId !== pager.id));
          }

          return isCollision;
        });

        if (playerHit && !gameOver) {
          console.log("Player hit by pager!");
          setGameOver(true);
        }

        if (updatedPagers.length === 0) {
          setIsTransitioning(true);
          setTimeout(() => {
            setLevel(prevLevel => prevLevel + 1);
            setPagers(generateRandomPagers(7));
            setMissiles([]);
            // Reset close encounters for the new level
            setCloseEncounters([]);
            // Reset player position to center of screen with upward direction and no velocity
            setPlayer({
              x: 640,
              y: 360,
              rotation: 0,
              direction: "up",
              velocityX: 0,
              velocityY: 0
            });
            setIsTransitioning(false);
          }, TRANSITION_DURATION);
        }
        return updatedPagers;
      });
        return updatedMissiles;
      });
    }, 50);
    return () => clearInterval(gameLoop);
  }, [player, level, gameOver, isTransitioning, konamiActive, gameStarted]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!gameStarted) {
        if (event.key === " ") {
          setGameStarted(true);

          // Force a user interaction to help with audio context
          document.body.click();
        }
        return;
      }
      if (gameOver || isTransitioning) return;
      setPlayer(prev => {
        const rotationSpeed = 15; // degrees per key press
        const thrustPower = 0.5; // acceleration per key press
        const maxSpeed = 10; // maximum velocity

        // Get current state
        let newRotation = prev.rotation;
        let newVelocityX = prev.velocityX;
        let newVelocityY = prev.velocityY;
        let newDirection = prev.direction; // Keep for backward compatibility

        // Handle rotation with left/right arrows
        if (event.key === "ArrowLeft") {
          newRotation = (newRotation - rotationSpeed) % 360;
          if (newRotation < 0) newRotation += 360;
        }
        if (event.key === "ArrowRight") {
          newRotation = (newRotation + rotationSpeed) % 360;
        }

        // Handle forward thrust with up arrow
        if (event.key === "ArrowUp") {
          // Convert rotation to radians for math calculations
          const rotationRad = newRotation * Math.PI / 180;

          // Apply thrust in direction of rotation
          newVelocityX += Math.sin(rotationRad) * thrustPower;
          newVelocityY -= Math.cos(rotationRad) * thrustPower; // Y is inverted in screen coordinates

          // Cap maximum velocity
          const currentSpeed = Math.sqrt(newVelocityX * newVelocityX + newVelocityY * newVelocityY);
          if (currentSpeed > maxSpeed) {
            const scale = maxSpeed / currentSpeed;
            newVelocityX *= scale;
            newVelocityY *= scale;
          }

          // Activate thruster visual effect
          setThrusterActive(true);
        }

        // Set direction based on rotation for backward compatibility
        if (newRotation >= 315 || newRotation < 45) newDirection = "up";
        else if (newRotation >= 45 && newRotation < 135) newDirection = "right";
        else if (newRotation >= 135 && newRotation < 225) newDirection = "down";
        else if (newRotation >= 225 && newRotation < 315) newDirection = "left";

        // Keep position unchanged - it will be updated in the game loop
        return {
          ...prev,
          rotation: newRotation,
          direction: newDirection,
          velocityX: newVelocityX,
          velocityY: newVelocityY
        };
      });
      if (event.key === " ") {
        setMissiles(prev => {
          // Calculate the center of the player
          const centerX = player.x + PLAYER_SIZE / 2;
          const centerY = player.y + PLAYER_SIZE / 2;

          // Convert rotation to radians for missile direction
          const rotationRad = player.rotation * Math.PI / 180;

          // Calculate missile direction vector based on player rotation
          const missileDirectionX = Math.sin(rotationRad);
          const missileDirectionY = -Math.cos(rotationRad); // Y is inverted in screen coordinates

          // Add the missile with centered coordinates and rotation-based direction
          return [
            ...prev,
            {
              x: centerX,
              y: centerY,
              direction: player.direction, // Keep for backward compatibility
              rotation: player.rotation,
              velocityX: missileDirectionX,
              velocityY: missileDirectionY
            }
          ];
        });
      }

      // M key for music is now handled in a separate event listener

      const key = event.key;
      setKonamiInput(prev => {
        const newInput = [...prev, key];
        if (newInput.length > konamiCode.length) newInput.shift();
        const lastEight = newInput.slice(-konamiCode.length);
        if (JSON.stringify(lastEight) === JSON.stringify(konamiCode)) {
          setKonamiActive(true);
          setKonamiMessageVisible(true);
          setTimeout(() => setKonamiMessageVisible(false), 2000);
          console.log("Konami Code activated, konamiActive:", true);
          return [];
        }
        return newInput;
      });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameStarted, player, gameOver, isTransitioning, konamiCode]);

  // Music toggle is now only available through the button click
  // Removed M key handling to improve performance

  // When the player dies, trigger the finale effect immediately with no delay
  useEffect(() => {
    if (gameOver) {
      // Start finale immediately without delay
      setMissiles([]);
      setFinaleActive(true);
      // No timeout needed anymore
    }
  }, [gameOver]);

  // Finale: Launch missiles in all directions to clear the entire screen
  useEffect(() => {
    if (finaleActive) {
      // Store pager positions before clearing them for explosion effects
      const pagerPositions = pagers.map(pager => ({ x: pager.x, y: pager.y, id: pager.id }));

      // Force clear all pagers immediately to ensure clean wipe effect
      // We'll still create explosions at their last positions
      setPagers([]);
      setCloseEncounters([]); // Clear close encounters during finale

      const logoCenter = { x: 640, y: 360 };
      const missiles = [];

      // Create missiles targeting where pagers were (using stored positions)
      pagerPositions.forEach(target => {
        const dx = target.x - logoCenter.x;
        const dy = target.y - logoCenter.y;
        const mag = Math.sqrt(dx * dx + dy * dy);
        missiles.push({
          x: logoCenter.x,
          y: logoCenter.y,
          dx: dx / mag,
          dy: dy / mag,
          targetId: target.id
        });
      });

      // Use a smaller grid for better performance
      const gridSize = 6; // 6x6 grid = 36 missiles
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          // Calculate target positions across the screen
          const targetX = (SCREEN_WIDTH * (i + 0.5)) / gridSize;
          const targetY = (SCREEN_HEIGHT * (j + 0.5)) / gridSize;

          const dx = targetX - logoCenter.x;
          const dy = targetY - logoCenter.y;
          const mag = Math.sqrt(dx * dx + dy * dy);

          // Only add if this is a new direction (avoid duplicates)
          if (mag > 10) { // Avoid center point
            missiles.push({
              x: logoCenter.x,
              y: logoCenter.y,
              dx: dx / mag,
              dy: dy / mag
            });
          }
        }
      }

      setFinalMissiles(missiles);
    }
  }, [finaleActive]);

  // Finale: Update final missiles and create explosions as they go off-screen
  useEffect(() => {
    if (!finaleActive) return;

    // Use a slightly slower update interval for better performance
    const updateInterval = setInterval(() => {
      // Update missile positions
      setFinalMissiles(prevMissiles => {
        const newMissiles = prevMissiles.map(missile => ({
          ...missile,
          x: missile.x + missile.dx * 35, // Faster missile speed
          y: missile.y + missile.dy * 35, // Faster missile speed
        }));

        // Check for missiles that are now out of bounds
        const outOfBoundsMissiles = newMissiles.filter(missile =>
          missile.x < 0 || missile.x > SCREEN_WIDTH ||
          missile.y < 0 || missile.y > SCREEN_HEIGHT
        );

        // Create explosions at the positions of missiles that went out of bounds
        if (outOfBoundsMissiles.length > 0) {
          // Create explosions efficiently by batching updates
          const newExplosions = [];

          // Process fewer missiles per frame for better performance
          const maxMissilesToProcess = Math.min(outOfBoundsMissiles.length, 3);
          for (let m = 0; m < maxMissilesToProcess; m++) {
            const missile = outOfBoundsMissiles[m];
            const baseX = Math.max(0, Math.min(SCREEN_WIDTH, missile.x));
            const baseY = Math.max(0, Math.min(SCREEN_HEIGHT, missile.y));

            // Just one simple explosion per missile
            newExplosions.push({
              x: baseX,
              y: baseY,
              size: 70,
              createdAt: Date.now()
            });
          }

          // One single state update instead of multiple for better performance
          if (newExplosions.length > 0) {
            setExplosions(prev => [...prev, ...newExplosions]);
          }

          // Removed random explosions for better performance
        }

        // Keep only missiles that are still on screen
        return newMissiles.filter(missile =>
          missile.x >= 0 && missile.x <= SCREEN_WIDTH &&
          missile.y >= 0 && missile.y <= SCREEN_HEIGHT
        );
      });

      // Note: We no longer clear pagers here because they're already cleared when finaleActive is set

      // Simpler explosion cleanup for better performance
      setExplosions(prev => {
        // Limit both the lifetime and total count
        const filtered = prev.slice(-30); // Keep only the 30 most recent explosions
        return filtered.filter(explosion => Date.now() - explosion.createdAt < 500);
      });

    }, 50); // Return to original update rate

    return () => clearInterval(updateInterval);
  }, [finaleActive, SCREEN_WIDTH, SCREEN_HEIGHT, KONAMI_MISSILE_SIZE]);

  // When gameOver and finaleActive are true, use an optimized finale effect
  useEffect(() => {
    if (gameOver && finaleActive) {
      // Use a much shorter time for the screen clearing effect
      const timer = setTimeout(() => {
        // Create one final massive explosion effect before transitioning
        const centerX = SCREEN_WIDTH / 2;
        const centerY = SCREEN_HEIGHT / 2;

        // Create all explosions in one batch update for better performance
        const finalExplosions = [];

        // Create fewer explosions for better performance
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2; // Evenly spaced angles
          const distance = 150;
          finalExplosions.push({
            x: centerX + Math.cos(angle) * distance,
            y: centerY + Math.sin(angle) * distance,
            size: 150,
            createdAt: Date.now()
          });
        }

        // Single state update
        setExplosions(prev => [...prev, ...finalExplosions]);

        // Show high score modal after finale effect
        setTimeout(() => {
          setFinaleActive(false);
          setShowHighScoreModal(true); // Show high score modal first
        }, 500);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [gameOver, finaleActive, SCREEN_WIDTH, SCREEN_HEIGHT]);

  const handleCloseHighScoreModal = () => {
    setShowHighScoreModal(false);
    setFinalComplete(true);
  };

  const resetGame = () => {
    // Reset all game state variables
    setPagers(generateRandomPagers(7));
    setGameStarted(false);
    setPlayer({
      x: 640,
      y: 360,
      rotation: 0,
      direction: "up",
      velocityX: 0,
      velocityY: 0
    });
    setMissiles([]);
    setGameOver(false);
    setLevel(1);
    setScore(0);
    setIsTransitioning(false);
    setKonamiActive(false);
    setKonamiMessageVisible(false);
    setFinaleActive(false);
    setFinalComplete(false);
    setFinalMissiles([]);
    setExplosions([]);
    setKonamiInput([]);
    setThrusterActive(false);
    setCloseEncounters([]);
  };

  // --- Render High Score Modal ---
  if (showHighScoreModal) {
    return (
      <div style={{
        backgroundColor: "#F25533",
        width: `${SCREEN_WIDTH}px`,
        height: `${SCREEN_HEIGHT}px`,
        margin: "auto",
        border: "5px solid white",
        position: "relative"
      }}>
        <GameMusic
          key={`music-highscore-${Date.now()}`}
          isGameStarted={false}
          isGameOver={gameOver}
        />
        <HighScoreModal
          score={score}
          level={level}
          onClose={handleCloseHighScoreModal}
          isVisible={showHighScoreModal}
        />
      </div>
    );
  }

  // --- Render Final Screen if finalComplete is true ---
  if (finalComplete) {
    return (
      <div style={{
        backgroundColor: "#F25533",
        width: `${SCREEN_WIDTH}px`,
        height: `${SCREEN_HEIGHT}px`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        color: "white",
        fontFamily: "'Press Start 2P', cursive",
        border: "5px solid white",
        overflow: "hidden",
        margin: "auto",
        position: "relative",
        padding: "20px"
      }}>
        <GameMusic
          key={`music-finalscreen-${Date.now()}`}
          isGameStarted={false}
          isGameOver={true}
        />
        <img
          src="https://media.licdn.com/dms/image/v2/D4E0BAQFJhMcjf87eCA/company-logo_200_200/company-logo_200_200/0/1709897084853/incident_io_logo?e=2147483647&v=beta&t=YhaUWh2pX9QqQKlHsXxEjzyd6KCbH5ntKRAJ6fx2SP4"
          alt="Incident.io Logo"
          style={{ width: "200px", height: "200px" }}
        />
        <div style={{
          fontSize: "48px",
          lineHeight: "1",
          maxWidth: "80%",
          margin: "20px auto 0"
        }}>
          Move fast when you break things.
        </div>
        <div style={{ fontSize: "32px", marginTop: "10px" }}>
          all-in-one incident management
        </div>
        <div style={{ fontSize: "32px", marginTop: "10px" }}>
          <a
            href="https://incident.io"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "white", textDecoration: "underline" }}
          >
            get started at incident.io
          </a>
        </div>

        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px"
        }}>
          <button
            onClick={resetGame}
            style={{
              marginTop: "30px",
              padding: "15px 30px",
              fontSize: "24px",
              fontFamily: "'Press Start 2P', cursive",
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              color: "white",
              border: "3px solid white",
              borderRadius: "5px",
              cursor: "pointer",
              boxShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            PLAY AGAIN
          </button>

          <a
            href="https://incident.chilipiper.com/me/sofie-vanhal"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: "none"
            }}
          >
            <button
              style={{
                marginTop: "30px",
                padding: "15px 30px",
                fontSize: "24px",
                fontFamily: "'Press Start 2P', cursive",
                backgroundColor: "rgba(215, 118, 85, 0.8)",
                color: "white",
                border: "3px solid white",
                borderRadius: "5px",
                cursor: "pointer",
                boxShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(215, 118, 85, 1)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(215, 118, 85, 0.8)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              GET A DEMO
            </button>
          </a>
        </div>
      </div>
    );
  }

  // --- Regular Game Rendering ---
  return (
    <div style={{
      backgroundColor: "#F25533",
      color: "white",
      width: `${SCREEN_WIDTH}px`,
      height: `${SCREEN_HEIGHT}px`,
      position: "relative",
      margin: "auto",
      border: "5px solid white",
      overflow: "hidden"
    }}>
      {!gameStarted && (
        <GameMusic
          key={`music-menu-${Date.now()}`}
          isGameStarted={false}
          isGameOver={gameOver}
        />
      )}
      {/* Background Text Overlay */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        fontFamily: "'Press Start 2P', cursive",
        textAlign: "center",
        pointerEvents: "none",
        opacity: gameOver || isTransitioning ? 0 : 1,
        transition: "opacity 0.5s",
        zIndex: 0
      }}>
        <div style={{
          fontSize: "100px",
          color: "rgba(255, 255, 255, 0.2)",
          lineHeight: "1",
          maxWidth: "80%",
          margin: "0 auto"
        }}>
          PagerTron
        </div>
        <div style={{
          fontSize: "30px",
          color: "rgba(255, 255, 255, 0.6)",
          marginTop: "-10px"
        }}>
          vibe coded for Anthropic by incident.io
        </div>
      </div>

      {/* Press Spacebar to Start Overlay */}
      {!gameStarted && !gameOver && (
        <>
          <div style={{
            position: "absolute",
            bottom: "20%",
            width: "100%",
            textAlign: "center",
            fontFamily: "'Press Start 2P', cursive",
            fontSize: "24px",
            color: "white",
            textShadow: "2px 2px 0px #000",
            zIndex: 5,
          }}>
            <div style={{
              animation: "pulse 1s infinite alternate",
              textShadow: "0 0 5px #ff00ff, 0 0 10px #00ffff"
            }}>
              Press Spacebar to Start
            </div>
            <div className="insert-coin" style={{
              fontSize: "16px",
              marginTop: "15px",
              animation: "blink 1s step-end infinite"
            }}>
              INSERT COIN
            </div>
            <div style={{
              fontSize: "14px",
              marginTop: "30px",
              textShadow: "1px 1px 0px #000",
            }}>
              Use the button at the top to toggle music
            </div>
          </div>
          <HighScoreTicker />
        </>
      )}

      {/* Score Counter - arcade scoreboard style */}
      {gameStarted && (
        <div style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          fontSize: "24px",
          fontFamily: "'Press Start 2P', cursive",
          color: "#ffff00",
          textShadow: "0 0 5px #ff8800, 2px 2px 0px #000",
          opacity: isTransitioning ? 0 : 1,
          transition: "opacity 0.3s",
          zIndex: 1,
          whiteSpace: "nowrap",
          backgroundColor: "rgba(0,0,0,0.5)",
          padding: "5px 10px",
          borderRight: "2px solid #ff00ff",
          borderBottom: "2px solid #00ffff"
        }}>
          SCORE: {score}
        </div>
      )}

      {/* Level Counter - 80s arcade cabinet style */}
      {gameStarted && (
        <div style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          fontSize: "24px",
          fontFamily: "'Press Start 2P', cursive",
          color: "#88ff88",
          textShadow: "0 0 5px #00ff00, 2px 2px 0px #000",
          opacity: isTransitioning ? 0 : 1,
          transition: "opacity 0.3s",
          zIndex: 1,
          whiteSpace: "nowrap",
          backgroundColor: "rgba(0,0,0,0.5)",
          padding: "5px 10px",
          borderLeft: "2px solid #00ffff",
          borderBottom: "2px solid #ff00ff"
        }}>
          LEVEL: {level}
        </div>
      )}

      {/* Instructions */}
      {gameStarted && (
        <div style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          fontSize: "16px",
          fontFamily: "'Press Start 2P', cursive",
          color: "white",
          textShadow: "1px 1px 0px #000",
          whiteSpace: "nowrap",
          textAlign: "right",
          opacity: isTransitioning ? 0 : 1,
          transition: "opacity 0.3s",
          zIndex: 1
        }}>
          Instructions: Rotate: ← →, Thrust: ↑, Shoot: Spacebar, Score: 10 pts per pager
        </div>
      )}

      {/* Konami Code Activation Message */}
      {konamiMessageVisible && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "40px",
          fontFamily: "'Press Start 2P', cursive",
          color: "#00ff00",
          textShadow: "0 0 10px #00ff00, 0 0 20px #ff00ff",
          background: "rgba(0, 0, 0, 0.7)",
          padding: "10px 20px",
          borderRadius: "5px",
          zIndex: 3,
          animation: "pulse 0.5s infinite alternate"
        }}>
          Konami Code Activated!
        </div>
      )}

      {/* Transition Screen - full 80s arcade effect */}
      {isTransitioning && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "radial-gradient(circle, #ff00ff 0%, #00ffff 100%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          animation: "pulse 0.5s infinite alternate, crt-flicker 0.5s linear forwards",
          zIndex: 2,
          overflow: "hidden"
        }}>
          {/* Scanline effect */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: "linear-gradient(0deg, rgba(0,0,0,0.2) 50%, transparent 50%)",
            backgroundSize: "100% 4px",
            zIndex: 3,
            pointerEvents: "none",
            opacity: 0.3
          }}></div>

          {/* Level text */}
          <div style={{
            fontSize: "64px",
            fontFamily: "'Press Start 2P', cursive",
            color: "#00ff00",
            textShadow: "0 0 10px #00ff00, 0 0 20px #ff00ff, 0 0 30px #ff00ff",
            transform: "scale(1, 1.2)",
            animation: "pixel-shift 0.5s step-end infinite"
          }}>
            LEVEL {level + 1}
          </div>

          {/* Get ready text */}
          <div style={{
            fontSize: "24px",
            fontFamily: "'Press Start 2P', cursive",
            color: "#ffffff",
            textShadow: "0 0 5px #ffffff, 0 0 10px #00ffff",
            marginTop: "20px",
            animation: "blink 0.5s step-end infinite"
          }}>
            GET READY!
          </div>

          {/* Typical 80s patterns */}
          <div style={{
            position: "absolute",
            bottom: "50px",
            width: "80%",
            height: "20px",
            background: "repeating-linear-gradient(90deg, #ff00ff, #ff00ff 10px, #00ffff 10px, #00ffff 20px)",
            zIndex: 1
          }}></div>
        </div>
      )}

      {/* Removed Game Over Screen to avoid flashing before finale */}

      {/* Final Logo and Missile Effect */}
      {finaleActive && (
        <>
          <img
            src="https://media.licdn.com/dms/image/v2/D4E0BAQFJhMcjf87eCA/company-logo_200_200/company-logo_200_200/0/1709897084853/incident_io_logo?e=2147483647&v=beta&t=YhaUWh2pX9QqQKlHsXxEjzyd6KCbH5ntKRAJ6fx2SP4"
            alt="Incident.io Logo"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 10,
              width: "200px",
              height: "200px"
            }}
          />
          {/* Render explosions */}
          {explosions.map((explosion, i) => (
            <div
              key={`explosion-${i}`}
              style={{
                position: "absolute",
                width: `${explosion.size}px`,
                height: `${explosion.size}px`,
                left: `${explosion.x - explosion.size / 2}px`,
                top: `${explosion.y - explosion.size / 2}px`,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                opacity: 1 - (Date.now() - explosion.createdAt) / 1000,
                zIndex: 12
              }}
            >
              <img
                src={claudeLogo}
                alt="Claude Logo"
                style={{
                  width: `${explosion.size * 0.8}px`,
                  height: `${explosion.size * 0.8}px`,
                  filter: "drop-shadow(0 0 15px #ff00ff)",
                  borderRadius: `${explosion.size * 0.2}px`,
                  opacity: 0.9,
                  transform: `scale(${1 + Math.sin(Date.now() / 100) * 0.2})`,
                  animation: "pulse 0.3s infinite alternate"
                }}
              />
            </div>
          ))}

          {/* Render finale missiles */}
          {finalMissiles.map((missile, index) => (
            <div
              key={index}
              style={{
                position: "absolute",
                width: `${KONAMI_MISSILE_SIZE}px`,
                height: `${KONAMI_MISSILE_SIZE}px`,
                left: `${missile.x - KONAMI_MISSILE_SIZE / 2}px`,
                top: `${missile.y - KONAMI_MISSILE_SIZE / 2}px`,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 11,
                animation: "pulse 0.5s infinite alternate"
              }}
            >
              <div style={{
                fontSize: "60px",
                lineHeight: 1,
                filter: "drop-shadow(0 0 8px #ff8800)",
                position: "relative"
              }}>
                <img
                  src={claudeLogo}
                  alt="Claude Logo"
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px'
                  }}
                />
                {/* Add missile trail effect */}
                <div style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: `rotate(${Math.atan2(missile.dy, missile.dx) * 180 / Math.PI}deg)`,
                  width: "200%",
                  height: "100%",
                  opacity: 0.7,
                  filter: "blur(2px)",
                  pointerEvents: "none"
                }}>
                  <span style={{
                    position: "absolute",
                    right: "100%",
                    fontSize: "40px",
                    color: "#ffff00"
                  }}>
                    ✨✨✨
                  </span>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Player: Only shown if game is started and not over */}
      {gameStarted && !gameOver && (
        <div
          style={{
            position: "absolute",
            width: `${PLAYER_SIZE}px`,
            height: `${PLAYER_SIZE}px`,
            left: `${player.x}px`,
            top: `${player.y}px`,
            opacity: isTransitioning ? 0 : 1,
            transition: "opacity 0.3s",
            zIndex: 5,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            filter: "drop-shadow(0 0 5px #ff3300)",
            animation: "pulse 1s infinite alternate"
          }}
        >
          {/* Player hitbox visualization when near pagers */}
          {closeEncounters.length > 0 && (
            <div style={{
              position: "absolute",
              width: `${PLAYER_SIZE * 0.7}px`,
              height: `${PLAYER_SIZE * 0.7}px`,
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              border: "2px solid rgba(255, 255, 255, 0.5)",
              boxShadow: "0 0 10px rgba(255, 255, 255, 0.7)",
              opacity: 0.7,
              animation: "pulse 0.8s infinite alternate"
            }} />
          )}

          <div style={{
            lineHeight: 1,
            transform: `rotate(${player.rotation}deg)`,
            transition: "transform 0.1s ease",
            position: "relative"
          }}>
            <img
              src={claudeLogo}
              alt="Claude Logo"
              style={{
                width: '45px',
                height: '45px',
                filter: "drop-shadow(0 0 8px #D77655)",
                borderRadius: "12px"
              }}
            />
            {/* Direction indicator */}
            <div style={{
              position: "absolute",
              top: "-15px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "0",
              height: "0",
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderBottom: "15px solid #FCF2EE",
              filter: "drop-shadow(0 0 3px #D77655)"
            }}/>
            {/* Thruster effect when accelerating */}
            {thrusterActive && (
              <div style={{
                position: "absolute",
                bottom: "-70%", // Position behind the player
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: "24px",
                color: "#ffff00",
                filter: "drop-shadow(0 0 5px #ff8800)",
                transformOrigin: "center",
                animation: "pulse 0.2s infinite alternate",
                zIndex: -1
              }}>
                {Math.random() > 0.5 ? "✨" : "💫"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pagers - only show when game is in progress (not game over or finale) */}
      {gameStarted && !gameOver && !finaleActive && pagers.map(pager => {
        // Check if this pager is in close encounters
        const encounter = closeEncounters.find(enc => enc.pagerId === pager.id);
        const isClose = encounter !== undefined;
        // Calculate danger level (0-1, where closer to 0 is more dangerous)
        const dangerLevel = isClose ? encounter.danger : 1;
        // Color goes from green (safe) to red (danger)
        const dangerColor = isClose
          ? `rgba(${Math.min(255, 255 * (2 - 2 * dangerLevel))}, ${Math.min(255, 255 * (2 * dangerLevel))}, 0, ${Math.max(0.1, 0.6 - 0.5 * dangerLevel)})`
          : 'transparent';

        return (
          <div
            key={pager.id}
            style={{
              position: "absolute",
              width: `${PAGER_SIZE}px`,
              height: `${PAGER_SIZE}px`,
              fontSize: "40px",
              left: `${pager.x}px`,
              top: `${pager.y}px`,
              opacity: isTransitioning ? 0 : 1,
              transition: "opacity 0.3s",
              zIndex: 1
            }}
          >
            {/* Hitbox visualization when close to player */}
            {isClose && (
              <div style={{
                position: "absolute",
                width: `${PAGER_SIZE * 0.8}px`,
                height: `${PAGER_SIZE * 0.8}px`,
                left: `${PAGER_SIZE * 0.1}px`,
                top: `${PAGER_SIZE * 0.1}px`,
                borderRadius: "50%",
                backgroundColor: dangerColor,
                boxShadow: `0 0 ${10 + 10 * (1 - dangerLevel)}px ${dangerColor}`,
                opacity: Math.max(0.3, 1 - dangerLevel),
                transition: "all 0.2s ease",
                animation: dangerLevel < 0.5 ? "pulse 0.5s infinite alternate" : "none",
                zIndex: -1
              }} />
            )}
            📟
          </div>
        );
      })}

      {/* Missiles - 80s arcade style projectiles - only show during normal gameplay */}
      {gameStarted && !finaleActive && missiles.map((missile, index) => {
        // Calculate rotation angle for the missile
        const missileRotation = missile.rotation !== undefined
          ? missile.rotation // Use stored rotation if available
          : missile.direction === "left" ? 270
            : missile.direction === "right" ? 90
            : missile.direction === "down" ? 180 : 0;

        // Calculate trail position based on rotation
        const trailAngleRad = missileRotation * Math.PI / 180;
        const trailX = -Math.sin(trailAngleRad); // negative because we want opposite of direction
        const trailY = Math.cos(trailAngleRad); // no negative because y is inverted in screen coordinates

        return (
          <div
            key={index}
            style={{
              position: "absolute",
              width: `${konamiActive ? KONAMI_MISSILE_SIZE : MISSILE_SIZE}px`,
              height: `${konamiActive ? KONAMI_MISSILE_SIZE : MISSILE_SIZE}px`,
              // Center the missile by offsetting half the missile size
              left: `${missile.x - (konamiActive ? KONAMI_MISSILE_SIZE : MISSILE_SIZE) / 2}px`,
              top: `${missile.y - (konamiActive ? KONAMI_MISSILE_SIZE : MISSILE_SIZE) / 2}px`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              opacity: isTransitioning ? 0 : 1,
              transition: "opacity 0.3s",
              zIndex: 3,
              animation: konamiActive ? "pulse 0.5s infinite alternate" : undefined
            }}
          >
            <div style={{
              fontSize: `${konamiActive ? 60 : 24}px`,
              lineHeight: 1,
              filter: "drop-shadow(0 0 5px #ff8800)",
              transform: `rotate(${missileRotation}deg)`,
              // Add trail effect for missiles
              position: "relative"
            }}>
              {konamiActive ? (
                <img
                  src={claudeLogo}
                  alt="Claude Logo"
                  style={{
                    width: '60px',
                    height: '60px',
                    filter: "drop-shadow(0 0 8px #D77655)",
                    borderRadius: "12px"
                  }}
                />
              ) : (
                <img
                  src={claudeLogo}
                  alt="Claude Logo"
                  style={{
                    width: '24px',
                    height: '24px',
                    filter: "drop-shadow(0 0 5px #D77655)",
                    borderRadius: "6px"
                  }}
                />
              )}
              {/* Vector-based missile trail that works in any direction */}
              <div style={{
                position: "absolute",
                opacity: 0.7,
                filter: "blur(2px)",
                fontSize: `${konamiActive ? 30 : 15}px`,
                color: "#FCF2EE",
                textAlign: "center",
                // Position trail based on the missile's rotation vector
                // This ensures trails always appear behind the missile
                top: `${trailY * 100}%`,
                left: `${trailX * 100}%`,
                transform: `translate(${trailX < 0 ? '0' : '-100%'}, ${trailY < 0 ? '0' : '-100%'})`,
                whiteSpace: "nowrap"
              }}>
                {/* Add multiple sparkles for Konami mode */}
                {konamiActive ? "✨✨✨" : "✨"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PagerTron;