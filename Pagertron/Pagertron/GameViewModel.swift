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
    
    @Published var level: Int = 1
    @Published var score: Int = 0
    
    @Published var konamiActive = false
    @Published var konamiInput: [String] = []
    
    private var gameTimer: Timer?
    private var lastUpdateTime: Date = Date()
    private var rotationDirection: Int = 0 // -1 for left, 1 for right, 0 for none
    private var isShooting: Bool = false
    private var lastShotTime: Date = Date()
    
    private let konamiCode = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight"]
    
    init() {
        setupGame()
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
        konamiActive = false
        konamiInput = []
    }
    
    func setupLevel() {
        let pagerCount = 5 + level
        pagers = generateRandomPagers(count: pagerCount)
        missiles = []
        explosions = []
        floatingScores = []
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
        
        // Check collisions
        checkCollisions()
        
        // Check level completion
        if pagers.isEmpty {
            nextLevel()
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
        
        // Immediately start game over process
        gameOver()
    }
    
    private func gameOver() {
        gameState = .gameOver
        stopGameLoop()
        // Switch back to intro music
        AudioManager.shared.playIntroMusic()
    }
    
    private func nextLevel() {
        level += 1
        gameState = .transitioning
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            self.setupLevel()
            self.gameState = .playing
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
    
    deinit {
        stopGameLoop()
    }
}