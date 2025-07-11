import { useState, useContext } from 'react';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import uploadImage from '../utils/imageUpload';

interface UseImageUploadOptions {
	maxSizeInMB?: number;
}

const useImageUpload = (options: UseImageUploadOptions = {}) => {
	const { maxSizeInMB = 3 } = options; // Default to 3MB for backward compatibility
	const { organisation } = useContext(OrganisationContext); // Assuming you have org context
	const [imageUpload, setImageUpload] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null); // State for preview URL
	const [isImgSizeLarge, setIsImageSizeLarge] = useState<boolean>(false);
	const [isUploading, setIsUploading] = useState<boolean>(false); // Uploading state

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			const file = e.target.files[0];
			if (file.size > maxSizeInMB * 1024 * 1024) {
				// Image size validation (configurable limit)
				setIsImageSizeLarge(true);
			} else {
				setImageUpload(file);
				setImagePreview(URL.createObjectURL(file)); // Create preview URL for selected image
				setIsImageSizeLarge(false);
			}
		} else {
			setImageUpload(null);
			setImagePreview(null); // Reset preview if no image is selected
		}
	};

	const handleImageUpload = async (folderName: string, handleUrlCallback: (url: string) => void) => {
		if (!imageUpload || isImgSizeLarge) {
			setIsImageSizeLarge(false);
			return;
		}

		try {
			setIsUploading(true); // Set uploading to true
			const url = await uploadImage(imageUpload, folderName, organisation?.orgName || 'defaultOrg');
			handleUrlCallback(url);
		} catch (error) {
			console.error('Error uploading image:', error);
		} finally {
			setIsUploading(false); // Set uploading to false after completion
		}
	};

	const resetImageUpload = () => {
		setImageUpload(null);
		setImagePreview(null);
		setIsImageSizeLarge(false);
	};

	return {
		imageUpload,
		isImgSizeLarge,
		imagePreview, // Return preview URL
		handleImageChange,
		handleImageUpload,
		isUploading, // Return uploading state
		resetImageUpload,
		maxSizeInMB, // Return the size limit for error messages
	};
};

export default useImageUpload;
