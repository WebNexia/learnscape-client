import { useContext, useState } from 'react';
import { NewTopic } from '../../../../pages/Community';
import CustomDialog from '../../dialog/CustomDialog';
import axios from '@utils/axiosInstance';
import { OrganisationContext } from '../../../../contexts/OrganisationContextProvider';
import CustomDialogActions from '../../dialog/CustomDialogActions';
import CustomTextField from '../../../forms/customFields/CustomTextField';
import HandleImageUploadURL from '../../../forms/uploadImageVideoDocument/HandleImageUploadURL';
import AudioRecorder from '../../../userCourses/AudioRecorder';
import { CustomAudioPlayer } from '../../../audio';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../../firebase';
import { UserAuthContext } from '../../../../contexts/UserAuthContextProvider';
import { Box, IconButton, InputAdornment, Tooltip, Typography, Snackbar, Alert } from '@mui/material';
import CustomSubmitButton from '../../../forms/customButtons/CustomSubmitButton';
import { CommunityContext } from '../../../../contexts/CommunityContextProvider';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { HideImage, Image, InsertEmoticon, Mic, MicOff } from '@mui/icons-material';
import ImageThumbnail from '../../../forms/uploadImageVideoDocument/ImageThumbnail';
import { truncateText } from '../../../../utils/utilText';
import { serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { MediaQueryContext } from '../../../../contexts/MediaQueryContextProvider';
import { validateImageUrl } from '../../../../utils/urlValidation';
import { useUploadLimit } from '../../../../contexts/UploadLimitContextProvider';
import { useAuth } from '../../../../hooks/useAuth';

interface CreateTopicDialogProps {
	createTopicModalOpen: boolean;
	topic: NewTopic;
	setCreateTopicModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setTopic: React.Dispatch<React.SetStateAction<NewTopic>>;
}

const CreateTopicDialog = ({ createTopicModalOpen, topic, setCreateTopicModalOpen, setTopic }: CreateTopicDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);
	const { addNewTopic } = useContext(CommunityContext);

	const { isSmallScreen, isRotatedMedium, isVerySmallScreen, isRotated } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	// Upload limit management - for all roles
	const { getRemainingAudioUploads, getRemainingImageUploads, getImageLimit, getAudioLimit, incrementAudioUpload, incrementImageUpload } =
		useUploadLimit();

	const { hasAdminAccess } = useAuth();
	const [enterImageUrl, setEnterImageUrl] = useState<boolean>(hasAdminAccess ? true : false);
	const [isAudioUploading, setIsAudioUploading] = useState<boolean>(false);

	const [showAudioRecorder, setShowAudioRecorder] = useState<boolean>(false);
	const [showImageUploader, setShowImageUploader] = useState<boolean>(false);

	const [showPicker, setShowPicker] = useState<boolean>(false);

	// URL validation error handling
	const [isUrlErrorOpen, setIsUrlErrorOpen] = useState<boolean>(false);
	const [urlErrorMessage, setUrlErrorMessage] = useState<string>('');

	// Session attempt limits
	const [audioUploadAttempts, setAudioUploadAttempts] = useState<number>(0);
	const [imageUploadAttempts, setImageUploadAttempts] = useState<number>(0);
	const MAX_SESSION_ATTEMPTS = 5;

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

	const createTopic = async () => {
		// Validate URLs before proceeding
		const urlsValid = await validateUrls();
		if (!urlsValid) {
			return; // Don't proceed if URL validation fails
		}

		try {
			const response = await axios.post(`${base_url}/communityTopics`, {
				userId: user?._id,
				orgId,
				title: topic.title.trim(),
				text: topic.text.trim(),
				imageUrl: topic.imageUrl,
				audioUrl: topic.audioUrl,
			});

			// Fetch all admins and instructors for notifications (single optimized call)
			const adminInstructorResponse = await axios.get(`${base_url}/users/organisation/${orgId}/admin-instructor-users`);
			const allIds: string[] = adminInstructorResponse.data.data?.map((user: any) => user.firebaseUserId) || [];

			addNewTopic({
				_id: response.data._id,
				userId: { _id: user?._id || '', username: user?.username || '', imageUrl: user?.imageUrl || '' },
				orgId,
				title: topic.title.trim(),
				text: topic.text.trim(),
				imageUrl: topic.imageUrl,
				audioUrl: topic.audioUrl,
				createdAt: response.data.createdAt,
				updatedAt: response.data.updatedAt || response.data.createdAt,
				messageCount: 0,
			});

			// Use optimistic update for instant UI feedback
			if (topic.imageUrl?.trim()) incrementImageUpload();
			if (topic.audioUrl?.trim()) incrementAudioUpload();

			reset();

			// Send notifications AFTER topic is created (non-blocking)
			const notificationToUsersData = {
				title: 'Community Topic Created',
				message: `${user?.username} created a new topic: ${truncateText(topic.title, 25)}`,
				isRead: false,
				timestamp: serverTimestamp(),
				type: 'NewCommunityTopic',
				userImageUrl: user?.imageUrl,
				communityTopicId: response.data._id,
			};

			// Use batch operation with content-based deduplication (non-blocking)
			const batch = writeBatch(db);
			const usersAlreadyNotified = new Set<string>();

			for (const id of allIds) {
				if (id !== user?.firebaseUserId && !usersAlreadyNotified.has(id)) {
					const notificationDocRef = doc(db, 'notifications', id, 'userNotifications', `topic-created-${response.data._id}`);
					batch.set(notificationDocRef, notificationToUsersData, { merge: true });
					usersAlreadyNotified.add(id);
				}
			}

			// Non-blocking notification - topic creation success is not dependent on notification success
			batch.commit().catch((error) => {
				console.warn('Failed to send topic creation notifications:', error);
			});
		} catch (error: any) {
			console.log(error);
			// Show error message to user
			if (error?.response?.data?.message) {
				setUrlErrorMessage(error.response.data.message);
			} else {
				setUrlErrorMessage('Failed to create topic. Please try again.');
			}
			setIsUrlErrorOpen(true);
		}
	};

	const reset = () => {
		setCreateTopicModalOpen(false);
		setEnterImageUrl(true);
		setTopic({
			title: '',
			text: '',
			imageUrl: '',
			audioUrl: '',
		});
		setShowPicker(false);
		setShowAudioRecorder(false);
		setShowImageUploader(false);
		// Reset session attempt counters
		setAudioUploadAttempts(0);
		setImageUploadAttempts(0);
	};

	const handleEmojiSelect = (emoji: any) => {
		setTopic((prevData) => {
			return { ...prevData, text: prevData.text + emoji.native };
		});
		setShowPicker(false);
	};

	const uploadAudio = async (blob: Blob) => {
		setIsAudioUploading(true);
		try {
			const audioRef = ref(storage, `community-topic-audio-recordings/${user?.username}-${Date.now()}.webm`);
			await uploadBytes(audioRef, blob);
			const downloadURL = await getDownloadURL(audioRef);

			setTopic((prevData) => {
				if (prevData) {
					return { ...prevData, audioUrl: downloadURL };
				}
				return prevData;
			});
		} catch (error) {
			console.error(error);
		} finally {
			setIsAudioUploading(false);
		}
	};

	return (
		<CustomDialog openModal={createTopicModalOpen} closeModal={reset} title='Create New Topic' maxWidth='sm'>
			<form
				style={{ display: 'flex', flexDirection: 'column', padding: isMobileSize ? '0.5rem 0.75rem' : '1rem 1.5rem' }}
				onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
					e.preventDefault();
					createTopic();
				}}>
				<Box sx={{ marginBottom: '0.5rem' }}>
					<CustomTextField
						label='Title'
						value={topic?.title}
						onChange={(e) =>
							setTopic((prevData) => {
								return { ...prevData, title: e.target.value };
							})
						}
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
						rows={3}
						resizable={true}
						value={topic?.text}
						onChange={(e) =>
							setTopic((prevData) => {
								return { ...prevData, text: e.target.value };
							})
						}
						InputProps={{
							sx: {
								padding: '0.5rem 1rem',
							},
							endAdornment: (
								<InputAdornment position='end'>
									<IconButton
										onClick={() => setShowPicker(!showPicker)}
										edge='end'
										sx={{
											':hover': {
												backgroundColor: 'transparent',
											},
										}}>
										<InsertEmoticon color={showPicker ? 'success' : 'disabled'} sx={{ fontSize: isMobileSize ? '0.95rem' : undefined }} />
									</IconButton>
								</InputAdornment>
							),
							inputProps: {
								maxLength: 1500,
							},
						}}
					/>

					{showPicker && (
						<Box
							sx={{
								position: 'absolute',
								bottom: isVerySmallScreen ? '-7rem' : isRotated ? '-8rem' : isRotatedMedium || isSmallScreen ? '-9.5rem' : '-9.5rem',
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
										onClick={() => setShowAudioRecorder(!showAudioRecorder)}>
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
										onClick={() => setShowImageUploader(!showImageUploader)}>
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
								recorderTitle=''
								audioUploadAttempts={audioUploadAttempts}
								maxSessionAttempts={MAX_SESSION_ATTEMPTS}
								onAudioUploadAttempt={() => setAudioUploadAttempts((prev) => prev + 1)}
							/>
						) : (
							<Box sx={{ display: 'flex', alignItems: 'center', mb: '2rem' }}>
								{getRemainingAudioUploads() > 0 && (
									<>
										<Box sx={{ flex: 9 }}>
											<CustomAudioPlayer audioUrl={topic.audioUrl} title='Topic Audio' />
										</Box>
										<Box sx={{ flex: 1, margin: '0.75rem 0 0 1.5rem' }}>
											<CustomSubmitButton
												sx={{ borderRadius: '0.35rem', fontSize: isMobileSize ? '0.75rem' : undefined }}
												onClick={() => {
													setTopic((prevData) => {
														return { ...prevData, audioUrl: '' };
													});
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
							onImageUploadLogic={(url) =>
								setTopic((prevData) => {
									if (prevData) {
										return { ...prevData, imageUrl: url };
									}
									return prevData;
								})
							}
							onChangeImgUrl={(e) =>
								setTopic((prevData) => {
									return { ...prevData, imageUrl: e.target.value };
								})
							}
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
							<ImageThumbnail
								imgSource={topic.imageUrl}
								removeImage={() => {
									setTopic((prevData) => {
										return { ...prevData, imageUrl: '' };
									});
								}}
							/>
						)}
					</>
				)}
				<CustomDialogActions
					onCancel={reset}
					submitBtnType='submit'
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

export default CreateTopicDialog;
