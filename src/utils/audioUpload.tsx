import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { v4 } from 'uuid';
import { storage } from '../firebase';

/** @param scopedEntityId - optional topic/message Mongo id for per-entity Storage folder */
const audioUpload = async (blob: Blob, folderName: string, orgName: string, scopedEntityId?: string): Promise<string> => {
	const storagePath = scopedEntityId
		? `${folderName}/${scopedEntityId}/${v4()}.webm`
		: `${folderName}/${orgName}-${Date.now()}.webm`;
	const audioRef = ref(storage, storagePath);
	await uploadBytes(audioRef, blob);
	return getDownloadURL(audioRef);
};

export default audioUpload;
