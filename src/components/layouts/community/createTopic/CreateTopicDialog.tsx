import { useContext, useState } from 'react';
import { NewTopic } from '../../../../pages/Community';
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
import ImageThumbnail from '../../../forms/uploadImageVideoDocument/ImageThumbnail';

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

	const [enterImageUrl, setEnterImageUrl] = useState<boolean>(true);
	const [isAudioUploading, setIsAudioUploading] = useState<boolean>(false);

	const [showAudioRecorder, setShowAudioRecorder] = useState<boolean>(false);
	const [showImageUploader, setShowImageUploader] = useState<boolean>(false);

	const [showPicker, setShowPicker] = useState<boolean>(false);

	const createTopic = async () => {
		try {
			const response = await axios.post(`${base_url}/communityTopics`, {
				userId: user?._id,
				orgId,
				title: topic.title,
				text: topic.text,
				imageUrl: topic.imageUrl,
				audioUrl: topic.audioUrl,
			});

			addNewTopic({
				_id: response.data._id,
				userId: { _id: user?._id, username: user?.username, imageUrl: user?.imageUrl },
				orgId,
				title: topic.title,
				text: topic.text,
				imageUrl: topic.imageUrl,
				audioUrl: topic.audioUrl,
				createdAt: response.data.createdAt,
				messageCount: 0,
			});

			reset();
		} catch (error) {
			console.log(error);
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
		<CustomDialog openModal={createTopicModalOpen} closeModal={reset} title='Create New Topic'>
			<form
				style={{ display: 'flex', flexDirection: 'column', padding: '1rem 3rem' }}
				onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
					e.preventDefault();
					createTopic();
				}}>
				<Box sx={{ marginBottom: '0.5rem' }}>
					<Tooltip title='Max 80 Characters' placement='top'>
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
					</Tooltip>
				</Box>
				<Box sx={{ marginBottom: '1rem', position: 'relative' }}>
					<CustomTextField
						label='Message'
						multiline
						rows={3}
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
						<Box>
							<Tooltip title={!showAudioRecorder ? 'Upload Audio' : 'Hide Recorder'} placement='top'>
								<IconButton
									sx={{
										':hover': {
											backgroundColor: 'transparent',
										},
									}}
									onClick={() => setShowAudioRecorder(!showAudioRecorder)}>
									{!showAudioRecorder ? <Mic fontSize='small' /> : <MicOff fontSize='small' />}
								</IconButton>
							</Tooltip>
						</Box>
						<Box>
							<Tooltip title={!showImageUploader ? 'Upload Image' : 'Hide Uploader'} placement='top'>
								<IconButton
									sx={{
										':hover': {
											backgroundColor: 'transparent',
										},
									}}
									onClick={() => setShowImageUploader(!showImageUploader)}>
									{!showImageUploader ? <Image fontSize='small' /> : <HideImage fontSize='small' />}
								</IconButton>
							</Tooltip>
						</Box>
					</Box>
				</Box>

				{showAudioRecorder && (
					<Box sx={{ marginBottom: '1rem' }}>
						<Typography variant='h6'>Audio Recording</Typography>

						{!topic.audioUrl ? (
							<AudioRecorder
								uploadAudio={uploadAudio}
								isAudioUploading={isAudioUploading}
								maxRecordTime={45000}
								fromCreateCommunityTopic={true}
								recorderTitle=''
							/>
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
									<CustomSubmitButton
										sx={{ borderRadius: '0.35rem' }}
										onClick={() => {
											setTopic((prevData) => {
												return { ...prevData, audioUrl: '' };
											});
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
				<CustomDialogActions onCancel={reset} submitBtnType='submit' actionSx={{ margin: '1.5rem -1rem 0 0' }} />
			</form>
		</CustomDialog>
	);
};

export default CreateTopicDialog;
