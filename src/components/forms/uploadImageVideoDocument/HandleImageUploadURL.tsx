import { Box, FormControl, IconButton, Input, Tooltip, Typography, Snackbar, Alert } from '@mui/material';
import React, { ChangeEvent, forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react';
import CustomErrorMessage from '../customFields/CustomErrorMessage';
import CustomTextField from '../customFields/CustomTextField';
import CustomSubmitButton from '../customButtons/CustomSubmitButton';
import { CloudUpload } from '@mui/icons-material';
import theme from '../../../themes';
import useImageUpload from '../../../hooks/useImageUpload';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { validateImageUrl } from '../../../utils/urlValidation';

interface HandleImageUploadURLProps {
	onImageUploadLogic: (url: string) => void;
	onChangeImgUrl?: (e: ChangeEvent<HTMLInputElement>) => void;
	setEnterImageUrl: React.Dispatch<React.SetStateAction<boolean>>;
	imageUrlValue: string;
	imageFolderName: string;
	enterImageUrl: boolean;
	label?: string;
	labelDescription?: string;
	disabled?: boolean;
	isImageUploadLimitReached?: boolean;
	imageUploadAttempts?: number;
	maxSessionAttempts?: number;
	onImageUploadAttempt?: () => void;
	/** Settings profile picture: Save button runs upload + DB update via parent */
	saveButtonMode?: boolean;
	onSaveImage?: (file: File) => Promise<void>;
	isSaving?: boolean;
	onPreviewChange?: (previewUrl: string | null) => void;
	/** Upload to {imageFolderName}/{scopedEntityId}/ when set (course cover, profile picture) */
	scopedEntityId?: string;
}

export type HandleImageUploadURLHandle = {
	clearFileSelection: () => void;
};

const HandleImageUploadURL = forwardRef<HandleImageUploadURLHandle, HandleImageUploadURLProps>(({
	onImageUploadLogic,
	onChangeImgUrl,
	setEnterImageUrl,
	imageUrlValue,
	imageFolderName,
	enterImageUrl,
	label = 'Image',
	labelDescription = '',
	disabled = false,
	isImageUploadLimitReached = false,
	imageUploadAttempts = 0,
	maxSessionAttempts = 5,
	onImageUploadAttempt,
	saveButtonMode = false,
	onSaveImage,
	isSaving = false,
	onPreviewChange,
	scopedEntityId,
}, ref) => {
	const { imageUpload, isImgSizeLarge, handleImageChange, resetImageUpload, handleImageUpload, maxSizeInMB } = useImageUpload({
		scopedEntityId,
	});

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const { user } = useContext(UserAuthContext);

	const [isUrlErrorOpen, setIsUrlErrorOpen] = useState<boolean>(false);
	const [urlErrorMessage, setUrlErrorMessage] = useState<string>('');
	const fileInputRef = useRef<HTMLInputElement>(null);

	const clearFileSelection = useCallback(() => {
		resetImageUpload();
		onPreviewChange?.(null);
		setIsUrlErrorOpen(false);
		setUrlErrorMessage('');
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	}, [resetImageUpload, onPreviewChange]);

	useImperativeHandle(ref, () => ({ clearFileSelection }), [clearFileSelection]);

	// Debounced URL validation
	useEffect(() => {
		if (!imageUrlValue?.trim()) {
			return;
		}

		const timeoutId = setTimeout(async () => {
			try {
				const validation = await validateImageUrl(imageUrlValue?.trim());
				if (!validation.isValid) {
					setUrlErrorMessage(`Image URL: ${validation.error}`);
					setIsUrlErrorOpen(true);
				}
			} catch (error) {
				// Don't show error for network issues during typing
			}
		}, 250); // 250ms delay

		return () => clearTimeout(timeoutId);
	}, [imageUrlValue]);

	// URL validation function
	const validateImageUrlOnChange = async (url: string): Promise<void> => {
		if (!url.trim()) return; // Don't validate empty URLs

		try {
			const validation = await validateImageUrl(url.trim());
			if (!validation.isValid) {
				setUrlErrorMessage(`Image URL: ${validation.error}`);
				setIsUrlErrorOpen(true);
			}
		} catch (error) {
			console.error('URL validation error:', error);
		}
	};

	const handleImageUploadReusable = () => {
		// Check session attempt limit
		if (imageUploadAttempts >= maxSessionAttempts) {
			return; // Don't proceed if session limit reached
		}

		handleImageUpload(imageFolderName, (url: string) => {
			onImageUploadLogic(url);
			// For Firebase URLs, add a small delay to ensure they're accessible
			const isFirebaseUrl = url?.includes('firebasestorage.googleapis.com') || url?.includes('storage.googleapis.com');
			const delay = isFirebaseUrl ? 1000 : 0; // 1 second delay for Firebase URLs

			setTimeout(() => {
				validateImageUrlOnChange(url);
			}, delay);

			// Increment attempt counter AFTER upload completes
			if (onImageUploadAttempt) {
				onImageUploadAttempt();
			}
		});
	};

	const handleSaveClick = async () => {
		if (!imageUpload || isImgSizeLarge || isSaving) return;

		if (saveButtonMode && onSaveImage) {
			try {
				await onSaveImage(imageUpload);
				clearFileSelection();
			} catch (error) {
				console.error('Profile picture save failed:', error);
			}
			return;
		}

		handleImageUploadReusable();
	};

	return (
		<>
			<FormControl sx={{ display: 'flex', width: '100%' }}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<Typography variant={isMobileSize ? 'body2' : 'h6'} sx={{ fontSize: !isMobileSize ? '1rem' : '0.75rem' }}>
						{label}
						{labelDescription && <span style={{ color: 'gray', fontSize: '0.75rem', marginLeft: '0.25rem' }}>{labelDescription}</span>}
					</Typography>
					<Box sx={{ display: 'flex', alignItems: 'center' }}>
						{user?.role !== 'learner' && (
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
											clearFileSelection();
										}}>
										Enter URL
									</Typography>
								</Box>
							</>
						)}
					</Box>
				</Box>
				{((!enterImageUrl && user?.role !== 'learner') || user?.role === 'learner') &&
					!isImageUploadLimitReached &&
					imageUploadAttempts < maxSessionAttempts && (
						<Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
							<Input
								type='file'
								inputRef={fileInputRef}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
									const file = e.target.files?.[0];
									handleImageChange(e);
									if (file && file.size <= maxSizeInMB * 1024 * 1024) {
										onPreviewChange?.(URL.createObjectURL(file));
									} else {
										onPreviewChange?.(null);
									}
								}}
								disabled={disabled || isSaving}
								inputProps={{ accept: '.jpg, .jpeg, .png' }} // Specify accepted file types
								sx={{
									width: '82.5%',
									backgroundColor: theme.bgColor?.common,
									margin: '0.5rem 0 0.85rem 0',
									padding: '0.25rem',
									fontSize: isMobileSize ? '0.75rem' : '0.9rem',
								}}
							/>
							{saveButtonMode ? (
								<CustomSubmitButton
									type='button'
									variant='contained'
									size='small'
									onClick={handleSaveClick}
									disabled={!imageUpload || isImgSizeLarge || isSaving}
								>
									{isSaving ? 'Saving...' : 'Save'}
								</CustomSubmitButton>
							) : (
								<Tooltip title='Upload' placement='top' arrow>
									<IconButton
										onClick={handleImageUploadReusable}
										sx={{ height: '2rem', width: '12.5%', border: '0.02rem solid gray', borderRadius: '0.35rem' }}
										disabled={!imageUpload || isImgSizeLarge || isSaving}>
										<CloudUpload fontSize='small' />
									</IconButton>
								</Tooltip>
							)}
						</Box>
					)}

				{/* Show message when session attempts reached */}
				{imageUploadAttempts >= maxSessionAttempts && !isImageUploadLimitReached && !imageUrlValue && (
					<Typography variant='body2' color='error' sx={{ mt: 1, textAlign: 'center' }}>
						Maximum upload attempts reached for this session. Please refresh the page to try again.
					</Typography>
				)}
				{isImgSizeLarge && (
					<CustomErrorMessage sx={{ margin: isMobileSize ? '-0.5rem 0 1rem 0' : undefined }}>
						File size exceeds the limit of {maxSizeInMB} MB{' '}
					</CustomErrorMessage>
				)}

				{enterImageUrl && user?.role !== 'learner' && (
					<CustomTextField
						disabled={disabled}
						placeholder='Image URL'
						required={false}
						sx={{ marginTop: '0.5rem' }}
						value={imageUrlValue}
						onChange={(e) => {
							if (onChangeImgUrl) {
								onChangeImgUrl(e);
							}
							validateImageUrlOnChange(e.target.value);
						}}
						InputProps={{
							sx: {
								'& input::placeholder': { fontSize: isMobileSize ? '0.7rem' : '0.8rem' },
								'& input': { fontSize: isMobileSize ? '0.75rem' : '0.85rem' },
							},
						}}
					/>
				)}
			</FormControl>

			<Snackbar
				open={isUrlErrorOpen}
				autoHideDuration={3500}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				onClose={() => setIsUrlErrorOpen(false)}>
				<Alert severity='error' variant='filled' sx={{ width: '100%' }}>
					{urlErrorMessage}
				</Alert>
			</Snackbar>
		</>
	);
});

HandleImageUploadURL.displayName = 'HandleImageUploadURL';

export default HandleImageUploadURL;
