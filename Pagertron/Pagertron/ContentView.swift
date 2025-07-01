//
//  ContentView.swift
//  Pagertron
//
//  Created by Tom Wentworth on 7/1/25.
//

import SwiftUI

struct ContentView: View {
    @StateObject private var gameVM = GameViewModel()
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Color.white.ignoresSafeArea() // White background
                
                switch gameVM.gameState {
                case .menu:
                    MenuView(gameVM: gameVM)
                case .playing, .transitioning:
                    GameView(gameVM: gameVM)
                case .gameOver:
                    GameOverView(gameVM: gameVM)
                case .finale:
                    FinaleView(gameVM: gameVM)
                }
            }
        }
        .preferredColorScheme(.dark)
    }
}

struct MenuView: View {
    let gameVM: GameViewModel
    @State private var pulseScale: CGFloat = 1.0
    @State private var titlePulse: CGFloat = 1.0
    @State private var scanlineOffset: CGFloat = -100
    
    var body: some View {
        ZStack {
            // Enhanced CRT Vignette effect
            RadialGradient(
                gradient: Gradient(stops: [
                    .init(color: Color.clear, location: 0.0),
                    .init(color: Color.clear, location: 0.6),
                    .init(color: Color.black.opacity(0.4), location: 0.8),
                    .init(color: Color.black.opacity(0.8), location: 1.0)
                ]),
                center: .center,
                startRadius: 50,
                endRadius: max(UIScreen.main.bounds.width, UIScreen.main.bounds.height) * 0.7
            )
            .allowsHitTesting(false)
            
            // Enhanced moving scanlines
            Rectangle()
                .fill(
                    LinearGradient(
                        gradient: Gradient(stops: [
                            .init(color: Color.clear, location: 0.0),
                            .init(color: Color.black.opacity(0.4), location: 0.49),
                            .init(color: Color.clear, location: 0.5),
                            .init(color: Color.black.opacity(0.4), location: 0.51),
                            .init(color: Color.clear, location: 1.0)
                        ]),
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .scaleEffect(y: 0.01)
                .opacity(0.3)
                .allowsHitTesting(false)
                .offset(y: scanlineOffset)
                .onAppear {
                    withAnimation(.linear(duration: 3.0).repeatForever(autoreverses: false)) {
                        scanlineOffset = UIScreen.main.bounds.height
                    }
                }
            
            // RGB color shift effect
            Rectangle()
                .fill(
                    LinearGradient(
                        gradient: Gradient(stops: [
                            .init(color: Color.cyan.opacity(0.03), location: 0.0),
                            .init(color: Color.clear, location: 0.3),
                            .init(color: Color.clear, location: 0.7),
                            .init(color: Color(red: 1.0, green: 0.0, blue: 1.0).opacity(0.03), location: 1.0)
                        ]),
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .allowsHitTesting(false)
                .opacity(0.6)
            
            // Centered logo and title text block
            VStack {
                Spacer()
                
                VStack(spacing: 30) {
                    // incident.io logo
                    AsyncImage(url: URL(string: "https://media.licdn.com/dms/image/v2/D4E0BAQFJhMcjf87eCA/company-logo_200_200/company-logo_200_200/0/1709897084853/incident_io_logo?e=2147483647&v=beta&t=YhaUWh2pX9QqQKlHsXxEjzyd6KCbH5ntKRAJ6fx2SP4")) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                    } placeholder: {
                        // Fallback while loading
                        Text("🚨")
                            .font(.system(size: 40))
                    }
                    .frame(width: 60, height: 60)
                    
                    // Title text
                    VStack(spacing: -10) {
                        Text("PagerTron")
                            .font(.system(size: min(UIScreen.main.bounds.width * 0.15, 120), weight: .regular, design: .serif))
                            .foregroundColor(Color.black)
                            .multilineTextAlignment(.center)
                            .lineLimit(1)
                            .minimumScaleFactor(0.5)
                            .frame(maxWidth: UIScreen.main.bounds.width * 0.8)
                            .scaleEffect(titlePulse)
                        
                        Text("by incident.io")
                            .font(.system(size: min(UIScreen.main.bounds.width * 0.065, 55), weight: .medium, design: .serif))
                            .foregroundColor(Color(red: 0.949, green: 0.333, blue: 0.2))
                            .multilineTextAlignment(.center)
                            .frame(maxWidth: UIScreen.main.bounds.width * 0.8)
                    }
                }
                
                Spacer()
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .onAppear {
                withAnimation(.easeInOut(duration: 2.5).repeatForever(autoreverses: true)) {
                    titlePulse = 1.08
                }
            }
            
            // Bottom controls area - moved higher up
            VStack(spacing: 20) {
                Spacer()
                
                // Press to Start - incident.io style
                Button("Press to start") {
                    gameVM.startGame()
                }
                .font(.system(size: min(UIScreen.main.bounds.width / 25, 32), weight: .bold, design: .serif))
                .foregroundColor(.white)
                .padding(.horizontal, 40)
                .padding(.vertical, 18)
                .background(Color(red: 0.949, green: 0.333, blue: 0.2))
.clipShape(RoundedRectangle(cornerRadius: 25))
                .scaleEffect(pulseScale)
                .onAppear {
                    withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
                        pulseScale = 1.05
                    }
                }
                
                // INSERT COIN - incident.io style
                BlinkingText(text: "Insert coin")
                    .font(.system(size: 18, weight: .medium, design: .serif))
                    .foregroundColor(Color(red: 0.949, green: 0.333, blue: 0.2))
                
                Spacer().frame(height: 50) // Back to bottom positioning
            }
            
        }
    }
}

struct GameOverView: View {
    let gameVM: GameViewModel
    @State private var flashColor: Color = .red
    @State private var pulseScale: CGFloat = 1.0
    @State private var showFinalScreen = false
    
    var body: some View {
        ZStack {
            // White background for game over screen
            Color.white.ignoresSafeArea()
            
            if showFinalScreen {
                // Final Screen - incident.io screen
                IncidentIOFinalScreen(gameVM: gameVM)
            } else {
                // Brief Game Over text - skip high scores and go directly to final screen
                VStack {
                    Spacer()
                    
                    Text("Game over")
                        .font(.system(size: 56, weight: .bold, design: .serif))
                        .foregroundColor(Color(red: 0.949, green: 0.333, blue: 0.2))
                        .textCase(nil)
                        .scaleEffect(pulseScale)
                        .onAppear {
                            // Pulse animation
                            withAnimation(.easeInOut(duration: 0.8).repeatForever(autoreverses: true)) {
                                pulseScale = 1.05
                            }
                            
                            // Auto-transition directly to final screen after brief display
                            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                                showFinalScreen = true
                            }
                        }
                    
                    Spacer()
                }
            }
        }
    }
}


struct IncidentIOFinalScreen: View {
    let gameVM: GameViewModel
    @State private var pulseScale: CGFloat = 1.0
    
    var body: some View {
        VStack(spacing: 30) {
            Spacer()
            
            // incident.io branding
            VStack(spacing: 20) {
                // incident.io logo from LinkedIn
                AsyncImage(url: URL(string: "https://media.licdn.com/dms/image/v2/D4E0BAQFJhMcjf87eCA/company-logo_200_200/company-logo_200_200/0/1709897084853/incident_io_logo?e=2147483647&v=beta&t=YhaUWh2pX9QqQKlHsXxEjzyd6KCbH5ntKRAJ6fx2SP4")) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                } placeholder: {
                    // Fallback while loading
                    Text("🚨")
                        .font(.system(size: 100))
                }
                .frame(width: 120, height: 120)
                
                Text("Move fast when you break things.")
                    .font(.system(size: 32, weight: .bold, design: .serif))
                    .foregroundColor(Color.black.opacity(0.9))
                    .multilineTextAlignment(.center)
                    .lineLimit(nil)
                    .fixedSize(horizontal: false, vertical: true)
                
                Text("all-in-one incident management")
                    .font(.system(size: 20, weight: .medium, design: .serif))
                    .foregroundColor(Color.black.opacity(0.7))
                    .multilineTextAlignment(.center)
                    .lineLimit(nil)
                    .fixedSize(horizontal: false, vertical: true)
                
                Button("get started at incident.io") {
                    if let url = URL(string: "https://incident.io") {
                        UIApplication.shared.open(url)
                    }
                }
                .font(.system(size: 18, weight: .medium, design: .serif))
                .foregroundColor(Color(red: 0.949, green: 0.333, blue: 0.2))
                .underline()
            }
            
            Spacer().frame(height: 40)
            
            // Buttons matching React version
            VStack(spacing: 20) {
                Button("Play again") {
                    gameVM.setupGame()
                    gameVM.startGame()
                }
                .font(.system(size: 24, weight: .bold, design: .serif))
                .foregroundColor(.white)
                .padding(.horizontal, 40)
                .padding(.vertical, 18)
                .background(Color.black.opacity(0.7))
.clipShape(RoundedRectangle(cornerRadius: 25))
                .scaleEffect(pulseScale)
                
                Button("Get a demo") {
                    // Open incident.io demo link
                    if let url = URL(string: "https://incident.io/demo") {
                        UIApplication.shared.open(url)
                    }
                }
                .font(.system(size: 24, weight: .bold, design: .serif))
                .foregroundColor(.white)
                .padding(.horizontal, 40)
                .padding(.vertical, 18)
                .background(Color(red: 0.949, green: 0.333, blue: 0.2))
.clipShape(RoundedRectangle(cornerRadius: 25))
                .scaleEffect(pulseScale)
            }
            
            Spacer()
        }
        .padding(40)
        .onAppear {
            withAnimation(.easeInOut(duration: 1.0).repeatForever(autoreverses: true)) {
                pulseScale = 1.05
            }
        }
    }
}

struct FinaleView: View {
    let gameVM: GameViewModel
    
    var body: some View {
        VStack(spacing: 30) {
            Text("🎆 Finale! 🎆")
                .font(.system(size: 48, weight: .bold, design: .serif))
                .foregroundColor(Color(red: 0.949, green: 0.333, blue: 0.2))
                .textCase(nil)
            
            Text("Magnificent destruction!")
                .font(.system(size: 24, weight: .bold, design: .serif))
                .foregroundColor(Color.black.opacity(0.8))
                .textCase(nil)
        }
    }
}

struct BlinkingText: View {
    let text: String
    @State private var isVisible = true
    
    var body: some View {
        Text(text)
            .opacity(isVisible ? 1.0 : 0.1)
            .onAppear {
                withAnimation(.easeInOut(duration: 0.8).repeatForever()) {
                    isVisible.toggle()
                }
            }
    }
}

#Preview {
    ContentView()
}
