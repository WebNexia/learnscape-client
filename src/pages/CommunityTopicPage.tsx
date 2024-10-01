import { Alert, Box, DialogContent, IconButton, InputAdornment, Snackbar, Tooltip, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import TopicPaper from '../components/layouts/community/topicPage/TopicPaper';
import { useContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CommunityMessage, TopicInfo } from '../interfaces/communityMessage';
import Message from '../components/layouts/community/communityMessage/Message';
import theme from '../themes';
import { renderMessageWithEmojis } from '../utils/renderMessageWithEmojis';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { Image, InsertEmoticon, Mic, Send } from '@mui/icons-material';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import HandleImageUploadURL from '../components/forms/uploadImageVideoDocument/HandleImageUploadURL';
import ImageThumbnail from '../components/forms/uploadImageVideoDocument/ImageThumbnail';
import AudioRecorder from '../components/userCourses/AudioRecorder';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import { CommunityContext } from '../contexts/CommunityContextProvider';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';

const CommunityTopicPage = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { topicId } = useParams();
	const { user } = useContext(UserAuthContext);
	const { orgId } = useContext(OrganisationContext);
	const { fetchTopics } = useContext(CommunityContext);

	const [messages, setMessages] = useState<CommunityMessage[]>([]);

	const [currentMessage, setCurrentMessage] = useState<string>('');

	const [topic, setTopic] = useState<TopicInfo>({
		_id: '',
		userId: { _id: '', username: '', imageUrl: '' },
		createdAt: '',
		updatedAt: '',
		title: '',
		text: '',
		imageUrl: '',
		audioUrl: '',
		isReported: false,
	});

	const vertical = 'top';
	const horizontal = 'center';

	const [displayDeleteTopicMsg, setDisplayDeleteTopicMsg] = useState<boolean>(false);
	const [showPicker, setShowPicker] = useState<boolean>(false);
	const [uploadImgDialogOpen, setUploadImgDialogOpen] = useState<boolean>(false);
	const [imgUrl, setImgUrl] = useState<string>('');

	const [uploadAudioDialogOpen, setUploadAudioDialogOpen] = useState<boolean>(false);
	const [audioUrl, setAudioUrl] = useState<string>('');

	const [parentMessageId, setParentMessageId] = useState<string>('');

	const [enterImageUrl, setEnterImageUrl] = useState<boolean>(true);
	const [isAudioUploading, setIsAudioUploading] = useState<boolean>(false);

	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [pageNumber, setPageNumber] = useState<number>(1);

	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		if (topicId) {
			const fetchTopicMessages = async () => {
				try {
					const messagesResponse = await axios.get(`${base_url}/communityMessages/topic/${topicId}?page=${pageNumber}&limit=25`);

					console.log(messagesResponse.data.messages);

					console.log(messagesResponse.data.totalPages);

					setMessages(messagesResponse.data.messages);
					setTopic(messagesResponse.data.topic);
					setNumberOfPages(messagesResponse.data.totalPages);
				} catch (error) {
					console.log(error);
				}
			};

			fetchTopicMessages();
		}
	}, [pageNumber]);

	useEffect(() => {
		scrollToBottom();
		fetchTopics(1);
	}, [messages]);

	const handleEmojiSelect = (emoji: any) => {
		setCurrentMessage((prevMessage) => prevMessage + emoji.native);
		setShowPicker(false);
	};

	const sendMessage = async () => {
		try {
			const response = await axios.post(`${base_url}/communityMessages`, {
				userId: user?._id,
				orgId,
				topicId: topic._id,
				parentMessageId,
				text: currentMessage,
				imageUrl: imgUrl,
				audioUrl,
			});

			setMessages((prevData) => {
				return [...prevData, response.data];
			});
			setCurrentMessage('');
			setImgUrl('');
			setAudioUrl('');
			setParentMessageId('');
		} catch (error) {
			console.log(error);
			console.log({
				userId: user?._id,
				orgId,
				topicId: topic._id,
				parentMessageId,
				text: currentMessage,
				imageUrl: imgUrl,
				audioUrl,
			});
		}
	};

	const uploadAudio = async (blob: Blob) => {
		setIsAudioUploading(true);
		try {
			const audioRef = ref(storage, `community-topic-message-audio-recordings/${user?.username}-${Date.now()}.webm`);
			await uploadBytes(audioRef, blob);
			const downloadURL = await getDownloadURL(audioRef);

			setAudioUrl(downloadURL);
		} catch (error) {
			console.error(error);
		} finally {
			setIsAudioUploading(false);
		}
	};

	return (
		<DashboardPagesLayout pageName='Community' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ width: '80%', position: 'fixed', top: '4rem', zIndex: 1000, backgroundColor: theme.bgColor?.secondary }}>
				<TopicPaper topic={topic} messages={messages} setDisplayDeleteTopicMsg={setDisplayDeleteTopicMsg} setTopic={setTopic} />
			</Box>
			<Snackbar
				open={displayDeleteTopicMsg}
				autoHideDuration={7000}
				onClose={() => setDisplayDeleteTopicMsg(false)}
				anchorOrigin={{ vertical, horizontal }}>
				<Alert onClose={() => setDisplayDeleteTopicMsg(false)} severity='success' sx={{ width: '100%' }}>
					You have successfully deleted the topic!
				</Alert>
			</Snackbar>
			<Box
				sx={{
					display: 'flex',

					width: '87%',
					minHeight: '5rem',
					border: 'solid lightgray 0.1rem',
					marginTop: '9rem',
					borderRadius: '0.35rem',
					boxShadow: '0rem 0.2rem 0.5rem 0.1rem rgba(0,0,0,0.2)',
				}}>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'flex-start',
						alignItems: 'center',
						flex: 1,
						padding: '0.5rem',
						borderRight: 'solid lightgray 0.1rem',
					}}>
					<Box>
						<img src={topic?.userId.imageUrl} alt='profile' style={{ height: '4rem', width: '4rem', borderRadius: '50%' }} />
					</Box>
					<Box>
						<Typography variant='body2'>{topic?.userId.username}</Typography>
					</Box>
				</Box>
				<Box sx={{ flex: 8, padding: '1rem' }}>
					<Box>
						<Typography variant='body2' sx={{ lineHeight: 1.7, mb: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
							{renderMessageWithEmojis(topic?.text, '1.5rem')}
						</Typography>
					</Box>
					{topic?.imageUrl && (
						<Box>
							<img src={topic.imageUrl} alt='img' style={{ maxHeight: '15rem', objectFit: 'contain', borderRadius: '0.15rem' }} />
						</Box>
					)}
					{topic?.audioUrl && (
						<Box>
							<audio
								src={topic.audioUrl}
								controls
								style={{
									margin: '1rem 0',
									boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
									borderRadius: '0.35rem',
									width: '50%',
								}}
							/>
						</Box>
					)}
				</Box>
			</Box>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'flex-end',
					width: '87%',
					margin: '1.5rem 0 5rem 0',
					paddingBottom: '5rem',
				}}>
				{messages?.map((message: CommunityMessage, index) => (
					<Message key={message?._id} message={message} isFirst={index === 0} isLast={index === messages.length - 1} setMessages={setMessages} />
				))}
				<div ref={messagesEndRef} />
				<Box sx={{ display: 'flex', justifyContent: 'center', mt: '1.5rem', width: '95%' }}>
					<CustomTablePagination count={numberOfPages} page={pageNumber} onChange={setPageNumber} />
				</Box>
			</Box>

			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					width: '100%',
					position: 'fixed',
					bottom: '0',
					backgroundColor: theme.bgColor?.secondary,
					paddingTop: '1rem',
				}}>
				<CustomTextField
					multiline
					rows={3}
					value={currentMessage}
					onChange={(e) => {
						setCurrentMessage(e.target.value);
					}}
					sx={{ width: '78%' }}
					InputProps={{
						sx: {
							fontSize: '0.8rem',
							padding: '0.5rem 1rem',
							'& .MuiOutlinedInput-root': {
								'& fieldset': {
									borderColor: 'lightgray', // Set the default border color
								},
								'&:hover fieldset': {
									borderColor: 'lightgray', // Keep the border color same when hovered
								},
								'&.Mui-focused fieldset': {
									borderColor: 'lightgray !important', // Keep the border color same when focused
								},
							},
						},
						endAdornment: (
							<InputAdornment position='end'>
								<IconButton
									onClick={() => setShowPicker(!showPicker)}
									edge='end'
									sx={{
										mr: '-0.25rem',
										':hover': {
											backgroundColor: 'transparent',
										},
									}}>
									<InsertEmoticon color={showPicker ? 'success' : 'disabled'} fontSize='small' />
								</IconButton>

								<Tooltip title={audioUrl ? 'Update Audio' : 'Upload Audio'} placement='top'>
									<IconButton
										onClick={() => setUploadAudioDialogOpen(true)}
										sx={{
											':hover': {
												backgroundColor: 'transparent',
											},
										}}>
										<Mic fontSize='small' color={audioUrl ? 'success' : 'inherit'} />
									</IconButton>
								</Tooltip>
								<CustomDialog openModal={uploadAudioDialogOpen} closeModal={() => setUploadAudioDialogOpen(false)}>
									<DialogContent>
										<Typography variant='body2' sx={{ mb: '3rem', textAlign: 'center', color: 'gray' }}>
											You can add a single audio recording per message and it will be displayed at the bottom the message
										</Typography>
										{!audioUrl ? (
											<AudioRecorder
												uploadAudio={uploadAudio}
												isAudioUploading={isAudioUploading}
												maxRecordTime={45000}
												fromCreateCommunityTopic={true}
											/>
										) : (
											<Box sx={{ display: 'flex', alignItems: 'center', mb: '2rem' }}>
												<Box sx={{ flex: 9 }}>
													<audio
														src={audioUrl}
														controls
														style={{
															marginTop: '1rem',
															boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
															borderRadius: '0.35rem',
															width: '100%',
														}}
													/>
												</Box>
												<Box sx={{ flex: 1, margin: '0.75rem 0 0 1.5rem' }}>
													<CustomSubmitButton
														sx={{ borderRadius: '0.35rem' }}
														onClick={() => {
															setAudioUrl('');
														}}>
														Remove
													</CustomSubmitButton>
												</Box>
											</Box>
										)}
									</DialogContent>
									<CustomCancelButton
										onClick={() => {
											setUploadAudioDialogOpen(false);
										}}
										sx={{ margin: '0 1.5rem 1.5rem 0', width: '8%', alignSelf: 'flex-end' }}>
										Close
									</CustomCancelButton>
								</CustomDialog>

								<Tooltip title={imgUrl ? 'Update Image' : 'Upload Image'} placement='top'>
									<IconButton
										onClick={() => setUploadImgDialogOpen(true)}
										sx={{
											':hover': {
												backgroundColor: 'transparent',
											},
										}}>
										<Image fontSize='small' color={imgUrl ? 'success' : 'inherit'} />
									</IconButton>
								</Tooltip>
								<CustomDialog openModal={uploadImgDialogOpen} closeModal={() => setUploadImgDialogOpen(false)}>
									<DialogContent>
										<Typography variant='body2' sx={{ mb: '3rem', textAlign: 'center', color: 'gray' }}>
											You can add a single image per message and it will be displayed at the bottom the message
										</Typography>
										<HandleImageUploadURL
											onImageUploadLogic={(url) => setImgUrl(url)}
											onChangeImgUrl={(e) => setImgUrl(e.target.value)}
											imageUrlValue={imgUrl}
											imageFolderName='TopicMessageImages'
											enterImageUrl={enterImageUrl}
											setEnterImageUrl={setEnterImageUrl}
										/>
										{imgUrl && <ImageThumbnail imgSource={imgUrl} removeImage={() => setImgUrl('')} />}
									</DialogContent>
									<CustomCancelButton
										onClick={() => {
											setUploadImgDialogOpen(false);
										}}
										sx={{ margin: '0 1.5rem 1.5rem 0', width: '8%', alignSelf: 'flex-end' }}>
										Close
									</CustomCancelButton>
								</CustomDialog>

								<Tooltip title='Reply' placement='top'>
									<IconButton
										sx={{
											':hover': {
												backgroundColor: 'transparent',
											},
										}}
										onClick={sendMessage}>
										<Send fontSize='small' />
									</IconButton>
								</Tooltip>
							</InputAdornment>
						),
					}}
				/>

				{showPicker && (
					<Box sx={{ position: 'absolute', bottom: '1rem', right: '20rem', zIndex: 10 }}>
						<Picker data={data} onEmojiSelect={handleEmojiSelect} theme='dark' />
					</Box>
				)}
			</Box>
		</DashboardPagesLayout>
	);
};

export default CommunityTopicPage;
