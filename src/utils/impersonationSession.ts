import { browserSessionPersistence, setPersistence, signInWithCustomToken, signOut, User } from 'firebase/auth';
import { impersonationAuth } from '../firebase';

let active = false;
let startInProgress = false;
let readySettled = false;
let resolveReady: () => void = () => {};

/** Resolves after the impersonation auth store has reported its restored user (or none). */
export const impersonationAuthReady: Promise<void> = new Promise((resolve) => {
	resolveReady = resolve;
});

export function markImpersonationAuthReady(): void {
	if (readySettled) return;
	readySettled = true;
	resolveReady();
}

export function isImpersonationSessionActive(): boolean {
	return active;
}

export function setImpersonationSessionActive(next: boolean): void {
	active = next;
}

export function isImpersonationStartInProgress(): boolean {
	return startInProgress;
}

export function setImpersonationStartInProgress(next: boolean): void {
	startInProgress = next;
}

let persistenceReady: Promise<void> | null = null;

export function ensureImpersonationPersistence(): Promise<void> {
	if (!persistenceReady) {
		persistenceReady = setPersistence(impersonationAuth, browserSessionPersistence).then(() => undefined);
	}
	return persistenceReady;
}

/**
 * Signs in on the secondary Firebase app. The owner's default auth session is left in place.
 * The active flag is set before sign-in so the first learner request does not register a device session.
 */
export async function signInImpersonation(customToken: string): Promise<User> {
	await ensureImpersonationPersistence();
	setImpersonationSessionActive(true);
	try {
		const credential = await signInWithCustomToken(impersonationAuth, customToken);
		return credential.user;
	} catch (error) {
		setImpersonationSessionActive(false);
		throw error;
	}
}

export async function signOutImpersonation(): Promise<void> {
	setImpersonationSessionActive(false);
	if (impersonationAuth.currentUser) {
		await signOut(impersonationAuth);
	}
}
