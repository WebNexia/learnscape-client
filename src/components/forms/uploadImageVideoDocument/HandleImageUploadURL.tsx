import { Box, FormControl, IconButton, Input, Tooltip, Typography } from '@mui/material';
import React, { ChangeEvent, useContext } from 'react';
import CustomErrorMessage from '../customFields/CustomErrorMessage';
import CustomTextField from '../customFields/CustomTextField';
import { CloudUpload } from '@mui/icons-material';
import theme from '../../../themes';
import useImageUpload from '../../../hooks/useImageUpload';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';

interface HandleImageUploadURLProps {
	onImageUploadLogic: (url: string) => void;
	onChangeImgUrl?: (e: ChangeEvent<HTMLInputElement>) => void;
	setEnterImageUrl: React.Dispatch<React.SetStateAction<boolean>>;
	imageUrlValue: string;
	imageFolderName: string;
	enterImageUrl: boolean;
	label?: string;
	disabled?: boolean;
}

const HandleImageUploadURL = ({
	onImageUploadLogic,
	onChangeImgUrl,
	setEnterImageUrl,
	imageUrlValue,
	imageFolderName,
	enterImageUrl,
	label = 'Image',
	disabled = false,
}: HandleImageUploadURLProps) => {
	const { imageUpload, isImgSizeLarge, handleImageChange, resetImageUpload, handleImageUpload } = useImageUpload();

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const { user } = useContext(UserAuthContext);

	const handleImageUploadReusable = () => {
		handleImageUpload(imageFolderName, (url: string) => {
			onImageUploadLogic(url);
		});
	};
	return (
		<FormControl sx={{ display: 'flex' }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Typography variant={isMobileSize ? 'body2' : 'h6'} sx={{ fontSize: !isMobileSize ? '0.9rem' : 'inherit' }}>
					{label}
				</Typography>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					{user?.role === 'admin' && (
						<>
							<Box>
								<Typography
									variant='body2'
									sx={{ textDecoration: !enterImageUrl ? 'underline' : 'none', cursor: 'pointer', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}
									onClick={() => setEnterImageUrl(false)}>
									Choose
								</Typography>
							</Box>

							<Typography sx={{ margin: '0 0.5rem' }}> | </Typography>

							<Box>
								<Typography
									variant='body2'
									sx={{ textDecoration: enterImageUrl ? 'underline' : 'none', cursor: 'pointer', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}
									onClick={() => {
										setEnterImageUrl(true);
										resetImageUpload();
									}}>
									Enter URL
								</Typography>
							</Box>
						</>
					)}
				</Box>
			</Box>
			{!enterImageUrl && (
				<Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
					<Input
						type='file'
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
							handleImageChange(e);
						}}
						disabled={disabled}
						inputProps={{ accept: '.jpg, .jpeg, .png' }} // Specify accepted file types
						sx={{
							width: '82.5%',
							backgroundColor: theme.bgColor?.common,
							margin: '0.5rem 0 0.85rem 0',
							padding: '0.25rem',
							fontSize: isMobileSize ? '0.75rem' : '0.9rem',
						}}
					/>
					<Tooltip title='Upload' placement='top'>
						<IconButton
							onClick={handleImageUploadReusable}
							sx={{ height: '2rem', width: '12.5%', border: '0.02rem solid gray', borderRadius: '0.35rem' }}
							disabled={!imageUpload || isImgSizeLarge}>
							<CloudUpload fontSize='small' />
						</IconButton>
					</Tooltip>
				</Box>
			)}
			{isImgSizeLarge && (
				<CustomErrorMessage sx={{ margin: isMobileSize ? '-0.5rem 0 1rem 0' : undefined }}>File size exceeds the limit of 1 MB </CustomErrorMessage>
			)}

			{enterImageUrl && user?.role === 'admin' && (
				<CustomTextField
					disabled={disabled}
					placeholder='Image URL'
					required={false}
					sx={{ marginTop: '0.5rem' }}
					value={imageUrlValue}
					onChange={onChangeImgUrl}
					InputProps={{
						sx: { '& input::placeholder': { fontSize: '0.875rem' }, '& input': { fontSize: '0.85rem' } }, // Adjust this value as needed
					}}
				/>
			)}
		</FormControl>
	);
};

export default HandleImageUploadURL;
