const LEARNER_SESSION_STORAGE_KEY = 'learnerSessionId';

let forceNewLearnerSessionOnNextRegister = false;

export function getLearnerSessionId(): string | null {
	return localStorage.getItem(LEARNER_SESSION_STORAGE_KEY);
}

export function setLearnerSessionId(sessionId: string): void {
	localStorage.setItem(LEARNER_SESSION_STORAGE_KEY, sessionId);
}

export function clearLearnerSessionId(): void {
	localStorage.removeItem(LEARNER_SESSION_STORAGE_KEY);
}

/** Call on explicit sign-in so the next register creates a new server session. */
export function markNewLearnerLogin(): void {
	forceNewLearnerSessionOnNextRegister = true;
	clearLearnerSessionId();
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
