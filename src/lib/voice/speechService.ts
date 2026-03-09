// src/lib/voice/speechService.ts

export type SpeechLanguage = 'en-US' | 'fr-FR' | 'ar-SA';

export interface SpeechServiceOptions {
    onResult: (text: string, isFinal: boolean) => void;
    onError: (error: string) => void;
    onEnd?: () => void;
    language?: SpeechLanguage;
}

export class SpeechService {
    private recognition: any = null;
    private isListening: boolean = false;
    private manualStop: boolean = false;
    private options: SpeechServiceOptions;

    constructor(options: SpeechServiceOptions) {
        this.options = options;
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                this.recognition = new SpeechRecognition();
                this.setupRecognition();
            } else {
                console.warn("Speech API not supported in this browser.");
                this.options.onError("Speech recognition is not supported in this browser.");
            }
        }
    }

    private setupRecognition() {
        if (!this.recognition) return;

        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.options.language || 'en-US';

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

            if (finalTranscript) {
                this.options.onResult(finalTranscript.trim(), true);
            } else if (interimTranscript) {
                this.options.onResult(interimTranscript.trim(), false);
            }
        };

        this.recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            this.options.onError(event.error);
        };

        this.recognition.onend = () => {
            const wasListening = this.isListening;
            this.isListening = false;
            // Auto-restart if it wasn't a manual stop
            if (!this.manualStop && wasListening) {
                try {
                    this.recognition.start();
                    this.isListening = true;
                } catch (e) { /* Ignore */ }
            } else {
                if (this.options.onEnd) this.options.onEnd();
            }
        };
    }

    public start() {
        if (!this.recognition) {
            this.options.onError("Speech recognition not supported.");
            return;
        }

        if (this.isListening) return;

        this.manualStop = false;
        try {
            this.recognition.start();
            this.isListening = true;
        } catch (e) {
            console.error(e);
            this.options.onError("Failed to start listening.");
        }
    }

    public stop() {
        if (!this.recognition || !this.isListening) return;

        this.manualStop = true;
        this.isListening = false;
        try {
            this.recognition.stop();
        } catch (e) {
            console.error(e);
        }
    }

    public isActive() {
        return this.isListening;
    }
}
