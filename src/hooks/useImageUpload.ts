import { useState } from 'react';

import { useContext } from 'react';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import uploadImage from '../utils/imageUpload';

const useImageUpload = () => {
	const { organisation } = useContext(OrganisationContext);
	const [imageUpload, setImageUpload] = useState<File | null>(null);
	const [isImgSizeLarge, setIsImageSizeLarge] = useState<boolean>(false);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			if (e.target.files[0].size > 1024 * 1024) {
				setIsImageSizeLarge(true);
			} else {
				setImageUpload(e.target.files[0]);
				setIsImageSizeLarge(false);
			}
		} else {
			setImageUpload(null);
		}
	};

	const handleImageUpload = async (folderName: string, handleUrlCallback: (url: string) => void) => {
		if (imageUpload === null || isImgSizeLarge) {
			setIsImageSizeLarge(false);
			return;
		}
		try {
			const url = await uploadImage(imageUpload, folderName, organisation?.orgName || 'defaultOrg');
			handleUrlCallback(url);
		} catch (error) {
			console.error('Error uploading image:', error);
		}
	};

	const resetImageUpload = () => {
		setImageUpload(null);
		setIsImageSizeLarge(false);
	};

	return {
		imageUpload,
		isImgSizeLarge,
		handleImageChange,
		handleImageUpload,
		setIsImageSizeLarge,
		setImageUpload,
		resetImageUpload,
	};
};

export default useImageUpload;
