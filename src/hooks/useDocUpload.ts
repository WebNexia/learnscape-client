// hooks/useDocUpload.js

import { useContext, useState } from 'react';
import documentUpload from '../utils/documentUpload';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';

const useDocUpload = () => {
	const { organisation } = useContext(OrganisationContext);
	const [docUpload, setDocUpload] = useState<File | null>(null);
	const [isDocSizeLarge, setIsDocSizeLarge] = useState(false);
	const [isDocLoading, setIsDocLoading] = useState(false);

	const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			const file = e.target.files[0];
			if (file.size > 1024 * 1024) {
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
			const url = await documentUpload(docUpload, folderName, organisation?.orgName || 'defaultOrg');
			handleUrlCallback(url);
		} catch (error) {
			console.error('Error uploading document:', error);
		} finally {
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
		handleDocUpload,
		resetDocUpload,
		isDocLoading,
	};
};

export default useDocUpload;
