//
//  GameViewModel.swift
//  Pagertron
//
//  Created by Tom Wentworth on 7/1/25.
//

import Foundation
import SwiftUI
import Combine

class GameViewModel: ObservableObject {
    @Published var gameState: GameState = .menu
    @Published var player = Player()
    @Published var pagers: [Pager] = []
    @Published var missiles: [Missile] = []
    @Published var explosions: [Explosion] = []
    @Published var floatingScores: [FloatingScore] = []
    @Published var bug: Bug? = nil
    
    @Published var level: Int = 1
    @Published var score: Int = 0
    
    @Published var konamiActive = false
    @Published var konamiInput: [String] = []
    @Published var invertControls: Bool = false
    
    // Galaga-style stats tracking
    @Published var totalMissilesFired: Int = 0
    @Published var totalPagersKilled: Int = 0
    @Published var totalBugsKilled: Int = 0
    
    var hitRate: Double {
        if totalMissilesFired == 0 { return 0.0 }
        return Double(totalPagersKilled + totalBugsKilled) / Double(totalMissilesFired) * 100.0
    }
    
    private var gameTimer: Timer?
    private var lastUpdateTime: Date = Date()
    private var rotationDirection: Int = 0 // -1 for left, 1 for right, 0 for none
    private var isShooting: Bool = false
    private var lastShotTime: Date = Date()
    private var bugSpawnTimer: Timer?
    private var bugHasAppearedThisLevel: Bool = false
    
    private let konamiCode = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight"]
    
    init() {
        setupGame()
        loadSettings()
        // Start with intro music
        AudioManager.shared.playIntroMusic()
    }
    
    func startGame() {
        setupGame()
        gameState = .playing
        setupLevel()
        startGameLoop()
        // Switch to gameplay music
        AudioManager.shared.playGameplayMusic()
    }
    
    func setupGame() {
        level = 1
        score = 0
        player = Player()
        pagers = []
        missiles = []
        explosions = []
        floatingScores = []
        bug = nil
        konamiActive = false
        konamiInput = []
        bugHasAppearedThisLevel = false
        bugSpawnTimer?.invalidate()
        
        // Reset stats tracking
        totalMissilesFired = 0
        totalPagersKilled = 0
        totalBugsKilled = 0
    }
    
    func setupLevel() {
        let pagerCount = 5 + level
        pagers = generateRandomPagers(count: pagerCount)
        missiles = []
        explosions = []
        floatingScores = []
        bug = nil
        bugHasAppearedThisLevel = false
        bugSpawnTimer?.invalidate()
        scheduleBugSpawn()
        print("Setup level \(level) with \(pagerCount) pagers")
    }
    
    private func generateRandomPagers(count: Int) -> [Pager] {
        var newPagers: [Pager] = []
        let centerX = GameConstants.screenWidth / 2
        let centerY = GameConstants.screenHeight / 2
        
        for _ in 0..<count {
            var position: CGPoint
            repeat {
                position = CGPoint(
                    x: CGFloat.random(in: 0...(GameConstants.screenWidth - GameConstants.pagerSize)),
                    y: CGFloat.random(in: 0...(GameConstants.screenHeight - GameConstants.pagerSize))
                )
            } while distance(from: position, to: CGPoint(x: centerX, y: centerY)) < GameConstants.safeDistance
            
            newPagers.append(Pager(position: position))
        }
        
        return newPagers
    }
    
    private func distance(from: CGPoint, to: CGPoint) -> CGFloat {
        let dx = from.x - to.x
        let dy = from.y - to.y
        return sqrt(dx * dx + dy * dy)
    }
    
    func startGameLoop() {
        gameTimer?.invalidate()
        lastUpdateTime = Date()
        
        gameTimer = Timer.scheduledTimer(withTimeInterval: 1.0/60.0, repeats: true) { _ in
            DispatchQueue.main.async {
                self.updateGame()
            }
        }
    }
    
    func stopGameLoop() {
        gameTimer?.invalidate()
        bugSpawnTimer?.invalidate()
    }
    
    private func scheduleBugSpawn() {
        guard !bugHasAppearedThisLevel else { return }
        
        let spawnDelay = Double.random(in: 3.0...8.0)
        bugSpawnTimer = Timer.scheduledTimer(withTimeInterval: spawnDelay, repeats: false) { _ in
            DispatchQueue.main.async {
                self.spawnBug()
            }
        }
    }
    
    private func spawnBug() {
        guard !bugHasAppearedThisLevel && bug == nil && gameState == .playing else { return }
        
        let centerX = GameConstants.screenWidth / 2
        let centerY = GameConstants.screenHeight / 2
        
        var position: CGPoint
        repeat {
            position = CGPoint(
                x: CGFloat.random(in: 0...(GameConstants.screenWidth - GameConstants.bugSize)),
                y: CGFloat.random(in: 0...(GameConstants.screenHeight - GameConstants.bugSize))
            )
        } while distance(from: position, to: CGPoint(x: centerX, y: centerY)) < GameConstants.safeDistance
        
        bug = Bug(position: position)
        bugHasAppearedThisLevel = true
        print("Bug spawned at level \(level)")
    }
    
    private func updateGame() {
        let currentTime = Date()
        let deltaTime = currentTime.timeIntervalSince(lastUpdateTime)
        lastUpdateTime = currentTime
        
        guard gameState == .playing else { return }
        
        // Update player
        if player.isThrusting {
            player.thrust(deltaTime: deltaTime)
        }
        
        // Handle continuous rotation (only for button-based controls)
        // Virtual joystick sets rotation directly, so skip this for joystick input
        if rotationDirection != 0 {
            let rotationSpeed = 180.0 // degrees per second
            player.rotate(by: Double(rotationDirection) * rotationSpeed * deltaTime)
        }
        
        // Handle continuous shooting (after initial shot)
        if isShooting {
            let currentTime = Date()
            let shotInterval = 0.12 // Faster rate for better responsiveness
            if currentTime.timeIntervalSince(lastShotTime) >= shotInterval {
                let missile = Missile(
                    position: player.position,
                    direction: player.rotation,
                    isKonami: konamiActive
                )
                missiles.append(missile)
                totalMissilesFired += 1
                lastShotTime = currentTime
            }
        }
        
        player.update(deltaTime: deltaTime)
        
        // Update missiles
        missiles = missiles.compactMap { missile in
            var updatedMissile = missile
            updatedMissile.update(deltaTime: deltaTime)
            return updatedMissile.shouldRemove ? nil : updatedMissile
        }
        
        // Update pagers
        pagers = pagers.compactMap { pager in
            var updatedPager = pager
            updatedPager.update(deltaTime: deltaTime, playerPosition: player.position, level: level)
            return updatedPager.shouldRemove ? nil : updatedPager
        }
        
        // Update explosions
        explosions = explosions.compactMap { explosion in
            var updatedExplosion = explosion
            updatedExplosion.update(deltaTime: deltaTime)
            return updatedExplosion.shouldRemove ? nil : updatedExplosion
        }
        
        // Update floating scores
        floatingScores = floatingScores.compactMap { floatingScore in
            var updatedScore = floatingScore
            updatedScore.update(deltaTime: deltaTime)
            return updatedScore.shouldRemove ? nil : updatedScore
        }
        
        // Update bug
        if var currentBug = bug {
            currentBug.update(deltaTime: deltaTime)
            if currentBug.shouldRemove {
                bug = nil
            } else {
                bug = currentBug
            }
        }
        
        // Check collisions
        checkCollisions()
        
        // Check level completion
        if pagers.isEmpty {
            // Clear the bug when level is complete
            bug = nil
            // Use async to avoid publishing changes during view updates
            DispatchQueue.main.async {
                self.nextLevel()
            }
        }
    }
    
    private func checkCollisions() {
        // Missile-Pager collisions
        for (missileIndex, missile) in missiles.enumerated().reversed() {
            for (pagerIndex, pager) in pagers.enumerated().reversed() {
                if !pager.isExploding && 
                   distance(from: missile.position, to: pager.position) < GameConstants.collisionRadius {
                    
                    // Remove missile
                    missiles.remove(at: missileIndex)
                    
                    // Explode pager
                    pagers[pagerIndex].isExploding = true
                    explosions.append(Explosion(position: pager.position))
                    
                    // Add score
                    let points = konamiActive ? 200 : 100
                    score += points
                    floatingScores.append(FloatingScore(score: points, position: pager.position))
                    
                    // Track pager kill
                    totalPagersKilled += 1
                    
                    break
                }
            }
        }
        
        // Missile-Bug collisions
        if let currentBug = bug {
            for (missileIndex, missile) in missiles.enumerated().reversed() {
                let bugRadius = GameConstants.bugSize / 2
                let missileRadius = missile.isKonami ? GameConstants.konamiMissileSize / 2 : GameConstants.missileSize / 2
                let bugCenter = CGPoint(x: currentBug.position.x + bugRadius, y: currentBug.position.y + bugRadius)
                
                if distance(from: missile.position, to: bugCenter) < bugRadius + missileRadius {
                    // Remove missile
                    missiles.remove(at: missileIndex)
                    
                    // Add explosion
                    explosions.append(Explosion(position: bugCenter))
                    
                    // Award 500 points for bug kill
                    score += 500
                    floatingScores.append(FloatingScore(score: 500, position: bugCenter, isBugScore: true))
                    
                    // Track bug kill
                    totalBugsKilled += 1
                    
                    // Remove bug
                    bug = nil
                    
                    print("Bug killed! +500 points")
                    break
                }
            }
        }
        
        // Player-Pager collisions - only if game is playing and player is not invulnerable
        if gameState == .playing && !player.isInvulnerable {
            for pager in pagers {
                if !pager.isExploding &&
                   distance(from: player.position, to: pager.position) < GameConstants.collisionRadius {
                    playerHit()
                    break
                }
            }
        }
    }
    
    private func playerHit() {
        // Prevent multiple hits in the same frame
        guard gameState == .playing else { return }
        
        // Add explosion at player position
        explosions.append(Explosion(position: player.position, duration: 1.5))
        
        // Use async to avoid publishing changes during view updates
        DispatchQueue.main.async {
            self.gameOver()
        }
    }
    
    private func gameOver() {
        gameState = .gameOver
        stopGameLoop()
        // Switch back to intro music
        AudioManager.shared.playIntroMusic()
    }
    
    private func nextLevel() {
        level += 1
        
        // Always clear all game objects at level end for clean transition
        missiles = []
        explosions = []
        floatingScores = []
        bug = nil
        
        // Show interstitial every 5 levels
        if level % 5 == 1 && level > 1 {
            gameState = .interstitial
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 10.0) {
                self.gameState = .transitioning
                
                DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                    self.setupLevel()
                    self.gameState = .playing
                }
            }
        } else {
            gameState = .transitioning
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                self.setupLevel()
                self.gameState = .playing
            }
        }
    }
    
    // MARK: - Input Handling
    
    func thrustPlayer() {
        guard gameState == .playing else { return }
        player.thrust(deltaTime: 1.0/60.0)
    }
    
    func setThrusting(_ isThrusting: Bool) {
        guard gameState == .playing else { return }
        player.isThrusting = isThrusting
    }
    
    func setRotating(_ direction: Int) {
        guard gameState == .playing else { return }
        rotationDirection = direction
    }
    
    func setShooting(_ isShooting: Bool) {
        guard gameState == .playing else { return }
        self.isShooting = isShooting
        if isShooting {
            // Fire immediately when button is first pressed
            let missile = Missile(
                position: player.position,
                direction: player.rotation,
                isKonami: konamiActive
            )
            missiles.append(missile)
            totalMissilesFired += 1
            lastShotTime = Date()
        }
    }
    
    func setPlayerRotation(_ degrees: Double) {
        guard gameState == .playing else { return }
        player.rotation = degrees
    }
    
    func rotatePlayer(by angle: Double) {
        guard gameState == .playing else { return }
        player.rotate(by: angle)
    }
    
    func shootMissile() {
        guard gameState == .playing else { return }
        
        let missile = Missile(
            position: player.position,
            direction: player.rotation,
            isKonami: konamiActive
        )
        missiles.append(missile)
        totalMissilesFired += 1
    }
    
    func handleKonamiInput(_ input: String) {
        konamiInput.append(input)
        
        if konamiInput.count > konamiCode.count {
            konamiInput.removeFirst()
        }
        
        if konamiInput == konamiCode {
            konamiActive = true
            konamiInput = []
            
            // Deactivate after 30 seconds
            DispatchQueue.main.asyncAfter(deadline: .now() + 30.0) {
                self.konamiActive = false
            }
        }
    }
    
    private func loadSettings() {
        invertControls = UserDefaults.standard.bool(forKey: "invert_movement_controls")
        
        // Listen for settings changes
        NotificationCenter.default.addObserver(
            forName: UserDefaults.didChangeNotification,
            object: nil,
            queue: .main
        ) { _ in
            DispatchQueue.main.async {
                self.invertControls = UserDefaults.standard.bool(forKey: "invert_movement_controls")
            }
        }
    }
    
    deinit {
        stopGameLoop()
        bugSpawnTimer?.invalidate()
        NotificationCenter.default.removeObserver(self)
    }
}