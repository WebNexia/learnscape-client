import { ref, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

const isFirebaseStorageUrl = (url: string): boolean =>
	typeof url === 'string' &&
	url.trim().length > 0 &&
	(url.includes('firebasestorage.googleapis.com') || url.includes('storage.googleapis.com'));

/** Paths that must never be deleted via chat/message cleanup (profile photos, etc.) */
const PROTECTED_STORAGE_PREFIXES = ['ProfileImages/'];

function isProtectedStoragePath(path: string): boolean {
	return PROTECTED_STORAGE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/** Extract storage path from a Firebase Storage download URL (e.g. .../o/path%2Fto%2Ffile?...) */
function pathFromStorageUrl(url: string): string | null {
	const match = url.trim().match(/\/o\/(.+?)(\?|$)/);
	if (!match) return null;
	try {
		return decodeURIComponent(match[1].replace(/\+/g, ' '));
	} catch {
		return null;
	}
}

/**
 * Deletes files from Firebase Storage by their full download URLs.
 * Used when chat messages or chats are deleted so uploaded images/videos are removed.
 * Failures for individual URLs are caught and logged; does not throw.
 */
export async function deleteFirebaseStorageUrls(urls: string[]): Promise<void> {
	const toDelete = [...new Set(urls)].filter(isFirebaseStorageUrl);
	if (toDelete.length === 0) return;
	await Promise.allSettled(
		toDelete.map(async (url) => {
			try {
				const path = pathFromStorageUrl(url);
				if (!path || isProtectedStoragePath(path)) return;
				const storageRef = ref(storage, path);
				await deleteObject(storageRef);
			} catch (err) {
				console.warn('Failed to delete Storage file:', url.slice(0, 80), (err as Error).message);
			}
		})
	);
}
