import { useState, useContext } from 'react';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import uploadVideo from '../utils/videoUpload';

const useVideoUpload = () => {
	const { organisation } = useContext(OrganisationContext);
	const [videoUpload, setVideoUpload] = useState<File | null>(null);
	const [isVideoSizeLarge, setIsVideoSizeLarge] = useState<boolean>(false);

	const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			if (e.target.files[0].size > 30 * 1024 * 1024) {
				// Assuming 30MB as the size limit for the video
				setIsVideoSizeLarge(true);
			} else {
				setVideoUpload(e.target.files[0]);
				setIsVideoSizeLarge(false);
			}
		} else {
			setVideoUpload(null);
		}
	};

	const handleVideoUpload = async (folderName: string, handleUrlCallback: (url: string) => void) => {
		if (videoUpload === null || isVideoSizeLarge) {
			setIsVideoSizeLarge(false);
			return;
		}
		try {
			const url = await uploadVideo(videoUpload, folderName, organisation?.orgName || 'defaultOrg');
			handleUrlCallback(url);
		} catch (error) {
			console.error('Error uploading video:', error);
		}
	};

	const resetVideoUpload = () => {
		setVideoUpload(null);
		setIsVideoSizeLarge(false);
	};

	return {
		videoUpload,
		isVideoSizeLarge,
		handleVideoChange,
		handleVideoUpload,
		resetVideoUpload,
		setIsVideoSizeLarge,
		setVideoUpload,
	};
};

export default useVideoUpload;
