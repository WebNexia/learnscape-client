import { useState } from 'react';
import { Box, Button, FormControl, Input, Typography } from '@mui/material';
import { Article, CloudUpload } from '@mui/icons-material';
import theme from '../../../themes';
import CustomErrorMessage from '../customFields/CustomErrorMessage';
import CustomTextField from '../customFields/CustomTextField';
import useDocUpload from '../../../hooks/useDocUpload';

interface HandleDocUploadURLProps {
	onDocUploadLogic: (url: string, docName: string) => void;
	setEnterDocUrl: React.Dispatch<React.SetStateAction<boolean>>;
	docFolderName: string;
	enterDocUrl: boolean;
	label?: string;
}

const HandleDocUploadURL = ({ onDocUploadLogic, setEnterDocUrl, docFolderName, enterDocUrl, label = 'File Upload' }: HandleDocUploadURLProps) => {
	const { docUpload, isDocSizeLarge, handleDocChange, resetDocUpload, handleDocUpload } = useDocUpload();
	const [manualDocUrl, setManualDocUrl] = useState<string>('');
	const [docName, setDocName] = useState<string>('');

	const handleDocUploadReusable = () => {
		handleDocUpload(docFolderName, (url: string) => {
			onDocUploadLogic(url, docName);
			setDocName('');
		});
	};

	const handleManualUrlAddition = () => {
		if (manualDocUrl) {
			onDocUploadLogic(manualDocUrl, docName);
			setManualDocUrl(''); // Clear the input field
			setDocName('');
		}
	};

	return (
		<FormControl sx={{ display: 'flex' }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Typography variant='h6'>{label}</Typography>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					<Box>
						<Typography
							variant='body2'
							sx={{ textDecoration: !enterDocUrl ? 'underline' : 'none', cursor: 'pointer' }}
							onClick={() => setEnterDocUrl(false)}>
							Upload
						</Typography>
					</Box>
					<Typography sx={{ margin: '0 0.5rem' }}> | </Typography>
					<Box>
						<Typography
							variant='body2'
							sx={{ textDecoration: enterDocUrl ? 'underline' : 'none', cursor: 'pointer' }}
							onClick={() => {
								setEnterDocUrl(true);
								resetDocUpload();
							}}>
							Enter URL
						</Typography>
					</Box>
				</Box>
			</Box>

			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				<CustomTextField
					placeholder='File Name'
					required={true}
					sx={{ width: '42.5%', marginTop: '0.5rem' }}
					value={docName}
					onChange={(e) => setDocName(e.target.value)}
				/>

				{!enterDocUrl && (
					<Box sx={{ display: 'flex', width: '55%', justifyContent: 'space-between', alignItems: 'center' }}>
						<Input
							type='file'
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
								handleDocChange(e);
							}}
							inputProps={{ accept: '.pdf' }}
							sx={{ width: '82.5%', backgroundColor: theme.bgColor?.common, margin: '0.5rem 0 0.85rem 0', padding: '0.25rem' }}
						/>
						<Button
							onClick={handleDocUploadReusable}
							variant='outlined'
							sx={{ textTransform: 'capitalize', height: '2rem', width: '15%' }}
							disabled={!docUpload || isDocSizeLarge}
							size='small'
							startIcon={<CloudUpload />}>
							Upload
						</Button>
					</Box>
				)}
				{isDocSizeLarge && <CustomErrorMessage>File size exceeds the limit of 1 MB </CustomErrorMessage>}

				{enterDocUrl && (
					<Box sx={{ display: 'flex', width: '55%', justifyContent: 'space-between', alignItems: 'center' }}>
						<CustomTextField
							placeholder='File URL'
							required={false}
							sx={{ width: '82.5%', marginTop: '0.5rem' }}
							value={manualDocUrl}
							onChange={(e) => setManualDocUrl(e.target.value)}
						/>

						<Button
							onClick={handleManualUrlAddition}
							variant='outlined'
							sx={{ textTransform: 'capitalize', height: '2rem', width: '15%' }}
							disabled={!manualDocUrl}
							size='small'
							startIcon={<Article />}>
							Upload
						</Button>
					</Box>
				)}
			</Box>
		</FormControl>
	);
};

export default HandleDocUploadURL;
