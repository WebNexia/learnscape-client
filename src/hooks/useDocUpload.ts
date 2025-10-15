import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const useDocUpload = () => {
	const [docUpload, setDocUpload] = useState<File | null>(null);
	const [isDocSizeLarge, setIsDocSizeLarge] = useState<boolean>(false);
	const [isDocLoading, setIsDocLoading] = useState<boolean>(false);

	const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			if (e.target.files[0].size > 10 * 1024 * 1024) {
				// 10MB limit for documents (admin only)
				setIsDocSizeLarge(true);
			} else {
				setDocUpload(e.target.files[0]);
				setIsDocSizeLarge(false);
			}
		} else {
			setDocUpload(null);
		}
	};

	const handleDocUpload = async (folderName: string, handleUrlCallback: (url: string) => void) => {
		if (docUpload === null || isDocSizeLarge) {
			setIsDocSizeLarge(false);
			return;
		}

		setIsDocLoading(true);
		try {
			const storageRef = ref(storage, `${folderName}/${docUpload.name}`);
			const uploadTask = uploadBytesResumable(storageRef, docUpload);

			uploadTask.on(
				'state_changed',
				(snapshot) => {
					const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
				},
				(error) => {
					console.error('Error uploading PDF:', error);
					setIsDocLoading(false);
				},
				() => {
					getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
						handleUrlCallback(downloadURL);
						setIsDocLoading(false);
					});
				}
			);
		} catch (error) {
			console.error('Error uploading PDF:', error);
			setIsDocLoading(false);
		}
	};

	const resetDocUpload = () => {
		setDocUpload(null);
		setIsDocSizeLarge(false);
	};

	return {
		docUpload,
		isDocSizeLarge,
		handleDocChange,
		resetDocUpload,
		handleDocUpload,
		isDocLoading,
	};
};

export default useDocUpload;
