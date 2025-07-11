//
//  GameView.swift
//  Pagertron
//
//  Created by Tom Wentworth on 7/1/25.
//

import SwiftUI

struct GameView: View {
    @ObservedObject var gameVM: GameViewModel
    @State private var joystickOffset: CGSize = .zero
    @State private var joystickActive = false
    @State private var joystickCenter: CGPoint = CGPoint(x: 100, y: 600)
    @State private var isTouchingShooting = false
    
    var body: some View {
        ZStack {
            // Main game area
            Canvas { context, size in
                drawGame(context: context, size: size)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .clipped()
            
            // HUD overlay
            HUDView(gameVM: gameVM)
            
            // Modern touch controls
            ModernControlsView(
                gameVM: gameVM, 
                joystickOffset: $joystickOffset, 
                joystickActive: $joystickActive,
                joystickCenter: $joystickCenter,
                isTouchingShooting: $isTouchingShooting
            )
        }
    }
    
    private func drawGame(context: GraphicsContext, size: CGSize) {
        // Draw stars background
        drawStars(context: context, size: size)
        
        // Draw pagers
        for pager in gameVM.pagers {
            drawPager(context: context, pager: pager)
        }
        
        // Draw bug
        if let bug = gameVM.bug {
            drawBug(context: context, bug: bug)
        }
        
        // Draw missiles
        for missile in gameVM.missiles {
            drawMissile(context: context, missile: missile)
        }
        
        // Draw player
        drawPlayer(context: context, player: gameVM.player)
        
        // Draw explosions
        for explosion in gameVM.explosions {
            drawExplosion(context: context, explosion: explosion)
        }
        
        // Draw floating scores
        for floatingScore in gameVM.floatingScores {
            drawFloatingScore(context: context, floatingScore: floatingScore)
        }
    }
    
    private func drawStars(context: GraphicsContext, size: CGSize) {
        // Simple star field background
        for i in 0..<100 {
            let x = CGFloat((i * 37) % Int(size.width))
            let y = CGFloat((i * 73) % Int(size.height))
            let brightness = CGFloat(0.1 + (Double(i) * 0.007).truncatingRemainder(dividingBy: 0.4))
            
            context.fill(
                Path(ellipseIn: CGRect(x: x, y: y, width: 2, height: 2)),
                with: .color(.white.opacity(brightness))
            )
        }
    }
    
    private func drawPlayer(context: GraphicsContext, player: Player) {
        var context = context
        
        context.translateBy(x: player.position.x, y: player.position.y)
        context.rotate(by: Angle(degrees: player.rotation))
        context.translateBy(x: -player.position.x, y: -player.position.y)
        
        // Calculate opacity for invulnerability flashing effect
        let opacity: Double = {
            if player.isInvulnerable {
                // Flash every 0.2 seconds during invulnerability
                let flashTime = player.invulnerableTime.truncatingRemainder(dividingBy: 0.2)
                return flashTime < 0.1 ? 0.3 : 1.0
            } else {
                return 1.0
            }
        }()
        
        // Draw fire emoji as player with opacity
        if opacity > 0.5 { // Only draw when visible (not in fade-out phase)
            let playerText = Text("🔥")
                .font(.system(size: GameConstants.playerSize))
            
            context.draw(playerText, at: player.position)
        }
        
        // Draw thruster effect if thrusting (also respect invulnerability opacity)
        if player.isThrusting {
            let thrusterRect = CGRect(
                x: player.position.x - 10,
                y: player.position.y + GameConstants.playerSize / 2,
                width: 20,
                height: 15
            )
            
            context.fill(
                Path(ellipseIn: thrusterRect),
                with: .color(.orange.opacity(0.7 * opacity))
            )
        }
    }
    
    private func drawPager(context: GraphicsContext, pager: Pager) {
        if pager.isExploding {
            // Draw explosion effect
            let explosionSize = GameConstants.pagerSize * (1 + CGFloat(pager.explosionTime * 4))
            let explosionRect = CGRect(
                x: pager.position.x - explosionSize / 2,
                y: pager.position.y - explosionSize / 2,
                width: explosionSize,
                height: explosionSize
            )
            
            context.fill(
                Path(ellipseIn: explosionRect),
                with: .color(.red.opacity(1.0 - pager.explosionTime * 2))
            )
        } else {
            // Draw pager emoji
            let pagerText = Text("📟")
                .font(.system(size: GameConstants.pagerSize))
            
            context.draw(pagerText, at: pager.position)
        }
    }
    
    private func drawMissile(context: GraphicsContext, missile: Missile) {
        let missileSize = missile.isKonami ? GameConstants.konamiMissileSize : GameConstants.missileSize
        let missileRect = CGRect(
            x: missile.position.x - missileSize / 2,
            y: missile.position.y - missileSize / 2,
            width: missileSize,
            height: missileSize
        )
        
        let color: Color = missile.isKonami ? .purple : .yellow
        
        context.fill(
            Path(ellipseIn: missileRect),
            with: .color(color)
        )
    }
    
    private func drawExplosion(context: GraphicsContext, explosion: Explosion) {
        let explosionRect = CGRect(
            x: explosion.position.x - 25 * explosion.scale,
            y: explosion.position.y - 25 * explosion.scale,
            width: 50 * explosion.scale,
            height: 50 * explosion.scale
        )
        
        context.fill(
            Path(ellipseIn: explosionRect),
            with: .color(.orange.opacity(explosion.opacity))
        )
    }
    
    private func drawBug(context: GraphicsContext, bug: Bug) {
        // Draw bug emoji
        let bugText = Text("🐛")
            .font(.system(size: GameConstants.bugSize))
        
        context.draw(bugText, at: bug.position)
    }
    
    private func drawFloatingScore(context: GraphicsContext, floatingScore: FloatingScore) {
        let fontSize: CGFloat = floatingScore.isBugScore ? 16 : 20
        let color = floatingScore.isBugScore ? Color.green : Color(red: 0.949, green: 0.333, blue: 0.2)
        
        let scoreText = Text(floatingScore.text)
            .font(.system(size: fontSize, weight: .bold, design: .serif))
            .foregroundColor(color.opacity(floatingScore.opacity))
        
        context.draw(scoreText, at: floatingScore.position)
    }
}

struct HUDView: View {
    @ObservedObject var gameVM: GameViewModel
    
    var body: some View {
        VStack {
            HStack {
                // Score panel (top-left) - incident.io brand styling
                VStack(spacing: 2) {
                    Text("Score")
                        .font(.system(size: 14, weight: .bold, design: .serif))
                        .foregroundColor(Color(red: 0.949, green: 0.333, blue: 0.2))
                        .tracking(1)
                    
                    Text("\(gameVM.score)")
                        .font(.system(size: 24, weight: .bold, design: .serif))
                        .foregroundColor(Color(red: 0.949, green: 0.333, blue: 0.2))
                        .tracking(2)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(
                    ZStack {
                        // Clean background - incident.io style
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color.white.opacity(0.95))
                        
                        // Subtle border
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color(red: 0.949, green: 0.333, blue: 0.2), lineWidth: 2)
                    }
                )
                
                Spacer()
                
                // Level panel (top-right) - incident.io brand styling
                VStack(spacing: 2) {
                    Text("Level")
                        .font(.system(size: 14, weight: .bold, design: .serif))
                        .foregroundColor(Color(red: 0.949, green: 0.333, blue: 0.2))
                        .tracking(1)
                    
                    Text("\(gameVM.level)")
                        .font(.system(size: 24, weight: .bold, design: .serif))
                        .foregroundColor(Color(red: 0.949, green: 0.333, blue: 0.2))
                        .tracking(2)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(
                    ZStack {
                        // Clean background - incident.io style
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color.white.opacity(0.95))
                        
                        // Subtle border
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color(red: 0.949, green: 0.333, blue: 0.2), lineWidth: 2)
                    }
                )
                
                if gameVM.konamiActive {
                    VStack(spacing: 2) {
                        Text("Konami")
                            .font(.system(size: 12, weight: .bold, design: .serif))
                            .foregroundColor(Color(red: 0.949, green: 0.333, blue: 0.2))
                            .tracking(1)
                        
                        Text("Active!")
                            .font(.system(size: 16, weight: .bold, design: .serif))
                            .foregroundColor(Color(red: 0.949, green: 0.333, blue: 0.2))
                            .tracking(1)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(
                        ZStack {
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.white.opacity(0.95))
                            
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color(red: 0.949, green: 0.333, blue: 0.2), lineWidth: 2)
                        }
                    )
                }
            }
            .padding(EdgeInsets(top: 10, leading: 10, bottom: 0, trailing: 10))
            
            if gameVM.gameState == .transitioning {
                Spacer()
                Spacer()
                
                Text("Level \(gameVM.level)")
                    .font(.system(size: 72, weight: .bold, design: .serif))
                    .foregroundColor(Color(red: 0.949, green: 0.333, blue: 0.2))
                    .textCase(nil)
                    .scaleEffect(1.2)
                
                Spacer()
                Spacer()
                Spacer()
            } else if gameVM.gameState == .interstitial {
                OnCallEngineerAwardView(gameVM: gameVM)
            } else {
                Spacer()
            }
        }
    }
}

struct ModernControlsView: View {
    @ObservedObject var gameVM: GameViewModel
    @Binding var joystickOffset: CGSize
    @Binding var joystickActive: Bool
    @Binding var joystickCenter: CGPoint
    @Binding var isTouchingShooting: Bool
    
    var body: some View {
        ZStack {
            // Virtual Joystick (Left side for movement)
            VStack {
                Spacer()
                HStack {
                    VirtualJoystick(
                        gameVM: gameVM,
                        offset: $joystickOffset,
                        isActive: $joystickActive,
                        center: $joystickCenter
                    )
                    .frame(width: 120, height: 120)
                    .padding(.leading, 40)
                    .padding(.bottom, 60)
                    
                    Spacer()
                }
            }
            
            // Touch-to-shoot area (Right side of screen)
            VStack {
                Spacer()
                HStack {
                    Spacer()
                    
                    // Invisible shooting area
                    Rectangle()
                        .fill(Color.clear)
                        .frame(width: 200, height: 300)
                        .overlay(
                            // Visual indicator when touching
                            Circle()
                                .stroke(Color(red: 0.949, green: 0.333, blue: 0.2).opacity(0.6), lineWidth: 3)
                                .fill(Color(red: 0.949, green: 0.333, blue: 0.2).opacity(0.1))
                                .scaleEffect(isTouchingShooting ? 1.2 : 0.8)
                                .animation(.easeInOut(duration: 0.1), value: isTouchingShooting)
                                .opacity(isTouchingShooting ? 1 : 0.3)
                        )
                        .onLongPressGesture(minimumDuration: 0, maximumDistance: .infinity) {
                            // On press end
                        } onPressingChanged: { pressing in
                            isTouchingShooting = pressing
                            gameVM.setShooting(pressing)
                        }
                        .padding(.trailing, 40)
                        .padding(.bottom, 60)
                }
            }
            
            // Control hints (fade out after a few seconds)
            VStack {
                Spacer()
                HStack {
                    Text("Move")
                        .font(.system(size: 12, weight: .medium, design: .serif))
                        .foregroundColor(Color(red: 0.949, green: 0.333, blue: 0.2).opacity(0.7))
                        .padding(.leading, 80)
                        .padding(.bottom, 30)
                    
                    Spacer()
                    
                    Text("Shoot")
                        .font(.system(size: 12, weight: .medium, design: .serif))
                        .foregroundColor(Color(red: 0.949, green: 0.333, blue: 0.2).opacity(0.7))
                        .padding(.trailing, 100)
                        .padding(.bottom, 30)
                }
            }
        }
    }
}

struct VirtualJoystick: View {
    @ObservedObject var gameVM: GameViewModel
    @Binding var offset: CGSize
    @Binding var isActive: Bool
    @Binding var center: CGPoint
    
    private let maxDistance: CGFloat = 50
    
    var body: some View {
        ZStack {
            // Joystick base (outer circle)
            Circle()
                .stroke(Color(red: 0.949, green: 0.333, blue: 0.2).opacity(0.6), lineWidth: 3)
                .fill(Color(red: 0.949, green: 0.333, blue: 0.2).opacity(0.1))
                .frame(width: 100, height: 100)
            
            // Joystick knob (inner circle)
            Circle()
                .fill(Color(red: 0.949, green: 0.333, blue: 0.2).opacity(0.8))
                .frame(width: 40, height: 40)
                .offset(offset)
                .scaleEffect(isActive ? 1.2 : 1.0)
                .animation(.easeInOut(duration: 0.1), value: isActive)
        }
        .gesture(
            DragGesture()
                .onChanged { value in
                    isActive = true
                    
                    // Calculate offset with max distance constraint
                    let distance = sqrt(pow(value.translation.width, 2) + pow(value.translation.height, 2))
                    
                    if distance <= maxDistance {
                        offset = value.translation
                    } else {
                        let angle = atan2(value.translation.height, value.translation.width)
                        offset = CGSize(
                            width: cos(angle) * maxDistance,
                            height: sin(angle) * maxDistance
                        )
                    }
                    
                    // Convert joystick input to game controls
                    let normalizedX = offset.width / maxDistance
                    let normalizedY = offset.height / maxDistance
                    
                    // Calculate thrust (distance from center)
                    let thrustMagnitude = sqrt(pow(normalizedX, 2) + pow(normalizedY, 2))
                    gameVM.setThrusting(thrustMagnitude > 0.1)
                    
                    // Calculate rotation based on angle
                    if thrustMagnitude > 0.1 {
                        var angle = atan2(normalizedY, normalizedX) * 180 / .pi
                        
                        // Invert controls: flip the angle 180 degrees so thrust direction is reversed
                        if gameVM.invertControls {
                            angle += 180
                        }
                        
                        gameVM.setPlayerRotation(angle - 90) // -90 to match ship orientation
                    }
                }
                .onEnded { _ in
                    isActive = false
                    withAnimation(.easeOut(duration: 0.2)) {
                        offset = .zero
                    }
                    gameVM.setThrusting(false)
                }
        )
    }
}

struct OnCallEngineerAwardView: View {
    @ObservedObject var gameVM: GameViewModel
    @State private var certificateScale: CGFloat = 0.5
    @State private var titlePulse: CGFloat = 1.0
    @State private var fireGlow: Bool = false
    @State private var showStats: Bool = false
    @State private var confettiOffset: CGFloat = -50
    
    var body: some View {
        ZStack {
            // Clear background to ensure clean screen
            Color.white
                .ignoresSafeArea()
            
            // Animated confetti background
            ForEach(0..<8, id: \.self) { index in
                Text(["🎉", "🏆", "⭐", "🎊"][index % 4])
                    .font(.system(size: 30))
                    .offset(
                        x: CGFloat(index * 40 - 140),
                        y: confettiOffset + CGFloat(index * 20)
                    )
                    .opacity(0.6)
                    .animation(
                        .linear(duration: 8.0)
                        .repeatForever(autoreverses: false),
                        value: confettiOffset
                    )
            }
            
            VStack(spacing: 20) {
                Spacer()
                
                // Award Certificate Background
                VStack(spacing: 20) {
                // Header
                VStack(spacing: 8) {
                    Text("🏆 CONGRATULATIONS! 🏆")
                        .font(.system(size: 20, weight: .bold, design: .serif))
                        .foregroundColor(Color.black)
                        .tracking(2)
                    
                    Text("PageDestroyer Technologies")
                        .font(.system(size: 14, weight: .medium, design: .serif))
                        .foregroundColor(Color.black)
                        .opacity(0.7)
                }
                
                // Award Title
                Text("ON-CALL ENGINEER")
                    .font(.system(size: 22, weight: .bold, design: .serif))
                    .foregroundColor(Color.black)
                    .tracking(2)
                    .scaleEffect(titlePulse)
                
                Text("OF THE MONTH")
                    .font(.system(size: 22, weight: .bold, design: .serif))
                    .foregroundColor(Color.black)
                    .tracking(2)
                    .scaleEffect(titlePulse)
                
                // Hero Fire Character with animated glow
                Text("🔥")
                    .font(.system(size: 60))
                    .scaleEffect(1.1)
                    .shadow(color: fireGlow ? .yellow : .orange, radius: fireGlow ? 15 : 8)
                    .animation(.easeInOut(duration: 1.0).repeatForever(autoreverses: true), value: fireGlow)
                
                // Achievement Text - Shortened
                VStack(spacing: 8) {
                    Text("Excellence in")
                        .font(.system(size: 14, weight: .medium, design: .serif))
                        .foregroundColor(Color.black)
                        .opacity(0.7)
                    
                    Text("INCIDENT RESPONSE")
                        .font(.system(size: 18, weight: .bold, design: .serif))
                        .foregroundColor(Color.black)
                        .tracking(2)
                }
                
                // Galaga-style stats with delayed appearance
                if showStats {
                    VStack(spacing: 12) {
                        Text("PERFORMANCE REPORT")
                            .font(.system(size: 18, weight: .bold, design: .serif))
                            .foregroundColor(Color.black)
                            .tracking(2)
                        
                        VStack(spacing: 10) {
                            HStack {
                                Text("SHOTS FIRED")
                                    .font(.system(size: 16, weight: .medium, design: .serif))
                                    .foregroundColor(Color.black)
                                Spacer()
                                Text("\(gameVM.totalMissilesFired)")
                                    .font(.system(size: 16, weight: .bold, design: .serif))
                                    .foregroundColor(Color.black)
                            }
                            .scaleEffect(showStats ? 1.0 : 0.5)
                            .animation(.spring(response: 0.6, dampingFraction: 0.8, blendDuration: 0).delay(0.2), value: showStats)
                            
                            HStack {
                                Text("PAGERS KILLED")
                                    .font(.system(size: 16, weight: .medium, design: .serif))
                                    .foregroundColor(Color.black)
                                Spacer()
                                Text("\(gameVM.totalPagersKilled)")
                                    .font(.system(size: 16, weight: .bold, design: .serif))
                                    .foregroundColor(Color.black)
                            }
                            .scaleEffect(showStats ? 1.0 : 0.5)
                            .animation(.spring(response: 0.6, dampingFraction: 0.8, blendDuration: 0).delay(0.4), value: showStats)
                            
                            HStack {
                                Text("BUGS SQUASHED")
                                    .font(.system(size: 16, weight: .medium, design: .serif))
                                    .foregroundColor(Color.black)
                                Spacer()
                                Text("\(gameVM.totalBugsKilled)")
                                    .font(.system(size: 16, weight: .bold, design: .serif))
                                    .foregroundColor(Color.black)
                            }
                            .scaleEffect(showStats ? 1.0 : 0.5)
                            .animation(.spring(response: 0.6, dampingFraction: 0.8, blendDuration: 0).delay(0.6), value: showStats)
                            
                            // Hit rate with special highlighting
                            VStack(spacing: 6) {
                                Text("HIT RATE")
                                    .font(.system(size: 18, weight: .bold, design: .serif))
                                    .foregroundColor(Color.black)
                                    .tracking(2)
                                
                                Text("\(String(format: "%.1f", gameVM.hitRate))%")
                                    .font(.system(size: 28, weight: .bold, design: .serif))
                                    .foregroundColor(hitRateColor(gameVM.hitRate))
                                    .tracking(1)
                            }
                            .scaleEffect(showStats ? 1.0 : 0.5)
                            .animation(.spring(response: 0.6, dampingFraction: 0.8, blendDuration: 0).delay(0.8), value: showStats)
                            .padding(.top, 10)
                        }
                        .padding(.horizontal, 25)
                        .padding(.vertical, 20)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color.white.opacity(0.9))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(Color(red: 0.949, green: 0.333, blue: 0.2), lineWidth: 2)
                                )
                        )
                    }
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
                }
                
                // Signature
                HStack {
                    Spacer()
                    VStack(alignment: .trailing, spacing: 4) {
                        Text("_________________")
                            .font(.system(size: 12, weight: .medium, design: .serif))
                            .foregroundColor(Color.black)
                            .opacity(0.6)
                        
                        Text("Chief Technology Officer")
                            .font(.system(size: 12, weight: .medium, design: .serif))
                            .foregroundColor(Color.black)
                            .opacity(0.6)
                    }
                    .padding(.trailing, 20)
                }
                }
                .padding(30)
                .background(
                    ZStack {
                        // Certificate background
                        RoundedRectangle(cornerRadius: 15)
                            .fill(Color.white.opacity(0.95))
                        
                        // Decorative border
                        RoundedRectangle(cornerRadius: 15)
                            .stroke(Color(red: 0.949, green: 0.333, blue: 0.2), lineWidth: 3)
                        
                        // Inner decorative border
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color(red: 0.949, green: 0.333, blue: 0.2).opacity(0.3), lineWidth: 1)
                            .padding(8)
                    }
                )
                .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 5)
                .scaleEffect(certificateScale)
                .animation(.spring(response: 0.8, dampingFraction: 0.6, blendDuration: 0), value: certificateScale)
                
                Spacer()
            }
            .padding(.horizontal, 20)
        }
        .onAppear {
            // Trigger animations
            withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
                titlePulse = 1.1
            }
            
            fireGlow = true
            confettiOffset = UIScreen.main.bounds.height + 100
            
            // Animate certificate entrance
            withAnimation(.spring(response: 0.8, dampingFraction: 0.6, blendDuration: 0)) {
                certificateScale = 1.0
            }
            
            // Show stats with delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                withAnimation(.easeInOut(duration: 0.5)) {
                    showStats = true
                }
            }
        }
    }
    
    private func hitRateColor(_ rate: Double) -> Color {
        switch rate {
        case 80...:
            return .green
        case 60..<80:
            return .orange
        case 40..<60:
            return Color(red: 0.949, green: 0.333, blue: 0.2)
        default:
            return .red
        }
    }
    
    private func calculatePagersDestroyed() -> Int {
        // Estimate based on levels completed
        // Each level has 5 + level pagers, so calculate cumulative
        var total = 0
        for level in 1..<gameVM.level {
            total += 5 + level
        }
        return total
    }
}