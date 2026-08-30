import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

interface UseDocUploadOptions {
	maxSizeMB?: number; // Default 10MB, can be overridden (e.g., 25MB for resources)
	/** Document Mongo id — uploads to {folderName}/{scopedEntityId}/ (same pattern as images) */
	scopedEntityId?: string;
}

const useDocUpload = (options: UseDocUploadOptions = {}) => {
	const { maxSizeMB = 10, scopedEntityId } = options;
	const [docUpload, setDocUpload] = useState<File | null>(null);
	const [isDocSizeLarge, setIsDocSizeLarge] = useState<boolean>(false);
	const [isDocLoading, setIsDocLoading] = useState<boolean>(false);

	const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			if (e.target.files[0].size > maxSizeMB * 1024 * 1024) {
				setIsDocSizeLarge(true);
			} else {
				setDocUpload(e.target.files[0]);
				setIsDocSizeLarge(false);
			}
		} else {
			setDocUpload(null);
		}
	};

	const handleDocUpload = async (
		folderName: string,
		handleUrlCallback: (url: string) => void
	) => {
		if (docUpload === null || isDocSizeLarge) {
			setIsDocSizeLarge(false);
			return;
		}

		setIsDocLoading(true);
		try {
			const timestamp = Date.now();
			const sanitizedFilename = docUpload.name.replace(/[^a-zA-Z0-9.-]/g, '_');
			const storagePath = scopedEntityId
				? `${folderName}/${scopedEntityId}/${timestamp}-${sanitizedFilename}`
				: `${folderName}/${timestamp}-${sanitizedFilename}`;
			const storageRef = ref(storage, storagePath);
			const uploadTask = uploadBytesResumable(storageRef, docUpload);

			uploadTask.on(
				'state_changed',
				() => {
					// Progress tracking can be added here if needed
				},
				(error) => {
					console.error('Error uploading document:', error);
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
			console.error('Error uploading document:', error);
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
