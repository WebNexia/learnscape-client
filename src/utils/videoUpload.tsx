import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { v4 } from 'uuid';
import { storage } from '../firebase';

const uploadVideo = async (file: File, folderName: string, orgName: string): Promise<string> => {
	const videoRef = ref(storage, `${folderName}/${orgName}-${file.name}-${v4()}`);
	await uploadBytes(videoRef, file);
	return getDownloadURL(videoRef);
};

export default uploadVideo;
