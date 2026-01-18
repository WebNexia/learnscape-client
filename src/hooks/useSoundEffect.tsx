import { useRef, useCallback } from 'react';

interface UseSoundEffectReturn {
	playSuccessSound: () => void;
	playErrorSound: () => void;
	playFlipSound: () => void;
	playSubmitSound: () => void;
}

export const useSoundEffect = (enabled: boolean = true, isMuted: boolean = false): UseSoundEffectReturn => {
	const successAudioRef = useRef<HTMLAudioElement | null>(null);
	const errorAudioRef = useRef<HTMLAudioElement | null>(null);
	const flipAudioRef = useRef<HTMLAudioElement | null>(null);
	const submitAudioRef = useRef<HTMLAudioElement | null>(null);

	// Initialize audio elements
	if (typeof window !== 'undefined') {
		if (!successAudioRef.current) {
			successAudioRef.current = new Audio('/assets/sounds/success.wav');
			successAudioRef.current.preload = 'auto';
			successAudioRef.current.volume = 0.25;
		}

		if (!errorAudioRef.current) {
			errorAudioRef.current = new Audio('/assets/sounds/error.wav');
			errorAudioRef.current.preload = 'auto';
			errorAudioRef.current.volume = 0.25;
		}

		if (!flipAudioRef.current) {
			flipAudioRef.current = new Audio('/assets/sounds/flip.wav');
			flipAudioRef.current.preload = 'auto';
			flipAudioRef.current.volume = 0.25;
		}

		if (!submitAudioRef.current) {
			submitAudioRef.current = new Audio('/assets/sounds/submit.mp3');
			submitAudioRef.current.preload = 'auto';
			submitAudioRef.current.volume = 0.25;
		}
	}

	const playSuccessSound = useCallback(() => {
		if (!enabled || isMuted || !successAudioRef.current) return;

		try {
			// Reset audio to beginning in case it's already playing
			successAudioRef.current.currentTime = 0;
			successAudioRef.current.play().catch((error) => {
				// Silently handle autoplay restrictions
				console.warn('Could not play success sound:', error);
			});
		} catch (error) {
			console.warn('Error playing success sound:', error);
		}
	}, [enabled, isMuted]);

	const playErrorSound = useCallback(() => {
		if (!enabled || isMuted || !errorAudioRef.current) return;

		try {
			// Reset audio to beginning in case it's already playing
			errorAudioRef.current.currentTime = 0;
			errorAudioRef.current.play().catch((error) => {
				// Silently handle autoplay restrictions
				console.warn('Could not play error sound:', error);
			});
		} catch (error) {
			console.warn('Error playing error sound:', error);
		}
	}, [enabled, isMuted]);

	const playFlipSound = useCallback(() => {
		if (!enabled || isMuted || !flipAudioRef.current) return;

		try {
			// Reset audio to beginning in case it's already playing
			flipAudioRef.current.currentTime = 0;
			flipAudioRef.current.play().catch((error) => {
				// Silently handle autoplay restrictions
				console.warn('Could not play flip sound:', error);
			});
		} catch (error) {
			console.warn('Error playing flip sound:', error);
		}
	}, [enabled, isMuted]);

	const playSubmitSound = useCallback(() => {
		if (!enabled || isMuted || !submitAudioRef.current) return;

		try {
			// Reset audio to beginning in case it's already playing
			submitAudioRef.current.currentTime = 0;
			submitAudioRef.current.play().catch((error) => {
				// Silently handle autoplay restrictions
				console.warn('Could not play submit sound:', error);
			});
		} catch (error) {
			console.warn('Error playing submit sound:', error);
		}
	}, [enabled, isMuted]);

	return {
		playSuccessSound,
		playErrorSound,
		playFlipSound,
		playSubmitSound,
	};
};
