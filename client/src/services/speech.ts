// Web Speech API service for Speech Recognition and Text-to-Speech (TTS)

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export class SpeechService {
  private recognition: any = null;
  private isListeningActive = false;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
      }

      if ('speechSynthesis' in window) {
        this.loadVoices();
        window.speechSynthesis.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
    }
  }

  private loadVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.voices = window.speechSynthesis.getVoices();
    }
  }

  public isSpeechRecognitionSupported(): boolean {
    return Boolean(typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));
  }

  public isSpeechSynthesisSupported(): boolean {
    return Boolean(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0) {
      this.loadVoices();
    }
    return this.voices;
  }

  /**
   * Start listening for microphone speech input
   */
  public startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): boolean {
    if (!this.recognition) {
      onError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or a Web Speech API compatible browser.');
      return false;
    }

    if (this.isListeningActive) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const text = final || interim;
      onResult(text, Boolean(final));
    };

    this.recognition.onerror = (event: any) => {
      console.warn('[Speech] Recognition error:', event.error);
      this.isListeningActive = false;
      let msg = event.error;
      if (event.error === 'not-allowed') {
        msg = 'Microphone permission denied. Please allow microphone access in your browser settings.';
      } else if (event.error === 'no-speech') {
        msg = 'No speech detected. Please speak clearly into your microphone.';
      }
      onError(msg);
    };

    this.recognition.onend = () => {
      this.isListeningActive = false;
      onEnd();
    };

    try {
      this.recognition.start();
      this.isListeningActive = true;
      return true;
    } catch (err: any) {
      this.isListeningActive = false;
      onError(err.message || 'Could not start microphone.');
      return false;
    }
  }

  /**
   * Stop listening
   */
  public stopListening(): void {
    if (this.recognition && this.isListeningActive) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.isListeningActive = false;
    }
  }

  public isListening(): boolean {
    return this.isListeningActive;
  }

  /**
   * Clean text of markdown and technical syntax for natural speech synthesis
   */
  public cleanTextForSpeech(text: string): string {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '$1') // remove bold
      .replace(/\*([^*]+)\*/g, '$1')     // remove italics
      .replace(/`([^`]+)`/g, '$1')       // remove code backticks
      .replace(/```[\s\S]*?```/g, 'Code block omitted.') // remove code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // clean links
      .replace(/#+\s+/g, '')             // remove headers
      .replace(/[-*•]\s+/g, '')          // remove list bullets
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Speak a text response using SpeechSynthesis
   */
  public speak(
    rawText: string,
    options?: {
      voiceIndex?: number;
      rate?: number;
      pitch?: number;
    },
    onStart?: () => void,
    onEnd?: () => void
  ): void {
    if (!this.isSpeechSynthesisSupported()) return;

    this.stopSpeaking();

    const clean = this.cleanTextForSpeech(rawText);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    
    // Select voice
    const voices = this.getVoices();
    if (voices.length > 0) {
      if (options?.voiceIndex !== undefined && voices[options.voiceIndex]) {
        utterance.voice = voices[options.voiceIndex];
      } else {
        // Prefer natural English voices (Google, Samantha, Daniel, Natural)
        const preferred = voices.find(v => 
          (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Neural')) &&
          v.lang.startsWith('en')
        ) || voices.find(v => v.lang.startsWith('en'));

        if (preferred) {
          utterance.voice = preferred;
        }
      }
    }

    utterance.rate = options?.rate || 1.0;
    utterance.pitch = options?.pitch || 1.0;

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('[Speech] TTS Error:', e);
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    if (this.isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
  }

  public isSpeaking(): boolean {
    return Boolean(this.isSpeechSynthesisSupported() && window.speechSynthesis.speaking);
  }
}

export const speechService = new SpeechService();
