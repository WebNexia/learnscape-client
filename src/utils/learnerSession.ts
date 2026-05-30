const LEARNER_SESSION_STORAGE_KEY = 'learnerSessionId';

let forceNewLearnerSessionOnNextRegister = false;
let suppressSessionSupersededUntil = 0;

export function getLearnerSessionId(): string | null {
	return localStorage.getItem(LEARNER_SESSION_STORAGE_KEY);
}

export function setLearnerSessionId(sessionId: string): void {
	localStorage.setItem(LEARNER_SESSION_STORAGE_KEY, sessionId);
}

export function clearLearnerSessionId(): void {
	localStorage.removeItem(LEARNER_SESSION_STORAGE_KEY);
}

/** Call before sign-in so auth listeners use a fresh session (not stale localStorage). */
export function markNewLearnerLogin(): void {
	forceNewLearnerSessionOnNextRegister = true;
	clearLearnerSessionId();
	// Avoid "signed in elsewhere" dialog while login + session registration finish.
	suppressSessionSupersededUntil = Date.now() + 12_000;
}

export function shouldSuppressLearnerSessionSuperseded(): boolean {
	return Date.now() < suppressSessionSupersededUntil || forceNewLearnerSessionOnNextRegister;
}

export function shouldForceNewLearnerSession(): boolean {
	return forceNewLearnerSessionOnNextRegister;
}

export function clearForceNewLearnerSession(): void {
	forceNewLearnerSessionOnNextRegister = false;
}

export const LEARNER_SESSION_SUPERSEDED_EVENT = 'learner-session-superseded';

export function emitLearnerSessionSuperseded(): void {
	window.dispatchEvent(new CustomEvent(LEARNER_SESSION_SUPERSEDED_EVENT));
}
