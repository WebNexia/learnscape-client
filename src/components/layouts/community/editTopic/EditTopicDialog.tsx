import { useContext, useEffect, useState } from 'react';
import CustomDialog from '../../dialog/CustomDialog';
import axios from 'axios';
import { OrganisationContext } from '../../../../contexts/OrganisationContextProvider';
import CustomDialogActions from '../../dialog/CustomDialogActions';
import CustomTextField from '../../../forms/customFields/CustomTextField';
import HandleImageUploadURL from '../../../forms/uploadImageVideoDocument/HandleImageUploadURL';
import AudioRecorder from '../../../userCourses/AudioRecorder';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../../firebase';
import { UserAuthContext } from '../../../../contexts/UserAuthContextProvider';
import { Box, IconButton, InputAdornment, Tooltip, Typography } from '@mui/material';
import CustomSubmitButton from '../../../forms/customButtons/CustomSubmitButton';
import { CommunityContext } from '../../../../contexts/CommunityContextProvider';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { HideImage, Image, InsertEmoticon, Mic, MicOff } from '@mui/icons-material';
import { TopicInfo } from '../../../../interfaces/communityMessage';
import ImageThumbnail from '../../../forms/uploadImageVideoDocument/ImageThumbnail';

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
	const { updateTopics, fetchTopics } = useContext(CommunityContext);

	const [enterImageUrl, setEnterImageUrl] = useState(true);
	const [isAudioUploading, setIsAudioUploading] = useState(false);
	const [showAudioRecorder, setShowAudioRecorder] = useState(!!topic.audioUrl);
	const [showImageUploader, setShowImageUploader] = useState(!!topic.imageUrl);
	const [showPicker, setShowPicker] = useState(false);

	useEffect(() => {
		setShowAudioRecorder(!!topic.audioUrl);
		setShowImageUploader(!!topic.imageUrl);
	}, [topic]);

	const reset = () => {
		setEditTopicModalOpen(false);
		setEnterImageUrl(true);
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

	const editTopic = async () => {
		try {
			const response = await axios.patch(`${base_url}/communityTopics/${topic._id}`, {
				title: topic.title,
				text: topic.text,
				imageUrl: topic.imageUrl,
				audioUrl: topic.audioUrl,
			});

			fetchTopics(1);

			updateTopics({
				...topic,
				userId: { _id: user?._id!, username: user?.username!, imageUrl: user?.imageUrl! },
				orgId,
				updatedAt: response.data.updatedAt,
			});

			reset();
		} catch (error) {
			console.log(error);
		}
	};

	const toggleFeature = (feature: 'audio' | 'image') => {
		if (feature === 'audio') setShowAudioRecorder((prev) => !prev);
		if (feature === 'image') setShowImageUploader((prev) => !prev);
	};

	return (
		<CustomDialog openModal={editTopicModalOpen} closeModal={reset} title='Edit Topic'>
			<form
				style={{ display: 'flex', flexDirection: 'column', padding: '1rem 3rem' }}
				onSubmit={(e) => {
					e.preventDefault();
					editTopic();
				}}>
				<Box sx={{ marginBottom: '0.5rem' }}>
					<Tooltip title='Max 85 Characters' placement='top'>
						<CustomTextField
							label='Title'
							value={topic?.title}
							onChange={(e) => setTopic((prevData) => ({ ...prevData, title: e.target.value }))}
							InputProps={{ inputProps: { maxLength: 85 } }}
						/>
					</Tooltip>
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
										<InsertEmoticon color={showPicker ? 'success' : 'disabled'} />
									</IconButton>
								</InputAdornment>
							),
						}}
					/>
					{showPicker && (
						<Box sx={{ position: 'absolute', bottom: '-17rem', right: '3rem', zIndex: 10 }}>
							<Picker data={data} onEmojiSelect={handleEmojiSelect} theme='dark' />
						</Box>
					)}

					<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
						<Tooltip title={!showAudioRecorder ? 'Upload Audio' : 'Hide Recorder'} placement='top'>
							<IconButton onClick={() => toggleFeature('audio')}>
								{!showAudioRecorder ? <Mic fontSize='small' /> : <MicOff fontSize='small' />}
							</IconButton>
						</Tooltip>

						<Tooltip title={!showImageUploader ? 'Upload Image' : 'Hide Uploader'} placement='top'>
							<IconButton onClick={() => toggleFeature('image')}>
								{!showImageUploader ? <Image fontSize='small' /> : <HideImage fontSize='small' />}
							</IconButton>
						</Tooltip>
					</Box>
				</Box>

				{showAudioRecorder && (
					<Box sx={{ marginBottom: '1rem' }}>
						<Typography variant='h6'>Audio Recording</Typography>

						{!topic.audioUrl ? (
							<AudioRecorder uploadAudio={uploadAudio} isAudioUploading={isAudioUploading} maxRecordTime={45000} />
						) : (
							<Box sx={{ display: 'flex', alignItems: 'center', mb: '2rem' }}>
								<Box sx={{ flex: 9 }}>
									<audio
										src={topic.audioUrl}
										controls
										style={{
											marginTop: '1rem',
											boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
											borderRadius: '0.35rem',
											width: '100%',
											height: '2.25rem',
										}}
									/>
								</Box>
								<Box sx={{ flex: 1, margin: '0.75rem 0 0 1.5rem' }}>
									<CustomSubmitButton sx={{ borderRadius: '0.35rem' }} onClick={() => setTopic((prevData) => ({ ...prevData, audioUrl: '' }))}>
										Remove
									</CustomSubmitButton>
								</Box>
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
						/>
						{topic.imageUrl && (
							<ImageThumbnail imgSource={topic.imageUrl} removeImage={() => setTopic((prevData) => ({ ...prevData, imageUrl: '' }))} />
						)}
					</>
				)}

				<CustomDialogActions onCancel={reset} submitBtnType='submit' submitBtnText='Update' actionSx={{ margin: '1.5rem -1rem 0 0' }} />
			</form>
		</CustomDialog>
	);
};

export default EditTopicDialog;
