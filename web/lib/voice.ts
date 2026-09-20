// BHASHINI Indic Conversational Voice Engine & Real-Time Audio Synthesizer

export type SupportedIndicLanguage = 'en' | 'hi' | 'ta' | 'ml' | 'te' | 'bn' | 'gu' | 'mr' | 'kn' | 'pa' | 'or';

export const BHASHINI_LANG_CODES: Record<SupportedIndicLanguage | string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  ml: 'ml-IN',
  te: 'te-IN',
  bn: 'bn-IN',
  gu: 'gu-IN',
  mr: 'mr-IN',
  kn: 'kn-IN',
  pa: 'pa-IN',
  or: 'or-IN',
};

export interface VoiceEngineCallbacks {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onListeningState?: (isListening: boolean) => void;
  onSpeakingState?: (isSpeaking: boolean) => void;
  onError?: (error: string) => void;
}

class BhashiniVoiceEngine {
  private recognition: any = null;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private audioPlayer: HTMLAudioElement | null = null;
  private callbacks: VoiceEngineCallbacks = {};
  private currentLanguage: string = 'en';

  constructor() {
    if (typeof window !== 'undefined') {
      this.initSpeechRecognition();
    }
  }

  private initSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.callbacks.onListeningState?.(true);
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const transcript = finalTranscript || interimTranscript;
        if (transcript) {
          this.callbacks.onTranscript?.(transcript, Boolean(finalTranscript));
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        this.isListening = false;
        this.callbacks.onListeningState?.(false);
        if (event.error !== 'no-speech') {
          this.callbacks.onError?.(`Voice input notice: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.callbacks.onListeningState?.(false);
      };
    }
  }

  public setCallbacks(callbacks: VoiceEngineCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public setLanguage(langCode: string) {
    this.currentLanguage = langCode;
    if (this.recognition) {
      this.recognition.lang = BHASHINI_LANG_CODES[langCode] || 'en-IN';
    }
  }

  // Start Real Microphone Listening
  public async startListening(langCode?: string) {
    if (typeof window === 'undefined') return;
    
    if (langCode) {
      this.setLanguage(langCode);
    }

    if (this.isSpeaking) {
      this.stopSpeaking();
    }

    // Proactively request browser microphone permission
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        console.warn('Microphone permission not explicitly granted or denied:', err);
      }
    }

    if (!this.recognition) {
      this.initSpeechRecognition();
    }

    if (this.recognition) {
      try {
        this.recognition.lang = BHASHINI_LANG_CODES[this.currentLanguage] || 'en-IN';
        this.recognition.start();
        this.isListening = true;
        this.callbacks.onListeningState?.(true);
      } catch (e) {
        console.warn('Recognition start exception, resetting state:', e);
        try {
          this.recognition.abort();
          setTimeout(() => {
            try {
              this.recognition.start();
              this.isListening = true;
              this.callbacks.onListeningState?.(true);
            } catch (err2) {
              this.callbacks.onError?.('Microphone is busy. You can also select spoken prompts below.');
            }
          }, 150);
        } catch (err) {
          this.callbacks.onError?.('Microphone access unavailable. You can click spoken prompt chips.');
        }
      }
    } else {
      this.callbacks.onError?.('Web Speech API is not supported in this browser. You can click prompt chips or type.');
    }
  }

  // Stop Listening
  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Error stopping recognition:', e);
      }
    }
    this.isListening = false;
    this.callbacks.onListeningState?.(false);
  }

  // Speak Text in Selected Indic Language
  public async speakText(text: string, langCode: string = 'en', audioBase64?: string): Promise<void> {
    if (typeof window === 'undefined') return;

    this.stopSpeaking();
    this.isSpeaking = true;
    this.callbacks.onSpeakingState?.(true);

    // 1. If Bhashini returned a live Base64 Audio WAV stream, play it directly
    if (audioBase64) {
      try {
        if (!this.audioPlayer) {
          this.audioPlayer = new Audio();
        }
        const audioSrc = audioBase64.startsWith('data:audio') 
          ? audioBase64 
          : `data:audio/wav;base64,${audioBase64}`;
        
        this.audioPlayer.src = audioSrc;
        this.audioPlayer.onended = () => {
          this.isSpeaking = false;
          this.callbacks.onSpeakingState?.(false);
        };
        this.audioPlayer.onerror = () => {
          // Fallback to browser synthesis
          this.speakWithBrowserSynthesis(text, langCode);
        };
        await this.audioPlayer.play();
        return;
      } catch (e) {
        console.warn('Bhashini Base64 audio playback failed, falling back to Web Speech synthesis:', e);
      }
    }

    // 2. Browser High-Fidelity Indic SpeechSynthesis Fallback
    this.speakWithBrowserSynthesis(text, langCode);
  }

  private speakWithBrowserSynthesis(text: string, langCode: string) {
    if (!('speechSynthesis' in window)) {
      this.isSpeaking = false;
      this.callbacks.onSpeakingState?.(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();

      // Clean markdown characters from text for crisp audio speech
      const cleanText = text
        .replace(/[*#_`~>]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/https?:\/\/\S+/g, '')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const targetLocale = BHASHINI_LANG_CODES[langCode] || 'en-IN';
      utterance.lang = targetLocale;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      // Select matching Indian regional voice if available
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(v => v.lang === targetLocale || v.lang.startsWith(targetLocale.split('-')[0]));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => {
        this.isSpeaking = false;
        this.callbacks.onSpeakingState?.(false);
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis utterance error:', e);
        this.isSpeaking = false;
        this.callbacks.onSpeakingState?.(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      this.isSpeaking = false;
      this.callbacks.onSpeakingState?.(false);
    }
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined') {
      if (this.audioPlayer) {
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
    this.isSpeaking = false;
    this.callbacks.onSpeakingState?.(false);
  }
}

export const bhashiniVoice = new BhashiniVoiceEngine();
