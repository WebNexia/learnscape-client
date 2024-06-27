import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { v4 } from 'uuid';
import { storage } from '../firebase';

const imageUpload = async (file: File, folderName: string, orgName: string): Promise<string> => {
	const imageRef = ref(storage, `${folderName}/${orgName}-${file.name}-${v4()}`);
	await uploadBytes(imageRef, file);
	return getDownloadURL(imageRef);
};

export default imageUpload;
