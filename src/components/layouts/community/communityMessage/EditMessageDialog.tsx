import { useContext, useState } from 'react';
import { CommunityMessage } from '../../../../interfaces/communityMessage';
import CustomDialog from '../../dialog/CustomDialog';
import { UserAuthContext } from '../../../../contexts/UserAuthContextProvider';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../../../firebase';
import { Box, IconButton, InputAdornment, Tooltip, Typography } from '@mui/material';
import CustomTextField from '../../../forms/customFields/CustomTextField';
import { HideImage, Image, InsertEmoticon, Mic, MicOff } from '@mui/icons-material';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import AudioRecorder from '../../../userCourses/AudioRecorder';
import CustomSubmitButton from '../../../forms/customButtons/CustomSubmitButton';
import HandleImageUploadURL from '../../../forms/uploadImageVideoDocument/HandleImageUploadURL';
import CustomDialogActions from '../../dialog/CustomDialogActions';
import axios from 'axios';
import ImageThumbnail from '../../../forms/uploadImageVideoDocument/ImageThumbnail';

interface EditMessageDialogProps {
	message: CommunityMessage;
	editMsgModalOpen: boolean;
	setEditMsgModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setMessages: React.Dispatch<React.SetStateAction<CommunityMessage[]>>;
	setIsMsgEdited: React.Dispatch<React.SetStateAction<boolean>>;
}

const EditMessageDialog = ({ message, editMsgModalOpen, setEditMsgModalOpen, setMessages, setIsMsgEdited }: EditMessageDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { user } = useContext(UserAuthContext);
	const [enterImageUrl, setEnterImageUrl] = useState(true);
	const [isAudioUploading, setIsAudioUploading] = useState(false);
	const [messageBeforeSave, setMessageBeforeSave] = useState(message);
	const [showAudioRecorder, setShowAudioRecorder] = useState(!!message.audioUrl);
	const [showImageUploader, setShowImageUploader] = useState(!!message.imageUrl);
	const [showPicker, setShowPicker] = useState(false);
	const [isMsgUpdated, setIsMsgUpdated] = useState(false);

	const updateMessages = (callback: any) => setMessages((prev) => prev.map((msg) => (msg._id === message._id ? callback(msg) : msg)));

	const uploadAudio = async (blob: Blob) => {
		setIsAudioUploading(true);
		try {
			const audioRef = ref(storage, `community-topic-message-audio-recordings/${user?.username}-${Date.now()}.webm`);
			const uploadTask = await uploadBytes(audioRef, blob);
			const downloadURL = await getDownloadURL(uploadTask.ref);
			updateMessages((msg: CommunityMessage) => ({ ...msg, audioUrl: downloadURL }));
			setIsMsgUpdated(true);
		} finally {
			setIsAudioUploading(false);
		}
	};

	const editMessage = async () => {
		if (isMsgUpdated) {
			const { data } = await axios.patch(`${base_url}/communityMessages/${message._id}`, {
				text: message.text,
				audioUrl: message.audioUrl,
				imageUrl: message.imageUrl,
			});
			setMessageBeforeSave(data);
			updateMessages((msg: CommunityMessage) => ({ ...msg, updatedAt: data.data.updatedAt }));
		}
		setEditMsgModalOpen(false);
		setIsMsgEdited(true);
		setIsMsgUpdated(false);
	};

	const handleEmojiSelect = (emoji: any) => {
		updateMessages((msg: CommunityMessage) => ({ ...msg, text: msg.text + emoji.native }));
		setShowPicker(false);
		setIsMsgUpdated(true);
	};

	const handleCancel = () => {
		updateMessages(() => messageBeforeSave);
		setEditMsgModalOpen(false);
		setIsMsgUpdated(false);
		setShowImageUploader(!!messageBeforeSave.imageUrl);
		setShowAudioRecorder(!!messageBeforeSave.audioUrl);
	};

	const toggleShow = (type: string) => {
		if (type === 'audio') setShowAudioRecorder((prev) => !prev);
		if (type === 'image') setShowImageUploader((prev) => !prev);
	};

	return (
		<CustomDialog openModal={editMsgModalOpen} closeModal={handleCancel} title='Edit Message'>
			<form
				style={{ display: 'flex', flexDirection: 'column', padding: '1rem 3rem' }}
				onSubmit={(e) => {
					e.preventDefault();
					editMessage();
				}}>
				<Box sx={{ marginBottom: '1rem', position: 'relative' }}>
					<CustomTextField
						label='Message'
						required
						multiline
						rows={3}
						resizable={true}
						value={message?.text}
						onChange={(e) => {
							updateMessages((msg: CommunityMessage) => ({ ...msg, text: e.target.value }));
							setIsMsgUpdated(true);
						}}
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
							<IconButton onClick={() => toggleShow('audio')}>
								{!showAudioRecorder ? <Mic fontSize='small' /> : <MicOff fontSize='small' />}
							</IconButton>
						</Tooltip>
						<Tooltip title={!showImageUploader ? 'Upload Image' : 'Hide Uploader'} placement='top'>
							<IconButton onClick={() => toggleShow('image')}>
								{!showImageUploader ? <Image fontSize='small' /> : <HideImage fontSize='small' />}
							</IconButton>
						</Tooltip>
					</Box>
				</Box>

				{showAudioRecorder && (
					<Box sx={{ marginBottom: '1rem' }}>
						<Typography variant='h6'>Audio Recording</Typography>
						{!message.audioUrl ? (
							<AudioRecorder uploadAudio={uploadAudio} isAudioUploading={isAudioUploading} maxRecordTime={45000} />
						) : (
							<Box sx={{ display: 'flex', alignItems: 'center', mb: '2rem' }}>
								<Box sx={{ flex: 9 }}>
									<audio
										src={message.audioUrl}
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
									<CustomSubmitButton
										sx={{ borderRadius: '0.35rem' }}
										onClick={() => {
											updateMessages((msg: CommunityMessage) => ({ ...msg, audioUrl: '' }));
											setIsMsgUpdated(true);
										}}>
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
							onImageUploadLogic={(url) => {
								updateMessages((msg: CommunityMessage) => ({ ...msg, imageUrl: url }));
								setIsMsgUpdated(true);
							}}
							onChangeImgUrl={(e) => {
								updateMessages((msg: CommunityMessage) => ({ ...msg, imageUrl: e.target.value }));
								setIsMsgUpdated(true);
							}}
							imageUrlValue={message?.imageUrl}
							imageFolderName='TopicImages'
							enterImageUrl={enterImageUrl}
							setEnterImageUrl={setEnterImageUrl}
						/>
						{message.imageUrl && (
							<ImageThumbnail
								imgSource={message.imageUrl}
								removeImage={() => {
									updateMessages((msg: CommunityMessage) => ({ ...msg, imageUrl: '' }));
									setIsMsgUpdated(true);
								}}
							/>
						)}
					</>
				)}

				<CustomDialogActions onCancel={handleCancel} submitBtnType='submit' submitBtnText='Update' actionSx={{ margin: '1.5rem -1rem 0 0' }} />
			</form>
		</CustomDialog>
	);
};

export default EditMessageDialog;
