import { Box, Button, FormControl, Input, Typography } from '@mui/material';
import React, { ChangeEvent } from 'react';
import CustomErrorMessage from '../customFields/CustomErrorMessage';
import CustomTextField from '../customFields/CustomTextField';
import { CloudUpload } from '@mui/icons-material';
import theme from '../../../themes';
import useImageUpload from '../../../hooks/useImageUpload';

interface HandleImageUploadURLProps {
	onImageUploadLogic: (url: string) => void;
	onChangeImgUrl?: (e: ChangeEvent<HTMLInputElement>) => void;
	setEnterImageUrl: React.Dispatch<React.SetStateAction<boolean>>;
	imageUrlValue: string;
	imageFolderName: string;
	enterImageUrl: boolean;
	label?: string;
}

const HandleImageUploadURL = ({
	onImageUploadLogic,
	onChangeImgUrl,
	setEnterImageUrl,
	imageUrlValue,
	imageFolderName,
	enterImageUrl,
	label = 'Image',
}: HandleImageUploadURLProps) => {
	const { imageUpload, isImgSizeLarge, handleImageChange, resetImageUpload, handleImageUpload } = useImageUpload();

	const handleImageUploadReusable = () => {
		handleImageUpload(imageFolderName, (url: string) => {
			onImageUploadLogic(url);
		});
	};
	return (
		<FormControl sx={{ display: 'flex' }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Typography variant='h6'>{label}</Typography>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					<Box>
						<Typography
							variant='body2'
							sx={{ textDecoration: !enterImageUrl ? 'underline' : 'none', cursor: 'pointer' }}
							onClick={() => setEnterImageUrl(false)}>
							Upload
						</Typography>
					</Box>
					<Typography sx={{ margin: '0 0.5rem' }}> | </Typography>
					<Box>
						<Typography
							variant='body2'
							sx={{ textDecoration: enterImageUrl ? 'underline' : 'none', cursor: 'pointer' }}
							onClick={() => {
								setEnterImageUrl(true);
								resetImageUpload();
							}}>
							Enter URL
						</Typography>
					</Box>
				</Box>
			</Box>
			{!enterImageUrl && (
				<Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
					<Input
						type='file'
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
							handleImageChange(e);
						}}
						inputProps={{ accept: '.jpg, .jpeg, .png' }} // Specify accepted file types
						sx={{ width: '82.5%', backgroundColor: theme.bgColor?.common, margin: '0.5rem 0 0.85rem 0', padding: '0.25rem' }}
					/>
					<Button
						onClick={handleImageUploadReusable}
						variant='outlined'
						sx={{ textTransform: 'capitalize', height: '2rem', width: '15%' }}
						disabled={!imageUpload || isImgSizeLarge}
						size='small'
						startIcon={<CloudUpload />}>
						Upload
					</Button>
				</Box>
			)}
			{isImgSizeLarge && <CustomErrorMessage>File size exceeds the limit of 1 MB </CustomErrorMessage>}

			{enterImageUrl && (
				<CustomTextField placeholder='Image URL' required={false} sx={{ marginTop: '0.5rem' }} value={imageUrlValue} onChange={onChangeImgUrl} />
			)}
		</FormControl>
	);
};

export default HandleImageUploadURL;
