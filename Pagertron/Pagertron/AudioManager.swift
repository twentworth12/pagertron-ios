//
//  AudioManager.swift
//  Pagertron
//
//  Created by Tom Wentworth on 7/1/25.
//

import Foundation
import AVFoundation

class AudioManager: ObservableObject {
    static let shared = AudioManager()
    
    @Published var isMuted: Bool = false {
        didSet {
            UserDefaults.standard.set(isMuted, forKey: "pagertronMusicMuted")
            updatePlayback()
        }
    }
    
    private var introPlayer: AVAudioPlayer?
    private var gameplayPlayer: AVAudioPlayer?
    private var currentTrack: AudioTrack = .intro
    
    enum AudioTrack {
        case intro
        case gameplay
    }
    
    private init() {
        setupAudioSession()
        loadAudioFiles()
        loadUserPreferences()
    }
    
    private func setupAudioSession() {
        do {
            // Use ambient category to mix with other audio respectfully
            try AVAudioSession.sharedInstance().setCategory(.ambient, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("Failed to setup audio session: \(error)")
        }
    }
    
    private func loadAudioFiles() {
        // Load intro music (Race.mp3)
        if let introURL = Bundle.main.url(forResource: "Race", withExtension: "mp3") {
            do {
                introPlayer = try AVAudioPlayer(contentsOf: introURL)
                introPlayer?.numberOfLoops = -1 // Loop infinitely
                introPlayer?.volume = 0.5
                introPlayer?.prepareToPlay()
                print("Intro music loaded successfully")
            } catch {
                print("Failed to load intro music: \(error)")
            }
        } else {
            print("Race.mp3 not found in bundle")
        }
        
        // Load gameplay music (Fatality.mp3)
        if let gameplayURL = Bundle.main.url(forResource: "Fatality", withExtension: "mp3") {
            do {
                gameplayPlayer = try AVAudioPlayer(contentsOf: gameplayURL)
                gameplayPlayer?.numberOfLoops = -1 // Loop infinitely
                gameplayPlayer?.volume = 0.4
                gameplayPlayer?.prepareToPlay()
                print("Gameplay music loaded successfully")
            } catch {
                print("Failed to load gameplay music: \(error)")
            }
        } else {
            print("Fatality.mp3 not found in bundle")
        }
    }
    
    private func loadUserPreferences() {
        // Check if user is already playing music from another app
        if AVAudioSession.sharedInstance().isOtherAudioPlaying {
            // If user has music playing, default to muted to respect their choice
            isMuted = true
            print("Other audio detected - defaulting to muted to respect user's music")
        } else {
            // Load saved preference if no other audio is playing
            isMuted = UserDefaults.standard.bool(forKey: "pagertronMusicMuted")
        }
    }
    
    func playIntroMusic() {
        guard !isMuted else { return }
        
        currentTrack = .intro
        gameplayPlayer?.stop()
        
        introPlayer?.currentTime = 0
        introPlayer?.play()
        print("Playing intro music")
    }
    
    func playGameplayMusic() {
        guard !isMuted else { return }
        
        currentTrack = .gameplay
        introPlayer?.stop()
        
        gameplayPlayer?.currentTime = 0
        gameplayPlayer?.play()
        print("Playing gameplay music")
    }
    
    func stopAllMusic() {
        introPlayer?.stop()
        gameplayPlayer?.stop()
        print("Stopped all music")
    }
    
    
    private func updatePlayback() {
        if isMuted {
            stopAllMusic()
        } else {
            // Resume the current track
            switch currentTrack {
            case .intro:
                playIntroMusic()
            case .gameplay:
                playGameplayMusic()
            }
        }
    }
    
    func updateMusicForGameState(isGameStarted: Bool, isGameOver: Bool) {
        guard !isMuted else { return }
        
        if isGameStarted && !isGameOver {
            // Game is active - play gameplay music
            if currentTrack != .gameplay {
                playGameplayMusic()
            }
        } else {
            // Menu or game over - play intro music
            if currentTrack != .intro {
                playIntroMusic()
            }
        }
    }
}