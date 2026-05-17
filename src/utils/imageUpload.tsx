import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { v4 } from 'uuid';
import { storage } from '../firebase';

/** @param scopedEntityId - optional user/course Mongo id for per-entity Storage folder */
const imageUpload = async (file: File, folderName: string, orgName: string, scopedEntityId?: string): Promise<string> => {
	const safeName = file.name.replace(/[/\\]/g, '_');
	const storagePath = scopedEntityId
		? `${folderName}/${scopedEntityId}/${v4()}-${safeName}`
		: `${folderName}/${orgName}-${safeName}-${v4()}`;
	const imageRef = ref(storage, storagePath);
	await uploadBytes(imageRef, file);
	return getDownloadURL(imageRef);
};

export default imageUpload;
