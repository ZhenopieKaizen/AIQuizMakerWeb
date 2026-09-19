export function playPerfectScoreSound(): void {
  try {
    const context = new AudioContext();

    const playChime = () => {
      const startAt = context.currentTime;
      const notes = [
        { frequency: 523.25, delay: 0 },
        { frequency: 659.25, delay: 0.11 },
        { frequency: 783.99, delay: 0.22 },
        { frequency: 1046.5, delay: 0.42 },
      ];

      notes.forEach(({ frequency, delay }, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const noteStart = startAt + delay;
        const duration = index === notes.length - 1 ? 0.42 : 0.25;

        oscillator.type = index === notes.length - 1 ? 'sine' : 'triangle';
        oscillator.frequency.setValueAtTime(frequency, noteStart);
        gain.gain.setValueAtTime(0.0001, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.09, noteStart + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + duration);

        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(noteStart);
        oscillator.stop(noteStart + duration + 0.02);
      });

      window.setTimeout(() => void context.close(), 1100);
    };

    if (context.state === 'suspended') {
      void context.resume().then(playChime).catch(() => void context.close());
    } else {
      playChime();
    }
  } catch {
    // Sound is an enhancement; quiz submission should still succeed if the
    // browser or device does not provide Web Audio support.
  }
}
