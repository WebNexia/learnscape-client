import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { v4 } from 'uuid';

const documentUpload = async (file: File, folderName: string, orgName: string): Promise<string> => {
	const documentRef = ref(storage, `${folderName}/${orgName}-${file.name}-${v4()}`);
	const uploadTask = uploadBytesResumable(documentRef, file);

	return new Promise((resolve, reject) => {
		uploadTask.on(
			'state_changed',
			(error) => {
				reject(error);
			},
			() => {
				getDownloadURL(uploadTask.snapshot.ref)
					.then((downloadURL) => {
						resolve(downloadURL);
					})
					.catch((error) => {
						reject(error);
					});
			}
		);
	});
};

export default documentUpload;
