import { useContext, useState, useEffect } from 'react';
import { CommunityMessage } from '../../../../interfaces/communityMessage';
import CustomDialog from '../../dialog/CustomDialog';
import axios from '@utils/axiosInstance';
import CustomDialogActions from '../../dialog/CustomDialogActions';
import CustomTextField from '../../../forms/customFields/CustomTextField';
import HandleImageUploadURL from '../../../forms/uploadImageVideoDocument/HandleImageUploadURL';
import AudioRecorder from '../../../userCourses/AudioRecorder';
import { CustomAudioPlayer } from '../../../audio';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../../firebase';
import { UserAuthContext } from '../../../../contexts/UserAuthContextProvider';
import { Box, IconButton, InputAdornment, Tooltip, Typography, Snackbar, Alert } from '@mui/material';
import CustomSubmitButton from '../../../forms/customButtons/CustomSubmitButton';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { HideImage, Image, InsertEmoticon, Mic, MicOff } from '@mui/icons-material';
import ImageThumbnail from '../../../forms/uploadImageVideoDocument/ImageThumbnail';
import { MediaQueryContext } from '../../../../contexts/MediaQueryContextProvider';
import { CommunityMessagesContext } from '../../../../contexts/CommunityMessagesContextProvider';
import { validateImageUrl } from '../../../../utils/urlValidation';
import { useUploadLimit } from '../../../../contexts/UploadLimitContextProvider';

interface EditMessageDialogProps {
	message: CommunityMessage;
	editMsgModalOpen: boolean;
	setEditMsgModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setIsMsgEdited: React.Dispatch<React.SetStateAction<boolean>>;
}

const EditMessageDialog = ({ message, editMsgModalOpen, setEditMsgModalOpen, setIsMsgEdited }: EditMessageDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { user } = useContext(UserAuthContext);

	const { isSmallScreen, isRotatedMedium, isVerySmallScreen, isRotated } = useContext(MediaQueryContext);
	const { updateMessage } = useContext(CommunityMessagesContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	// Upload limit management - for all roles
	const { getRemainingAudioUploads, getRemainingImageUploads, getImageLimit, getAudioLimit, incrementAudioUpload, incrementImageUpload } =
		useUploadLimit();

	const [enterImageUrl, setEnterImageUrl] = useState(true);
	const [isAudioUploading, setIsAudioUploading] = useState(false);
	const [messageBeforeSave, setMessageBeforeSave] = useState(message);
	const [showAudioRecorder, setShowAudioRecorder] = useState(!!message.audioUrl);
	const [showImageUploader, setShowImageUploader] = useState(!!message.imageUrl);
	const [showPicker, setShowPicker] = useState(false);
	const [isMsgUpdated, setIsMsgUpdated] = useState(false);

	// Local state for editing the message
	const [editingMessage, setEditingMessage] = useState(message);

	// Sync local state when message prop changes
	useEffect(() => {
		setEditingMessage(message);
		setMessageBeforeSave(message);
	}, [message]);

	// URL validation error handling
	const [isUrlErrorOpen, setIsUrlErrorOpen] = useState<boolean>(false);
	const [urlErrorMessage, setUrlErrorMessage] = useState<string>('');

	// Session attempt limits
	const [audioUploadAttempts, setAudioUploadAttempts] = useState<number>(0);
	const [imageUploadAttempts, setImageUploadAttempts] = useState<number>(0);
	const MAX_SESSION_ATTEMPTS = 5;

	const uploadAudio = async (blob: Blob) => {
		setIsAudioUploading(true);
		try {
			const audioRef = ref(storage, `community-topic-message-audio-recordings/${user?.username}-${Date.now()}.webm`);
			const uploadTask = await uploadBytes(audioRef, blob);
			const downloadURL = await getDownloadURL(uploadTask.ref);
			setEditingMessage((prev) => ({ ...prev, audioUrl: downloadURL }));
			setIsMsgUpdated(true);
		} finally {
			setIsAudioUploading(false);
		}
	};

	// URL validation function
	const validateUrls = async (): Promise<boolean> => {
		let hasErrors = false;
		let errorMessages: string[] = [];

		// Validate image URL if provided
		if (editingMessage.imageUrl?.trim()) {
			const imageValidation = await validateImageUrl(editingMessage.imageUrl.trim());
			if (!imageValidation.isValid) {
				errorMessages.push(`Image URL: ${imageValidation.error}`);
				hasErrors = true;
			}
		}

		// Show error Snackbar if there are validation errors
		if (hasErrors) {
			setUrlErrorMessage(errorMessages.join('\n'));
			setIsUrlErrorOpen(true);
		}

		return !hasErrors;
	};

	const editMessage = async () => {
		// Check if there are any changes to save
		if (!isMsgUpdated) {
			setEditMsgModalOpen(false);
			return;
		}

		// Validate URLs before proceeding
		const urlsValid = await validateUrls();
		if (!urlsValid) {
			return; // Don't proceed if URL validation fails
		}

		try {
			const { data } = await axios.patch(`${base_url}/communityMessages/${message._id}`, {
				text: editingMessage.text.trim(),
				audioUrl: editingMessage.audioUrl.trim(),
				imageUrl: editingMessage.imageUrl.trim(),
			});
			setMessageBeforeSave(data);
			// Update the context with the changes
			updateMessage(
				message._id,
				{
					text: editingMessage.text.trim(),
					audioUrl: editingMessage.audioUrl.trim(),
					imageUrl: editingMessage.imageUrl.trim(),
					updatedAt: data.data.updatedAt,
				},
				message.topicId
			);

			// Use optimistic update for instant UI feedback (only for new uploads)
			// Note: For editing, we only increment if new uploads were added
			if (editingMessage.imageUrl?.trim()) incrementImageUpload();
			if (editingMessage.audioUrl?.trim()) incrementAudioUpload();

			setEditMsgModalOpen(false);
			setIsMsgEdited(true);
		} catch (error: any) {
			console.log(error);
			// Show error message to user
			if (error?.response?.data?.message) {
				setUrlErrorMessage(error.response.data.message);
			} else {
				setUrlErrorMessage('Failed to update message. Please try again.');
			}
			setIsUrlErrorOpen(true);
		} finally {
			setIsMsgUpdated(false);
		}
	};

	const handleEmojiSelect = (emoji: any) => {
		setEditingMessage((prev) => ({ ...prev, text: prev.text + emoji.native }));
		setShowPicker(false);
		setIsMsgUpdated(true);
	};

	const handleCancel = () => {
		setEditingMessage(messageBeforeSave);
		setEditMsgModalOpen(false);
		setIsMsgUpdated(false);
		setShowImageUploader(!!messageBeforeSave.imageUrl);
		setShowAudioRecorder(!!messageBeforeSave.audioUrl);
		setShowPicker(false);
		// Reset session attempt counters
		setAudioUploadAttempts(0);
		setImageUploadAttempts(0);
	};

	const toggleShow = (type: string) => {
		if (type === 'audio') setShowAudioRecorder((prev) => !prev);
		if (type === 'image') setShowImageUploader((prev) => !prev);
	};

	return (
		<CustomDialog openModal={editMsgModalOpen} closeModal={handleCancel} title='Edit Message' maxWidth='sm'>
			<form
				style={{ display: 'flex', flexDirection: 'column', padding: isMobileSize ? '0.5rem 0.75rem' : '1rem 1.5rem' }}
				onSubmit={(e) => {
					e.preventDefault();
					editMessage();
				}}>
				<Box sx={{ marginBottom: '0.75rem', position: 'relative' }}>
					<CustomTextField
						label='Message'
						required
						multiline
						rows={3}
						resizable={true}
						value={editingMessage?.text}
						onChange={(e) => {
							setEditingMessage((prev) => ({ ...prev, text: e.target.value }));
							setIsMsgUpdated(true);
						}}
						InputProps={{
							sx: { padding: '0.5rem 1rem' },
							inputProps: { maxLength: 1500 },
							endAdornment: (
								<InputAdornment position='end'>
									<IconButton onClick={() => setShowPicker(!showPicker)} edge='end'>
										<InsertEmoticon color={showPicker ? 'success' : 'disabled'} sx={{ fontSize: isMobileSize ? '0.95rem' : undefined }} />
									</IconButton>
								</InputAdornment>
							),
						}}
					/>
					{showPicker && (
						<Box
							sx={{
								position: 'absolute',
								bottom: isVerySmallScreen ? '-7rem' : isRotated ? '-8rem' : isRotatedMedium || isSmallScreen ? '-9.5rem' : '-10rem',
								right: isVerySmallScreen ? '-3.5rem' : isRotated ? '-3rem' : isRotatedMedium || isSmallScreen ? '-2rem' : '-0.5rem',
								zIndex: 10,
								transform: isVerySmallScreen
									? 'scale(0.5)'
									: isRotated
										? 'scale(0.55)'
										: isRotatedMedium || isSmallScreen
											? 'scale(0.65)'
											: 'scale(0.7)',
							}}>
							<Picker data={data} onEmojiSelect={handleEmojiSelect} theme='dark' />
						</Box>
					)}
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: '-0.5rem' }}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<Tooltip title={!showAudioRecorder ? 'Upload Audio' : 'Hide Recorder'} placement='top' arrow>
								<IconButton onClick={() => toggleShow('audio')}>
									{!showAudioRecorder ? (
										<Mic fontSize='small' sx={{ fontSize: isMobileSize ? '0.95rem' : undefined }} />
									) : (
										<MicOff fontSize='small' sx={{ fontSize: isMobileSize ? '0.95rem' : undefined }} />
									)}
								</IconButton>
							</Tooltip>
							<Tooltip title={!showImageUploader ? 'Upload Image' : 'Hide Uploader'} placement='top' arrow>
								<IconButton onClick={() => toggleShow('image')}>
									{!showImageUploader ? (
										<Image fontSize='small' sx={{ fontSize: isMobileSize ? '0.95rem' : undefined }} />
									) : (
										<HideImage fontSize='small' sx={{ fontSize: isMobileSize ? '0.95rem' : undefined }} />
									)}
								</IconButton>
							</Tooltip>
						</Box>
						<Box>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem' }}>
								{editingMessage.text.length}/1500 Characters
							</Typography>
						</Box>
					</Box>
				</Box>

				{showAudioRecorder && (
					<Box sx={{ marginBottom: '1rem' }}>
						<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '0.9rem' }}>
							Audio Recording{' '}
							<span style={{ color: 'gray', fontSize: '0.75rem', marginLeft: '0.25rem' }}>
								{getRemainingAudioUploads() <= 5
									? '(' + getRemainingAudioUploads() + ' of ' + getAudioLimit() + ' audio uploads remaining today)'
									: ''}
							</span>
						</Typography>

						{!editingMessage.audioUrl && getRemainingAudioUploads() > 0 ? (
							<AudioRecorder
								uploadAudio={uploadAudio}
								isAudioUploading={isAudioUploading}
								maxRecordTime={60000}
								fromCreateCommunityTopic={true}
								audioUploadAttempts={audioUploadAttempts}
								maxSessionAttempts={MAX_SESSION_ATTEMPTS}
								onAudioUploadAttempt={() => setAudioUploadAttempts((prev) => prev + 1)}
							/>
						) : (
							<Box sx={{ display: 'flex', alignItems: 'center', mb: '2rem' }}>
								{getRemainingAudioUploads() > 0 && (
									<>
										<Box sx={{ flex: 9 }}>
											<CustomAudioPlayer audioUrl={editingMessage.audioUrl} title='Audio' />
										</Box>
										<Box sx={{ flex: 1, margin: '0.75rem 0 0 1.5rem' }}>
											<CustomSubmitButton
												sx={{ borderRadius: '0.35rem', fontSize: isMobileSize ? '0.75rem' : undefined }}
												onClick={() => {
													setEditingMessage((prev) => ({ ...prev, audioUrl: '' }));
													setIsMsgUpdated(true);
												}}>
												Remove
											</CustomSubmitButton>
										</Box>
									</>
								)}
							</Box>
						)}
					</Box>
				)}

				{showImageUploader && (
					<>
						<HandleImageUploadURL
							labelDescription={
								getRemainingImageUploads() <= 0
									? '(Daily limit reached. Resets everyday)'
									: getRemainingImageUploads() <= 5
										? '(' + getRemainingImageUploads() + ' of ' + getImageLimit() + ' image uploads remaining today)'
										: ''
							}
							onImageUploadLogic={(url) => {
								setEditingMessage((prev) => ({ ...prev, imageUrl: url }));
								setIsMsgUpdated(true);
							}}
							onChangeImgUrl={(e) => {
								setEditingMessage((prev) => ({ ...prev, imageUrl: e.target.value }));
								setIsMsgUpdated(true);
							}}
							imageUrlValue={editingMessage?.imageUrl}
							imageFolderName='TopicMessageImages'
							enterImageUrl={enterImageUrl}
							setEnterImageUrl={setEnterImageUrl}
							isImageUploadLimitReached={getRemainingImageUploads() <= 0}
							imageUploadAttempts={imageUploadAttempts}
							maxSessionAttempts={MAX_SESSION_ATTEMPTS}
							onImageUploadAttempt={() => setImageUploadAttempts((prev) => prev + 1)}
						/>
						{editingMessage.imageUrl && (
							<ImageThumbnail
								imgSource={editingMessage.imageUrl}
								removeImage={() => {
									setEditingMessage((prev) => ({ ...prev, imageUrl: '' }));
									setIsMsgUpdated(true);
								}}
							/>
						)}
					</>
				)}

				<CustomDialogActions
					onCancel={handleCancel}
					submitBtnType='submit'
					submitBtnText='Save'
					actionSx={{ margin: isMobileSize ? '0.5rem 0rem 0 0' : '1.5rem -1rem 0 0' }}
					submitBtnSx={{ padding: isMobileSize ? '0.1rem 0.25rem' : undefined, marginRight: isMobileSize ? '-0.5rem' : undefined }}
					cancelBtnSx={{ padding: isMobileSize ? '0.1rem 0.25rem' : undefined }}
				/>
			</form>
			<Snackbar
				open={isUrlErrorOpen}
				autoHideDuration={3500}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				onClose={() => setIsUrlErrorOpen(false)}>
				<Alert severity='error' variant='filled' sx={{ width: isMobileSize ? '60%' : '100%', fontSize: isMobileSize ? '0.75rem' : undefined }}>
					{urlErrorMessage}
				</Alert>
			</Snackbar>
		</CustomDialog>
	);
};

export default EditMessageDialog;
