//
//  GameModels.swift
//  Pagertron
//
//  Created by Tom Wentworth on 7/1/25.
//

import Foundation
import SwiftUI

struct GameConstants {
    static var screenWidth: CGFloat { UIScreen.main.bounds.width }
    static var screenHeight: CGFloat { UIScreen.main.bounds.height }
    static let playerSize: CGFloat = 30
    static let pagerSize: CGFloat = 30
    static let missileSize: CGFloat = 8
    static let konamiMissileSize: CGFloat = 40
    static let bugSize: CGFloat = 50
    static let collisionRadius: CGFloat = 20
    static let safeDistance: CGFloat = 150
    static let playerSpeed: CGFloat = 200
    static let missileSpeed: CGFloat = 300
    static let friction: CGFloat = 0.95
    static let thrustPower: CGFloat = 350
}

struct Player {
    var position: CGPoint
    var velocity: CGPoint
    var rotation: Double // in degrees
    var isThrusting: Bool
    var invulnerableTime: Double
    
    init() {
        self.position = CGPoint(x: GameConstants.screenWidth / 2, y: GameConstants.screenHeight / 2)
        self.velocity = CGPoint.zero
        self.rotation = 0
        self.isThrusting = false
        self.invulnerableTime = 0
    }
    
    init(withInvulnerability: Bool = false) {
        self.position = CGPoint(x: GameConstants.screenWidth / 2, y: GameConstants.screenHeight / 2)
        self.velocity = CGPoint.zero
        self.rotation = 0
        self.isThrusting = false
        self.invulnerableTime = withInvulnerability ? 3.0 : 0
    }
    
    mutating func update(deltaTime: Double) {
        // Update invulnerability
        if invulnerableTime > 0 {
            invulnerableTime -= deltaTime
            if invulnerableTime < 0 {
                invulnerableTime = 0
            }
        }
        
        // Apply friction
        velocity.x *= GameConstants.friction
        velocity.y *= GameConstants.friction
        
        // Update position
        position.x += velocity.x * deltaTime
        position.y += velocity.y * deltaTime
        
        // Wrap around screen edges
        if position.x < 0 { position.x = GameConstants.screenWidth }
        if position.x > GameConstants.screenWidth { position.x = 0 }
        if position.y < 0 { position.y = GameConstants.screenHeight }
        if position.y > GameConstants.screenHeight { position.y = 0 }
    }
    
    var isInvulnerable: Bool {
        return invulnerableTime > 0
    }
    
    mutating func thrust(deltaTime: Double) {
        let radians = rotation * .pi / 180
        let thrustX = sin(radians) * GameConstants.thrustPower * deltaTime
        let thrustY = -cos(radians) * GameConstants.thrustPower * deltaTime
        
        velocity.x += thrustX
        velocity.y += thrustY
    }
    
    mutating func rotate(by angle: Double) {
        rotation += angle
        while rotation >= 360 { rotation -= 360 }
        while rotation < 0 { rotation += 360 }
    }
}

struct Pager {
    let id: UUID
    var position: CGPoint
    var isExploding: Bool
    var explosionTime: Double
    
    init(position: CGPoint) {
        self.id = UUID()
        self.position = position
        self.isExploding = false
        self.explosionTime = 0
    }
    
    mutating func update(deltaTime: Double, playerPosition: CGPoint, level: Int) {
        if isExploding {
            explosionTime += deltaTime
        } else {
            // Move toward player
            let dx = playerPosition.x - position.x
            let dy = playerPosition.y - position.y
            let distance = sqrt(dx * dx + dy * dy)
            
            if distance > 0 {
                // Base speed starts slow, increases 10% per level
                let baseSpeed: CGFloat = 25
                let speedMultiplier = pow(1.1, Double(level - 1))
                let speed = baseSpeed * speedMultiplier
                
                let normalizedDx = dx / distance
                let normalizedDy = dy / distance
                
                position.x += normalizedDx * speed * deltaTime
                position.y += normalizedDy * speed * deltaTime
            }
        }
    }
    
    mutating func update(deltaTime: Double) {
        if isExploding {
            explosionTime += deltaTime
        }
    }
    
    var shouldRemove: Bool {
        return isExploding && explosionTime > 0.5
    }
}

struct Missile {
    let id: UUID
    var position: CGPoint
    var velocity: CGPoint
    var isKonami: Bool
    var timeAlive: Double
    
    init(position: CGPoint, direction: Double, isKonami: Bool = false) {
        self.id = UUID()
        self.position = position
        self.isKonami = isKonami
        self.timeAlive = 0
        
        let radians = direction * .pi / 180
        let speed = GameConstants.missileSpeed
        self.velocity = CGPoint(
            x: sin(radians) * speed,
            y: -cos(radians) * speed
        )
    }
    
    mutating func update(deltaTime: Double) {
        position.x += velocity.x * deltaTime
        position.y += velocity.y * deltaTime
        timeAlive += deltaTime
    }
    
    var shouldRemove: Bool {
        return timeAlive > 3.0 || 
               position.x < -50 || position.x > GameConstants.screenWidth + 50 ||
               position.y < -50 || position.y > GameConstants.screenHeight + 50
    }
}

struct Explosion {
    let id: UUID
    let position: CGPoint
    var time: Double
    let duration: Double
    
    init(position: CGPoint, duration: Double = 0.5) {
        self.id = UUID()
        self.position = position
        self.time = 0
        self.duration = duration
    }
    
    mutating func update(deltaTime: Double) {
        time += deltaTime
    }
    
    var shouldRemove: Bool {
        return time >= duration
    }
    
    var scale: CGFloat {
        let progress = time / duration
        return 1.0 + progress * 2.0
    }
    
    var opacity: Double {
        let progress = time / duration
        return 1.0 - progress
    }
}

struct Bug {
    let id: UUID
    var position: CGPoint
    var velocity: CGPoint
    var timeAlive: Double
    
    init(position: CGPoint) {
        self.id = UUID()
        self.position = position
        self.timeAlive = 0
        
        // Random diagonal movement
        let speed: CGFloat = 100
        let angle = Double.random(in: 0...(2 * .pi))
        self.velocity = CGPoint(
            x: cos(angle) * speed,
            y: sin(angle) * speed
        )
    }
    
    mutating func update(deltaTime: Double) {
        position.x += velocity.x * deltaTime
        position.y += velocity.y * deltaTime
        timeAlive += deltaTime
        
        // Bounce off screen edges
        if position.x <= 0 || position.x >= GameConstants.screenWidth - GameConstants.bugSize {
            velocity.x = -velocity.x
            position.x = max(0, min(GameConstants.screenWidth - GameConstants.bugSize, position.x))
        }
        if position.y <= 0 || position.y >= GameConstants.screenHeight - GameConstants.bugSize {
            velocity.y = -velocity.y
            position.y = max(0, min(GameConstants.screenHeight - GameConstants.bugSize, position.y))
        }
    }
    
    var shouldRemove: Bool {
        return timeAlive > 10.0 // Remove after 10 seconds if not killed
    }
}

struct FloatingScore {
    let id: UUID
    let text: String
    var position: CGPoint
    var time: Double
    let duration: Double
    let isBugScore: Bool
    
    init(score: Int, position: CGPoint, isBugScore: Bool = false) {
        self.id = UUID()
        self.text = isBugScore ? "SQUASHED THE BUG +\(score)" : "+\(score)"
        self.position = position
        self.time = 0
        self.duration = 1.5
        self.isBugScore = isBugScore
    }
    
    mutating func update(deltaTime: Double) {
        time += deltaTime
        position.y -= 50 * deltaTime // Float upward
    }
    
    var shouldRemove: Bool {
        return time >= duration
    }
    
    var opacity: Double {
        let progress = time / duration
        return 1.0 - progress
    }
}

enum GameState {
    case menu
    case playing
    case transitioning
    case interstitial
    case gameOver
    case finale
}