import { Alert, Box, IconButton, InputAdornment, Snackbar, Tooltip, Typography } from '@mui/material';
import { Cancel, Image, InsertEmoticon, Send } from '@mui/icons-material';
import CustomTextField from '../forms/customFields/CustomTextField';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { Chat } from 'pages/Messages';

interface MessageInputProps {
	currentMessage: string;
	imageUpload: any;
	imagePreview: string;
	showPicker: boolean;
	isUploading: boolean;
	isBlockedUser: boolean;
	isBlockingUser: boolean;
	activeChat: any;
	user: any;
	isMobileSize: boolean;
	isRotatedMedium: boolean;
	isVerySmallScreen: boolean;
	isRotated: boolean;
	isLargeImgMessageOpen: boolean;
	uploadInfo: any;
	getRemainingImageUploads: () => number;
	getFormattedResetTime: () => string;
	onMessageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onEmojiSelect: (emoji: any) => void;
	onSendMessage: () => void;
	onTogglePicker: () => void;
	onResetImageUpload: () => void;
	onCloseLargeImageAlert: () => void;
	checkCanUploadImage: () => boolean;
	checkCanUploadAudio: () => boolean;
	hasLeftParticipants: (chat: Chat) => boolean;
}

const MessageInput = ({
	currentMessage,
	imageUpload,
	imagePreview,
	showPicker,
	isUploading,
	isBlockedUser,
	isBlockingUser,
	activeChat,
	user,
	isMobileSize,
	isRotatedMedium,
	isVerySmallScreen,
	isRotated,
	isLargeImgMessageOpen,
	uploadInfo,
	getRemainingImageUploads,
	getFormattedResetTime,
	onMessageChange,
	onImageChange,
	onEmojiSelect,
	onSendMessage,
	onTogglePicker,
	onResetImageUpload,
	onCloseLargeImageAlert,
	checkCanUploadImage,
	checkCanUploadAudio,
	hasLeftParticipants,
}: MessageInputProps) => {
	const vertical = 'top';
	const horizontal = 'center';

	return (
		<>
			{/* Upload limit info - only show for non-admin users */}
			{uploadInfo && user?.role !== 'admin' && getRemainingImageUploads() <= 5 && (
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						gap: 1,
						mb: 1,
						p: 1,
						borderRadius: 1,
						backgroundColor: getRemainingImageUploads() <= 5 ? 'success.light' : 'error.light',
						color: getRemainingImageUploads() <= 5 ? 'success.dark' : 'error.dark',
						position: 'absolute',
						top: '-3rem',
						left: '50%',
						transform: 'translateX(-50%)',
						zIndex: 10,
					}}>
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : undefined }}>
						{getRemainingImageUploads() <= 0 ? `Daily limit reached` : `${getRemainingImageUploads()} of 50 image uploads remaining today`}
						{getRemainingImageUploads() > 0 && ` • Resets ${getFormattedResetTime()}`}
					</Typography>
				</Box>
			)}

			<input
				type='file'
				accept='image/*'
				onChange={onImageChange}
				style={{ display: 'none' }}
				id='image-upload'
				disabled={
					isUploading ||
					isBlockedUser ||
					isBlockingUser ||
					!activeChat ||
					(user?.role !== 'admin' && (!checkCanUploadImage() || !checkCanUploadAudio())) ||
					hasLeftParticipants(activeChat)
				}
			/>
			<label htmlFor='image-upload'>
				<IconButton
					component='span'
					disabled={
						isUploading ||
						isBlockedUser ||
						isBlockingUser ||
						!activeChat ||
						(user?.role !== 'admin' && (!checkCanUploadImage() || !checkCanUploadAudio())) ||
						hasLeftParticipants(activeChat)
					}
					sx={{
						':hover': {
							backgroundColor: 'transparent',
						},
					}}>
					<Image fontSize={isMobileSize ? 'small' : 'medium'} />
				</IconButton>
			</label>

			<Box sx={{ width: '100%', mt: '0.5rem', position: 'relative' }}>
				<CustomTextField
					fullWidth
					placeholder={
						imageUpload
							? ''
							: isBlockedUser
								? 'Can not send message since you are blocked'
								: isBlockingUser
									? 'Can not send message to a blocked contact'
									: hasLeftParticipants(activeChat)
										? 'Can not send message to a user who has left the chat'
										: 'Type a message...'
					}
					multiline
					rows={isRotatedMedium ? 1 : 2}
					value={currentMessage}
					onChange={onMessageChange}
					InputProps={{
						sx: {
							padding: '0.5rem 1rem',
						},
						endAdornment: (
							<InputAdornment position='end'>
								<IconButton onClick={onTogglePicker} edge='end' disabled={isUploading || isBlockedUser || isBlockingUser || !activeChat}>
									<InsertEmoticon color={showPicker ? 'success' : 'disabled'} sx={{ fontSize: isMobileSize ? '0.95rem' : undefined }} />
								</IconButton>
							</InputAdornment>
						),
						inputProps: {
							maxLength: 1000,
						},
					}}
					sx={{ overflowY: 'auto' }}
					disabled={!!imageUpload || isBlockedUser || isBlockingUser || !activeChat || hasLeftParticipants(activeChat)}
				/>

				<Snackbar
					open={isLargeImgMessageOpen}
					autoHideDuration={3000}
					anchorOrigin={{ vertical, horizontal }}
					sx={{ mt: isMobileSize ? '3rem' : '5rem' }}
					onClose={onCloseLargeImageAlert}>
					<Alert
						severity='error'
						variant='filled'
						sx={{ width: isMobileSize ? '90%' : '100%', fontSize: isMobileSize ? '0.8rem' : undefined, textAlign: 'center' }}>
						Image size exceeds the limit of 1 MB
					</Alert>
				</Snackbar>

				{imagePreview && (
					<Box
						sx={{
							display: 'flex',
							position: 'absolute',
							bottom: '1rem',
							left: isRotatedMedium ? '0.5rem' : '1rem',
							maxHeight: isRotatedMedium ? '2rem' : isMobileSize ? '3.25rem' : '3.75rem',
						}}>
						<img
							src={imagePreview}
							alt='Preview'
							style={{ maxHeight: isRotatedMedium ? '2rem' : isMobileSize ? '3.25rem' : '3.75rem', objectFit: 'contain' }}
						/>
						<Tooltip title='Remove Preview' placement='right' arrow>
							<IconButton size='small' onClick={onResetImageUpload} sx={{ ':hover': { backgroundColor: 'transparent' } }}>
								<Cancel fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />
							</IconButton>
						</Tooltip>
					</Box>
				)}
			</Box>

			{showPicker && !(isUploading || isBlockedUser || isBlockingUser || !activeChat || hasLeftParticipants(activeChat)) && (
				<Box
					sx={{
						position: 'absolute',
						bottom: isVerySmallScreen ? '2.75rem' : isRotated ? '-2.75rem' : isRotatedMedium ? '-1rem' : '6rem',
						right: isVerySmallScreen ? '1rem' : isRotated ? '-0.5rem' : isRotatedMedium ? '1rem' : '6rem',
						zIndex: 10,
						transform: isVerySmallScreen ? 'scale(0.8)' : isRotated ? 'scale(0.55)' : isRotatedMedium ? 'scale(0.65)' : 'scale(1)',
					}}>
					<Picker data={data} onEmojiSelect={onEmojiSelect} theme='dark' />
				</Box>
			)}

			<IconButton
				onClick={onSendMessage}
				disabled={isUploading || isBlockedUser || isBlockingUser || !activeChat || hasLeftParticipants(activeChat)}
				sx={{
					':hover': {
						backgroundColor: 'transparent',
					},
				}}>
				<Send fontSize='small' />
			</IconButton>
		</>
	);
};

export default MessageInput;
