import { Box, Typography } from '@mui/material';
import { useContext, useState } from 'react';
import HandleDocUploadURL from '../forms/uploadImageVideoDocument/HandleDocUploadURL';
import { Document } from '../../interfaces/document';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

interface AnswerKeyUploadProps {
	document: Document | null;
	setDocument: (doc: Document | null) => void;
}

const AnswerKeyUpload = ({ document, setDocument }: AnswerKeyUploadProps) => {
	const [enterUrl, setEnterUrl] = useState(true);
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	if (!document) return null;

	return (
		<Box sx={{ margin: isMobileSize ? '0.25rem 0 0.75rem' : '0.25rem 1rem 0.75rem' }}>
			<HandleDocUploadURL
				label='Answer Key'
				optional
				enterDocUrl={enterUrl}
				setEnterDocUrl={setEnterUrl}
				docFolderName='AnswerKeys'
				fromAdminDocs
				scopedEntityId={document._id}
				initialDocumentUrl={document.answerKeyUrl || ''}
				setDocumentUrl={(url) => {
					setDocument({ ...document, answerKeyUrl: typeof url === 'string' ? url : '' });
				}}
			/>
			<Typography sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', color: 'text.secondary', mt: -0.5 }}>
				Optional. Buyers receive this file in the purchase email, next to the book. It is not shown on the public page.
			</Typography>
		</Box>
	);
};

export default AnswerKeyUpload;
