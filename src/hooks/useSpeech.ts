import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Modality } from "@google/genai";
import { ai } from "../services/gemini";

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeechCharIndex, setCurrentSpeechCharIndex] = useState(0);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const progressIntervalRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN';

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Pre-load voices for better performance
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript('');
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const getBestVoice = (text: string) => {
    const voices = window.speechSynthesis.getVoices();
    
    // Detect language based on character sets
    const isTelugu = /[\u0C00-\u0C7F]/.test(text);
    const isHindi = /[\u0900-\u097F]/.test(text);
    
    if (isTelugu) {
      // Prioritize Google Telugu or any te-IN voice
      return voices.find(v => v.name.includes('Google') && v.lang.startsWith('te')) ||
             voices.find(v => v.lang.startsWith('te-IN')) || 
             voices.find(v => v.lang.includes('te')) ||
             voices.find(v => v.name.toLowerCase().includes('telugu'));
    }
    
    if (isHindi) {
      // Prioritize Google Hindi or any hi-IN voice
      return voices.find(v => v.name.includes('Google') && v.lang.startsWith('hi')) ||
             voices.find(v => v.lang.startsWith('hi-IN')) || 
             voices.find(v => v.lang.includes('hi')) ||
             voices.find(v => v.name.toLowerCase().includes('hindi'));
    }
    
    // Default to Indian English if available
    return voices.find(v => v.name.includes('Google') && v.lang === 'en-IN') ||
           voices.find(v => v.lang === 'en-IN') || 
           voices.find(v => v.name.toLowerCase().includes('india')) ||
           voices.find(v => v.lang.startsWith('en'));
  };

  const speakWithBrowser = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to find the best voice
      const voice = getBestVoice(text);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
        
        // Adjust parameters for a more natural Indian tone
        utterance.rate = 0.95; 
        utterance.pitch = 1.0;
      } else {
        // Fallback lang detection for utterance if no specific voice found
        if (/[\u0C00-\u0C7F]/.test(text)) utterance.lang = 'te-IN';
        else if (/[\u0900-\u097F]/.test(text)) utterance.lang = 'hi-IN';
        else utterance.lang = 'en-IN';
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setCurrentSpeechCharIndex(0);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setCurrentSpeechCharIndex(text.length);
      };
      utterance.onboundary = (event: any) => {
        if (event.name === 'word') {
          setCurrentSpeechCharIndex(event.charIndex);
        }
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  const speak = async (text: string) => {
    if (!text || !text.trim()) return;

    // Stop any current speaking
    stopSpeaking();

    try {
      setIsSpeaking(true);
      setCurrentSpeechCharIndex(0);

      // Detect language for prompt optimization
      const isTelugu = /[\u0C00-\u0C7F]/.test(text);
      const isHindi = /[\u0900-\u097F]/.test(text);
      const tone = isTelugu ? "Telugu" : isHindi ? "Hindi" : "Indian English";
      
      // Use a simple prefix for tone/slang as per model guidelines
      const prompt = `In a natural ${tone} slang with a helpful, professional Indian legal assistant tone, say: ${text}`;

      let base64Audio = "";
      let lastError: any = null;

      // Retry logic for TTS
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
              },
            },
          });

          const candidate = response.candidates?.[0];
          if (!candidate) throw new Error("No candidates returned from Gemini TTS");

          const audioPart = candidate.content?.parts?.find(p => p.inlineData?.data);
          base64Audio = audioPart?.inlineData?.data || "";

          if (base64Audio) break;

          const finishReason = candidate.finishReason;
          const responseText = response.text;
          lastError = new Error(`No audio data received. Finish reason: ${finishReason}${responseText ? `. Response text: ${responseText}` : ""}`);
          
          if (attempt < 1) {
            console.warn(`TTS attempt ${attempt + 1} failed, retrying...`, lastError);
            await new Promise(r => setTimeout(r, 1000));
          }
        } catch (err) {
          lastError = err;
          if (attempt < 1) {
            console.warn(`TTS attempt ${attempt + 1} errored, retrying...`, err);
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }

      if (!base64Audio) {
        throw lastError || new Error("Failed to get audio after retries");
      }

      // Decode base64 to binary
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Ensure buffer length is even for Int16Array
      const buffer = bytes.length % 2 === 0 ? bytes.buffer : bytes.slice(0, bytes.length - 1).buffer;

      // Convert 16-bit PCM to Float32 for Web Audio API
      const pcmData = new Int16Array(buffer);
      const float32Data = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        float32Data[i] = pcmData[i] / 32768.0;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      // Resume context if suspended (common in browsers)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const audioBuffer = audioContextRef.current.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      sourceRef.current = audioContextRef.current.createBufferSource();
      sourceRef.current.buffer = audioBuffer;
      sourceRef.current.connect(audioContextRef.current.destination);
      
      sourceRef.current.onended = () => {
        setIsSpeaking(false);
        setCurrentSpeechCharIndex(text.length);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      };

      sourceRef.current.start();
      
      // Simulate char index progress for visual typing effect
      const duration = audioBuffer.duration;
      const startTime = Date.now();
      progressIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= duration) {
          clearInterval(progressIntervalRef.current);
        } else {
          setCurrentSpeechCharIndex(Math.floor((elapsed / duration) * text.length));
        }
      }, 50);

    } catch (error) {
      console.error("Gemini TTS Error, falling back to browser TTS:", error);
      speakWithBrowser(text);
    }
  };

  const stopSpeaking = () => {
    // Stop browser TTS
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    // Stop Gemini TTS
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      sourceRef.current = null;
    }
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    setIsSpeaking(false);
    setCurrentSpeechCharIndex(0);
  };

  const clearTranscript = () => {
    setTranscript('');
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSpeaking,
    currentSpeechCharIndex,
    clearTranscript
  };
}
