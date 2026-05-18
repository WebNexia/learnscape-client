import { ref, listAll, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

const EDITOR_IMAGES_FOLDER = 'editor-images';

/** Remove all files under editor-images/{scopedEntityId}/ (e.g. emails/{sessionId}). */
export async function deleteAllEditorImagesInScope(scopedEntityId: string): Promise<void> {
	if (!scopedEntityId?.trim()) return;

	try {
		const folderRef = ref(storage, `${EDITOR_IMAGES_FOLDER}/${scopedEntityId}`);
		const listing = await listAll(folderRef);
		await Promise.allSettled(listing.items.map((item) => deleteObject(item)));
	} catch {
		// Prefix may not exist yet
	}
}
