// This script sets up the AudioContext and enables audio playback as early as possible
// We need to create this file separately and load it early in the page lifecycle

// Create a global audio context that will be used by the game
window.PagertronAudio = {
  context: null,
  unlocked: false,
  raceBuffer: null,
  fatalityBuffer: null,
  
  // Initialize the audio context
  init: function() {
    // Create AudioContext with the appropriate constructor for the browser
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContext();
    
    // Attempt to resume the context immediately (might work in some browsers)
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    
    // Set up various events that might unlock audio
    const events = ['touchstart', 'touchend', 'mousedown', 'keydown', 'click'];
    const unlockAudio = () => {
      if (this.unlocked) return;
      
      // Resume the AudioContext (this is what actually enables sound)
      this.context.resume().then(() => {
        console.log('AudioContext resumed successfully');
        this.unlocked = true;
        
        // Remove the event listeners once we've successfully unlocked audio
        events.forEach(event => {
          document.removeEventListener(event, unlockAudio);
        });
      }).catch(err => console.error('Failed to resume AudioContext:', err));
    };
    
    // Add all the event listeners
    events.forEach(event => {
      document.addEventListener(event, unlockAudio);
    });
    
    // Create a silent buffer and play it to warm up the audio context
    // This helps work around autoplay restrictions in many browsers
    const silentBuffer = this.context.createBuffer(1, 1, 22050);
    const source = this.context.createBufferSource();
    source.buffer = silentBuffer;
    source.connect(this.context.destination);
    source.start(0);
    
    console.log('Audio system initialized');
  }
};

// Initialize as soon as the script loads
window.PagertronAudio.init();