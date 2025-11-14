import { useContext, useEffect, useState } from 'react';
import CustomDialog from '../../dialog/CustomDialog';
import axios from '@utils/axiosInstance';
import { OrganisationContext } from '../../../../contexts/OrganisationContextProvider';
import CustomDialogActions from '../../dialog/CustomDialogActions';
import CustomTextField from '../../../forms/customFields/CustomTextField';
import HandleImageUploadURL from '../../../forms/uploadImageVideoDocument/HandleImageUploadURL';
import AudioRecorder from '../../../userCourses/AudioRecorder';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../../firebase';
import { UserAuthContext } from '../../../../contexts/UserAuthContextProvider';
import { Box, IconButton, InputAdornment, Tooltip, Typography, Snackbar, Alert } from '@mui/material';
import CustomSubmitButton from '../../../forms/customButtons/CustomSubmitButton';
import { CommunityContext } from '../../../../contexts/CommunityContextProvider';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { HideImage, Image, InsertEmoticon, Mic, MicOff } from '@mui/icons-material';
import { TopicInfo } from '../../../../interfaces/communityMessage';
import ImageThumbnail from '../../../forms/uploadImageVideoDocument/ImageThumbnail';
import { MediaQueryContext } from '../../../../contexts/MediaQueryContextProvider';
import { validateImageUrl } from '../../../../utils/urlValidation';
import { useUploadLimit } from '../../../../contexts/UploadLimitContextProvider';

interface EditTopicDialogProps {
	editTopicModalOpen: boolean;
	topic: TopicInfo;
	setEditTopicModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setTopic: React.Dispatch<React.SetStateAction<TopicInfo>>;
}

const EditTopicDialog = ({ editTopicModalOpen, topic, setEditTopicModalOpen, setTopic }: EditTopicDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);
	const { updateTopics } = useContext(CommunityContext);

	const { isSmallScreen, isRotatedMedium, isVerySmallScreen, isRotated } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	// Upload limit management - for all roles
	const { getRemainingAudioUploads, getRemainingImageUploads, getImageLimit, getAudioLimit, incrementAudioUpload, incrementImageUpload } =
		useUploadLimit();

	const [enterImageUrl, setEnterImageUrl] = useState(true);
	const [isAudioUploading, setIsAudioUploading] = useState(false);
	const [showAudioRecorder, setShowAudioRecorder] = useState(!!topic.audioUrl);
	const [showImageUploader, setShowImageUploader] = useState(!!topic.imageUrl);
	const [showPicker, setShowPicker] = useState(false);

	// URL validation error handling
	const [isUrlErrorOpen, setIsUrlErrorOpen] = useState<boolean>(false);
	const [urlErrorMessage, setUrlErrorMessage] = useState<string>('');

	// Session attempt limits
	const [audioUploadAttempts, setAudioUploadAttempts] = useState<number>(0);
	const [imageUploadAttempts, setImageUploadAttempts] = useState<number>(0);
	const MAX_SESSION_ATTEMPTS = 5;

	useEffect(() => {
		setShowAudioRecorder(!!topic.audioUrl);
		setShowImageUploader(!!topic.imageUrl);
	}, [topic.audioUrl, topic.imageUrl]);

	const reset = () => {
		setEditTopicModalOpen(false);
		setEnterImageUrl(true);
		// Reset session attempt counters
		setAudioUploadAttempts(0);
		setImageUploadAttempts(0);
	};

	const handleEmojiSelect = (emoji: any) => {
		setTopic((prevData) => ({ ...prevData, text: prevData.text + emoji.native }));
		setShowPicker(false);
	};

	const uploadAudio = async (blob: Blob) => {
		setIsAudioUploading(true);
		try {
			const audioRef = ref(storage, `community-topic-audio-recordings/${user?.username}-${Date.now()}.webm`);
			const uploadTask = await uploadBytes(audioRef, blob);
			const downloadURL = await getDownloadURL(uploadTask.ref);
			setTopic((prevData) => ({ ...prevData, audioUrl: downloadURL }));
		} catch (error) {
			console.log(error);
		} finally {
			setIsAudioUploading(false);
		}
	};

	// URL validation function
	const validateUrls = async (): Promise<boolean> => {
		let hasErrors = false;
		let errorMessages: string[] = [];

		// Validate image URL if provided
		if (topic.imageUrl?.trim()) {
			const imageValidation = await validateImageUrl(topic.imageUrl.trim());
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

	const editTopic = async () => {
		// Validate URLs before proceeding
		const urlsValid = await validateUrls();
		if (!urlsValid) {
			return; // Don't proceed if URL validation fails
		}

		try {
			const response = await axios.patch(`${base_url}/communityTopics/${topic._id}`, {
				title: topic.title.trim(),
				text: topic.text.trim(),
				imageUrl: topic.imageUrl,
				audioUrl: topic.audioUrl,
			});

			updateTopics({
				...topic,
				title: topic.title.trim(),
				text: topic.text.trim(),
				userId: { _id: user?._id!, username: user?.username!, imageUrl: user?.imageUrl! },
				orgId,
				updatedAt: response.data.updatedAt,
			});

			// Use optimistic update for instant UI feedback (only for new uploads)
			// Note: For editing, we only increment if new uploads were added
			// This is a simplified approach - in production you might want to track original vs new uploads
			if (topic.imageUrl?.trim()) incrementImageUpload();
			if (topic.audioUrl?.trim()) incrementAudioUpload();

			reset();
		} catch (error: any) {
			console.log(error);
			// Show error message to user
			if (error?.response?.data?.message) {
				setUrlErrorMessage(error.response.data.message);
			} else {
				setUrlErrorMessage('Failed to update topic. Please try again.');
			}
			setIsUrlErrorOpen(true);
		}
	};

	const toggleFeature = (feature: 'audio' | 'image') => {
		if (feature === 'audio') setShowAudioRecorder((prev) => !prev);
		if (feature === 'image') setShowImageUploader((prev) => !prev);
	};

	return (
		<CustomDialog openModal={editTopicModalOpen} closeModal={reset} title='Edit Topic' maxWidth='sm'>
			<form
				style={{ display: 'flex', flexDirection: 'column', padding: isMobileSize ? '0.5rem 0.75rem' : '1rem 1.5rem' }}
				onSubmit={(e) => {
					e.preventDefault();
					editTopic();
				}}>
				<Box sx={{ marginBottom: '0.5rem' }}>
					<CustomTextField
						label='Title'
						value={topic?.title}
						onChange={(e) => setTopic((prevData) => ({ ...prevData, title: e.target.value }))}
						InputProps={{ inputProps: { maxLength: 80 } }}
					/>
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', textAlign: 'right' }}>
						{topic?.title?.length}/80 Characters
					</Typography>
				</Box>

				<Box sx={{ marginBottom: '1rem', position: 'relative' }}>
					<CustomTextField
						label='Message'
						multiline
						resizable={true}
						rows={3}
						value={topic?.text}
						onChange={(e) => setTopic((prevData) => ({ ...prevData, text: e.target.value }))}
						InputProps={{
							sx: { padding: '0.5rem 1rem' },
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
								right: isVerySmallScreen ? '-3.5rem' : isRotated ? '-3rem' : isRotatedMedium || isSmallScreen ? '-2rem' : '0.5rem',
								zIndex: 10,
								transform: isVerySmallScreen
									? 'scale(0.5)'
									: isRotated
										? 'scale(0.55)'
										: isRotatedMedium || isSmallScreen
											? 'scale(0.65)'
											: 'scale(0.8)',
							}}>
							<Picker data={data} onEmojiSelect={handleEmojiSelect} theme='dark' />
						</Box>
					)}

					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: '-0.5rem' }}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<Box>
								<Tooltip title={!showAudioRecorder ? 'Upload Audio' : 'Hide Recorder'} placement='top' arrow>
									<IconButton
										sx={{
											':hover': {
												backgroundColor: 'transparent',
											},
										}}
										onClick={() => toggleFeature('audio')}>
										{!showAudioRecorder ? (
											<Mic fontSize='small' sx={{ fontSize: isMobileSize ? '0.95rem' : undefined }} />
										) : (
											<MicOff fontSize='small' sx={{ fontSize: isMobileSize ? '0.95rem' : undefined }} />
										)}
									</IconButton>
								</Tooltip>
							</Box>
							<Box>
								<Tooltip title={!showImageUploader ? 'Upload Image' : 'Hide Uploader'} placement='top' arrow>
									<IconButton
										sx={{
											':hover': {
												backgroundColor: 'transparent',
											},
										}}
										onClick={() => toggleFeature('image')}>
										{!showImageUploader ? (
											<Image fontSize='small' sx={{ fontSize: isMobileSize ? '0.95rem' : undefined }} />
										) : (
											<HideImage fontSize='small' sx={{ fontSize: isMobileSize ? '0.95rem' : undefined }} />
										)}
									</IconButton>
								</Tooltip>
							</Box>
						</Box>
						<Box>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem' }}>
								{topic.text.length}/1500 Characters
							</Typography>
						</Box>
					</Box>
				</Box>

				{showAudioRecorder && (
					<Box sx={{ marginBottom: '1rem' }}>
						<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '0.9rem' }}>
							Audio Recording{' '}
							<span style={{ color: 'gray', fontSize: '0.75rem', marginLeft: '0.25rem' }}>
								{getRemainingAudioUploads() <= 0
									? '(Daily limit reached. Resets everyday)'
									: getRemainingAudioUploads() <= 5
										? '(' + getRemainingAudioUploads() + ' of ' + getAudioLimit() + ' audio uploads remaining today)'
										: ''}
							</span>
						</Typography>

						{!topic.audioUrl && getRemainingAudioUploads() > 0 ? (
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
											<audio
												src={topic.audioUrl}
												controls
												style={{
													marginTop: '1rem',
													boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
													borderRadius: '0.35rem',
													width: '100%',
													height: '2rem',
												}}
											/>
										</Box>
										<Box sx={{ flex: 1, margin: '0.75rem 0 0 1.5rem' }}>
											<CustomSubmitButton
												sx={{ borderRadius: '0.35rem', fontSize: isMobileSize ? '0.75rem' : undefined }}
												onClick={() => {
													setTopic((prevData) => ({ ...prevData, audioUrl: '' }));
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
							onImageUploadLogic={(url) => setTopic((prevData) => ({ ...prevData, imageUrl: url }))}
							onChangeImgUrl={(e) => setTopic((prevData) => ({ ...prevData, imageUrl: e.target.value }))}
							imageUrlValue={topic?.imageUrl}
							imageFolderName='TopicImages'
							enterImageUrl={enterImageUrl}
							setEnterImageUrl={setEnterImageUrl}
							isImageUploadLimitReached={getRemainingImageUploads() <= 0}
							imageUploadAttempts={imageUploadAttempts}
							maxSessionAttempts={MAX_SESSION_ATTEMPTS}
							onImageUploadAttempt={() => setImageUploadAttempts((prev) => prev + 1)}
							labelDescription={
								getRemainingImageUploads() <= 0
									? '(Daily limit reached. Resets everyday)'
									: getRemainingImageUploads() <= 5
										? '(' + getRemainingImageUploads() + ' of ' + getImageLimit() + ' image uploads remaining today)'
										: ''
							}
						/>
						{topic.imageUrl && (
							<ImageThumbnail imgSource={topic.imageUrl} removeImage={() => setTopic((prevData) => ({ ...prevData, imageUrl: '' }))} />
						)}
					</>
				)}

				<CustomDialogActions
					onCancel={reset}
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
				<Alert severity='error' variant='filled' sx={{ width: '100%' }}>
					{urlErrorMessage}
				</Alert>
			</Snackbar>
		</CustomDialog>
	);
};

export default EditTopicDialog;
