import { ref, listAll, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';
import { deleteFirebaseStorageUrls } from './deleteFirebaseStorageUrls';

const GROUP_IMAGES_FOLDER = 'GroupImages';

const isStorageUrl = (url: string): boolean =>
	typeof url === 'string' &&
	url.trim().length > 0 &&
	(url.includes('firebasestorage.googleapis.com') || url.includes('storage.googleapis.com'));

function pathFromStorageUrl(url: string): string | null {
	const match = url.trim().match(/\/o\/(.+?)(\?|$)/);
	if (!match) return null;
	try {
		return decodeURIComponent(match[1].replace(/\+/g, ' '));
	} catch {
		return null;
	}
}

/** Generate a Firestore chat id for a new group (used before the chat document exists). */
export function generateGroupChatId(): string {
	return `group_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Keep one group image under GroupImages/{chatId}/; remove folder orphans and dropped previous URL.
 * Mirrors server cleanupScopedStorageImages for course/topic covers.
 */
export async function cleanupGroupChatImages(
	chatId: string,
	keepImageUrl: string | null | undefined,
	previousImageUrl: string | null | undefined
): Promise<void> {
	if (!chatId) return;

	const keep = (keepImageUrl || '').trim();
	const previous = (previousImageUrl || '').trim();
	const keepPath = keep && isStorageUrl(keep) ? pathFromStorageUrl(keep) : null;
	const scopedPrefix = `${GROUP_IMAGES_FOLDER}/${chatId}/`;

	try {
		const folderRef = ref(storage, `${GROUP_IMAGES_FOLDER}/${chatId}`);
		const listing = await listAll(folderRef);
		await Promise.allSettled(
			listing.items.map(async (item) => {
				if (!keep) {
					await deleteObject(item);
					return;
				}
				if (keepPath && item.fullPath === keepPath) return;
				if (keepPath) await deleteObject(item);
			})
		);
	} catch {
		// Prefix may not exist yet
	}

	if (previous && isStorageUrl(previous) && previous !== keep) {
		const previousPath = pathFromStorageUrl(previous);
		if (previousPath?.startsWith(scopedPrefix) && (!keepPath || previousPath !== keepPath)) {
			await deleteFirebaseStorageUrls([previous]);
		}
	}
}
