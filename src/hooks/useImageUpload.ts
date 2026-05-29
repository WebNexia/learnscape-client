import { useCallback, useContext, useRef, useState } from 'react';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import uploadImage from '../utils/imageUpload';
import { normalizeImageForUpload } from '../utils/normalizeImageForUpload';

interface UseImageUploadOptions {
	maxSizeInMB?: number;
	/** User or course Mongo id — uploads to {folderName}/{scopedEntityId}/ */
	scopedEntityId?: string;
}

const useImageUpload = (options: UseImageUploadOptions = {}) => {
	const { maxSizeInMB = 3, scopedEntityId } = options;
	const { organisation } = useContext(OrganisationContext);
	const [imageUpload, setImageUpload] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [isImgSizeLarge, setIsImageSizeLarge] = useState<boolean>(false);
	const [isUploading, setIsUploading] = useState<boolean>(false);
	const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
	const previewUrlRef = useRef<string | null>(null);

	const clearPreviewUrl = useCallback(() => {
		if (previewUrlRef.current) {
			URL.revokeObjectURL(previewUrlRef.current);
			previewUrlRef.current = null;
		}
	}, []);

	const setPreviewUrl = useCallback(
		(url: string | null) => {
			clearPreviewUrl();
			previewUrlRef.current = url;
			setImagePreview(url);
		},
		[clearPreviewUrl]
	);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			const file = e.target.files[0];
			if (file.size > maxSizeInMB * 1024 * 1024) {
				setImageUpload(null);
				setPreviewUrl(null);
				setIsImageSizeLarge(true);
			} else {
				setImageUpload(file);
				setPreviewUrl(URL.createObjectURL(file));
				setIsImageSizeLarge(false);
			}
		} else {
			setImageUpload(null);
			setPreviewUrl(null);
		}
	};

	const processSelectedFile = useCallback(
		async (file: File): Promise<string | null> => {
			setIsProcessingImage(true);
			setIsImageSizeLarge(false);

			try {
				const normalized = await normalizeImageForUpload(file, maxSizeInMB);
				setImageUpload(normalized);
				const previewUrl = URL.createObjectURL(normalized);
				setPreviewUrl(previewUrl);
				return previewUrl;
			} catch {
				setImageUpload(null);
				setPreviewUrl(null);
				setIsImageSizeLarge(true);
				return null;
			} finally {
				setIsProcessingImage(false);
			}
		},
		[maxSizeInMB, setPreviewUrl]
	);

	const handleImageUpload = async (folderName: string, handleUrlCallback: (url: string) => void) => {
		if (!imageUpload || isImgSizeLarge) {
			setIsImageSizeLarge(false);
			return;
		}

		try {
			setIsUploading(true);
			const url = await uploadImage(imageUpload, folderName, organisation?.orgName || 'defaultOrg', scopedEntityId);
			handleUrlCallback(url);
		} catch (error) {
			console.error('Error uploading image:', error);
		} finally {
			setIsUploading(false);
		}
	};

	const resetImageUpload = useCallback(() => {
		setImageUpload(null);
		setPreviewUrl(null);
		setIsImageSizeLarge(false);
		setIsProcessingImage(false);
	}, [setPreviewUrl]);

	return {
		imageUpload,
		isImgSizeLarge,
		imagePreview,
		isProcessingImage,
		handleImageChange,
		processSelectedFile,
		handleImageUpload,
		isUploading,
		resetImageUpload,
		maxSizeInMB,
	};
};

export default useImageUpload;
