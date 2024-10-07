import { Alert, Box, DialogContent, IconButton, InputAdornment, Snackbar, Tooltip, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import TopicPaper from '../components/layouts/community/topicPage/TopicPaper';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import { CommunityMessage, TopicInfo } from '../interfaces/communityMessage';
import Message from '../components/layouts/community/communityMessage/Message';
import theme from '../themes';
import { renderMessageWithEmojis } from '../utils/renderMessageWithEmojis';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { Cancel, Image, InsertEmoticon, Mic, Send } from '@mui/icons-material';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import HandleImageUploadURL from '../components/forms/uploadImageVideoDocument/HandleImageUploadURL';
import ImageThumbnail from '../components/forms/uploadImageVideoDocument/ImageThumbnail';
import AudioRecorder from '../components/userCourses/AudioRecorder';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../firebase';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import { formatMessageTime } from '../utils/formatTime';
import { CommunityContext } from '../contexts/CommunityContextProvider';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { truncateText } from '../utils/utilText';
import { UsersContext } from '../contexts/UsersContextProvider';
import { renderMessageWithMentions } from '../utils/renderMessageWithMentions';
import { debounce } from 'lodash';
import { processTitle } from '../utils/processTitle';
import { Roles } from '../interfaces/enums';

export interface UserSuggestion {
	username: string;
	imageUrl: string;
}

export interface TopicSuggestion {
	title: string;
	topicId: string;
}

const CommunityTopicPage = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { topicId } = useParams();
	const { user } = useContext(UserAuthContext);
	const { sortedUsersData } = useContext(UsersContext);
	const { orgId } = useContext(OrganisationContext);
	const { fetchTopics, sortedTopicsData } = useContext(CommunityContext);

	const location = useLocation();
	const queryParams = new URLSearchParams(location.search);
	const initialPageNumber = parseInt(queryParams.get('page') || '1', 10);
	const messageIdFromNotification = queryParams.get('messageId') || '';

	const [messages, setMessages] = useState<CommunityMessage[]>([]);

	const [currentMessage, setCurrentMessage] = useState<string>('');
	const [replyToMessage, setReplyToMessage] = useState<CommunityMessage | null>(null);

	const [topic, setTopic] = useState<TopicInfo>({
		_id: '',
		userId: { _id: '', username: '', imageUrl: '', firebaseUserId: '' },
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
	const [everyOneMsg, setEveryoneMsg] = useState<boolean>(false);
	const [showPicker, setShowPicker] = useState<boolean>(false);
	const [uploadImgDialogOpen, setUploadImgDialogOpen] = useState<boolean>(false);
	const [imgUrl, setImgUrl] = useState<string>('');

	const [uploadAudioDialogOpen, setUploadAudioDialogOpen] = useState<boolean>(false);
	const [audioUrl, setAudioUrl] = useState<string>('');

	const [enterImageUrl, setEnterImageUrl] = useState<boolean>(true);
	const [isAudioUploading, setIsAudioUploading] = useState<boolean>(false);

	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [pageNumber, setPageNumber] = useState<number>(initialPageNumber);

	const [refreshTopics, setRefreshTopics] = useState<boolean>(false);

	const [isSending, setIsSending] = useState(false);

	const [highlightedMessageId, setHighlightedMessageId] = useState<string>(messageIdFromNotification);

	const [isTopicLocked, setIsTopicLocked] = useState<boolean>(false);

	const [showUserSuggestions, setShowUserSuggestions] = useState<boolean>(false);
	const [showTopicSuggestions, setShowTopicSuggestions] = useState<boolean>(false);

	const [userSuggestions, setUserSuggestions] = useState<UserSuggestion[]>([]);
	const [topicSuggestions, setTopicSuggestions] = useState<TopicSuggestion[]>([]);

	const [suggestionType, setSuggestionType] = useState<string | null>(null);

	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

	useEffect(() => {
		setPageNumber(initialPageNumber);
		setHighlightedMessageId(messageIdFromNotification);
	}, [initialPageNumber, messageIdFromNotification]);

	useEffect(() => {
		if (topicId) {
			const fetchTopicMessages = async () => {
				try {
					const messagesResponse = await axios.get(`${base_url}/communityMessages/topic/${topicId}?page=${pageNumber}&limit=5`);

					setMessages(messagesResponse.data.messages);

					setTopic(messagesResponse.data.topic);
					setIsTopicLocked(!messagesResponse.data.topic.isActive);
					setNumberOfPages(messagesResponse.data.totalPages);
				} catch (error) {
					console.log(error);
				}
			};

			fetchTopicMessages();
		}
	}, [pageNumber, topicId]);

	useEffect(() => {
		if (highlightedMessageId && messages.length > 0) {
			const messageElement = messageRefs.current[highlightedMessageId];

			if (messageElement) {
				messageElement.scrollIntoView({
					behavior: 'smooth',
					block: 'center',
				});

				// Add the highlight class
				messageElement.classList.add('highlight-community-message');
				setTimeout(() => {
					messageElement.classList.remove('highlight-community-message');
				}, 2500);

				// Clear the highlighted message after it's been highlighted
				setHighlightedMessageId(''); // Clear highlightedMessageId after the scroll
			}
		}
	}, [highlightedMessageId, messages]);

	useEffect(() => {
		scrollToBottom();
		fetchTopics(1);
	}, [messages]);

	const handleEmojiSelect = (emoji: any) => {
		setCurrentMessage((prevMessage) => prevMessage + emoji.native);
		setShowPicker(false);
	};

	const sendMessage = async () => {
		if (isSending) return;
		setIsSending(true);
		try {
			const response = await axios.post(`${base_url}/communityMessages`, {
				userId: user?._id,
				orgId,
				topicId: topic._id,
				text: currentMessage.trim(),
				imageUrl: imgUrl.trim(),
				audioUrl,
				parentMessageId: replyToMessage?._id,
			});

			if (replyToMessage && replyToMessage.userId._id !== user?._id) {
				// Create the notification data
				const replyToMsgNotificationData = {
					title: 'Community Message Replied',
					message: `${user?.username} replied to your message "${truncateText(replyToMessage.text, 30)}" in the topic ${truncateText(
						topic.title,
						25
					)} under community topics`,
					isRead: false,
					timestamp: serverTimestamp(),
					type: 'ReplyToCommunityMessage',
					userImageUrl: user?.imageUrl,
					communityTopicId: topic._id,
					communityMessageId: response.data._id,
				};

				const notificationRef = collection(db, 'notifications', replyToMessage.userId.firebaseUserId, 'userNotifications');
				await addDoc(notificationRef, replyToMsgNotificationData);
			}

			if (topic.userId._id !== user?._id) {
				const notificationToTopicOwnerData = {
					title: 'Community Topic Replied',
					message: `${user?.username} replied to your topic ${truncateText(topic.title, 25)} in community topics: "${truncateText(
						currentMessage,
						30
					)}"`,
					isRead: false,
					timestamp: serverTimestamp(),
					type: 'ReplyToCommunityTopic',
					userImageUrl: user?.imageUrl,
					communityTopicId: topic._id,
					communityMessageId: response.data._id,
				};

				const notificationRef = collection(db, 'notifications', topic.userId.firebaseUserId, 'userNotifications');
				await addDoc(notificationRef, notificationToTopicOwnerData);
			}

			const mentionedUsernames = extractMentions(currentMessage);

			if (mentionedUsernames.includes('everyone') && user?.role === Roles.ADMIN) {
				sortedUsersData.forEach((notifiedUser) => {
					if (notifiedUser.firebaseUserId !== user?.firebaseUserId) {
						const notificationData = {
							title: 'Community Notification',
							message: `${user?.username} mentioned @everyone in a message.`,
							isRead: false,
							timestamp: serverTimestamp(),
							type: 'CommunityNotification',
							userImageUrl: user?.imageUrl,
							communityTopicId: topic._id,
							communityMessageId: response.data._id,
						};

						const notificationRef = collection(db, 'notifications', notifiedUser.firebaseUserId, 'userNotifications');
						addDoc(notificationRef, notificationData);
					}
				});
			}

			if (mentionedUsernames.length > 0) {
				mentionedUsernames.forEach((username) => {
					const mentionedUser = sortedUsersData.find((user) => user.username === username);
					if (mentionedUser && mentionedUser.firebaseUserId !== user?.firebaseUserId) {
						// Create the notification data
						const notificationData = {
							title: 'You were mentioned in a message',
							message: `${user?.username} mentioned you in a message.`,
							isRead: false,
							timestamp: serverTimestamp(),
							type: 'MentionUser',
							userImageUrl: user?.imageUrl,
							communityTopicId: topic._id,
							communityMessageId: response.data._id,
						};

						const notificationRef = collection(db, 'notifications', mentionedUser.firebaseUserId, 'userNotifications');
						addDoc(notificationRef, notificationData);
					}
				});
			}

			setRefreshTopics(true);

			setMessages((prevData) => {
				return [...prevData, response.data];
			});
			setPageNumber(numberOfPages);
			setCurrentMessage('');
			setImgUrl('');
			setAudioUrl('');
			setReplyToMessage(null);
			setUserSuggestions([]);
			setTopicSuggestions;
			setShowUserSuggestions(false);
			setShowTopicSuggestions(false);
		} catch (error) {
			console.log(error);
		} finally {
			setIsSending(false);
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

	useEffect(() => {
		return () => {
			debouncedFetchSuggestions.cancel();
		};
	}, []);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const input = e.target.value;
		// Check if non-admin user is trying to mention @everyone
		if (input.includes('@everyone') && user?.role !== Roles.ADMIN) {
			setEveryoneMsg(true);
			const sanitizedInput = input.replace('@everyone', '');
			setCurrentMessage(sanitizedInput);
		} else {
			setCurrentMessage(input);
		}

		// Split by spaces to isolate the word being typed
		const words = input.split(/\s+/);
		const lastWord = words[words.length - 1];

		// Determine if the last word starts with '@' or '#'
		if (lastWord.startsWith('@')) {
			setSuggestionType('@');
			setShowUserSuggestions(true);
			setShowTopicSuggestions(false);

			const searchQuery = lastWord.slice(1).toLowerCase();
			const filteredUserSuggestions = sortedUsersData
				.filter((user) => user.username.toLowerCase().startsWith(searchQuery))
				.map((user) => ({ username: user.username, imageUrl: user.imageUrl }));

			setUserSuggestions(filteredUserSuggestions);

			// Use debounced fetch for additional data if search query is long
			if (searchQuery.length > 8) {
				debouncedFetchSuggestions(searchQuery);
			}
		} else if (lastWord.startsWith('#')) {
			setSuggestionType('#');
			setShowUserSuggestions(false);
			setShowTopicSuggestions(true);

			const searchQuery = lastWord.slice(1).toLowerCase();
			const filteredTopicSuggestions = sortedTopicsData
				.filter((topic) => topic.title.toLowerCase().startsWith(searchQuery))
				.map((topic) => ({ title: topic.title, topicId: topic._id }));

			setTopicSuggestions(filteredTopicSuggestions);

			if (searchQuery.length > 8) {
				debouncedFetchSuggestions(searchQuery);
			}
		} else if (!input.includes('@') && !input.includes('#')) {
			// Only hide suggestions if there are no `@` or `#` triggers anywhere in the input
			setShowUserSuggestions(false);
			setShowTopicSuggestions(false);
		}
	};

	const debouncedFetchSuggestions = debounce((input: string) => {
		const currentWord = input.split(/\s+/).pop()?.slice(1); // Extract the text after `@` or `#`

		if (suggestionType === '@') {
			const filteredUserSuggestions = sortedUsersData
				.filter((user) => user?.username.toLowerCase().startsWith(currentWord?.toLowerCase() || ''))
				.map((user) => ({ username: user.username, imageUrl: user.imageUrl }));
			setUserSuggestions(filteredUserSuggestions);
		} else if (suggestionType === '#') {
			const filteredTopicSuggestions = sortedTopicsData
				.filter((topic) => topic?.title.toLowerCase().startsWith(currentWord?.toLowerCase() || ''))
				.map((topic) => ({ title: topic.title, topicId: topic._id }));
			setTopicSuggestions(filteredTopicSuggestions);
		}
	}, 300);

	const handleSuggestionClick = (suggestion: UserSuggestion | TopicSuggestion) => {
		let updatedSuggestion = '';

		if (suggestionType === '@' && 'username' in suggestion) {
			// Handle UserSuggestion
			updatedSuggestion = suggestion.username
				.replace(/[^a-zA-Z0-9 .]/g, '_')
				.split(' ')
				.join('_');
		} else if (suggestionType === '#' && 'title' in suggestion) {
			// Handle TopicSuggestion
			updatedSuggestion = suggestion.title
				.replace(/[^a-zA-Z0-9]/g, '_')
				.split(' ')
				.join('_');
		}

		if (updatedSuggestion) {
			const triggerSymbol = suggestionType || '';
			const currentMessageArray = currentMessage.split(/[@#]\w*$/);
			const updatedMessage = `${currentMessageArray[0]}${triggerSymbol}${updatedSuggestion} `;

			setCurrentMessage(updatedMessage);

			// Close the appropriate suggestion dropdown
			if (suggestionType === '@') {
				setShowUserSuggestions(false);
			} else if (suggestionType === '#') {
				setShowTopicSuggestions(false);
			}
		}
	};

	const extractMentions = (message: string): string[] => {
		const mentionRegex = /@([a-zA-Z0-9._]+)/g;
		let match;
		const mentions = [];

		while ((match = mentionRegex.exec(message)) !== null) {
			const username = match[1];
			if (username === 'everyone') {
				mentions.push('everyone');
			} else {
				mentions.push(username);
			}
		}

		return mentions;
	};

	// Apply the conversion to all topics in sortedTopics
	const processedTopics = sortedTopicsData.map((topic) => ({
		title: processTitle(topic.title), // Apply the same transformation
		topicId: topic._id,
	}));

	const renderMessageContent = (text: string) => {
		// Step 1: Wrap mentions in links
		const withMentions = renderMessageWithMentions(text, processedTopics, user!);

		// Step 2: Pass the result to emoji rendering, handling both strings and arrays
		return renderMessageWithEmojis(withMentions, '1.5rem');
	};
	const renderedTopicContent = useMemo(() => renderMessageContent(topic?.text || ''), [topic?.text]);

	return (
		<DashboardPagesLayout pageName='Community' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ width: '80%', position: 'fixed', top: '4rem', zIndex: 1000, backgroundColor: theme.bgColor?.secondary }}>
				<TopicPaper
					topic={topic}
					messages={messages}
					setDisplayDeleteTopicMsg={setDisplayDeleteTopicMsg}
					setTopic={setTopic}
					refreshTopics={refreshTopics}
					isTopicLocked={isTopicLocked}
					setIsTopicLocked={setIsTopicLocked}
				/>
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

			<Snackbar
				open={everyOneMsg}
				autoHideDuration={3000}
				anchorOrigin={{ vertical, horizontal }}
				sx={{ mt: '2rem' }}
				onClose={() => {
					setEveryoneMsg(false);
				}}>
				<Alert severity='error' variant='filled' sx={{ width: '100%' }}>
					Only admin users can mention @everyone.
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
							{renderedTopicContent}
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
									height: '2.25rem',
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
					<Message
						key={message?._id}
						message={message}
						isFirst={index === 0}
						isLast={index === messages.length - 1}
						setMessages={setMessages}
						setReplyToMessage={setReplyToMessage}
						messageRefs={messageRefs}
						setPageNumber={setPageNumber}
						setHighlightedMessageId={setHighlightedMessageId}
						isTopicLocked={isTopicLocked}
						topicTitle={topic.title}
						renderMessageContent={renderMessageContent}
					/>
				))}
				<div ref={messagesEndRef} />
				<Box sx={{ display: 'flex', justifyContent: 'center', mt: '1.5rem', width: '95%' }}>
					<CustomTablePagination count={numberOfPages} page={pageNumber} onChange={setPageNumber} />
				</Box>
			</Box>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					width: '100%',
					position: 'fixed',
					bottom: '0',
					backgroundColor: theme.bgColor?.secondary,
					paddingTop: '0.5rem',
				}}>
				{replyToMessage && (
					<Box
						sx={{
							border: '0.09rem solid lightgray',
							borderBottom: 'none',
							mt: '0.5rem',
							position: 'relative',
							width: '78%',
							borderRadius: '0.35rem 0.35rem 0 0',
							bgcolor: '#E8E8E8',
						}}>
						<Box sx={{ borderBottom: '0.09rem solid lightgray', padding: '0.5rem' }}>
							<Typography variant='body2' sx={{ color: 'gray', mb: '0.35rem' }}>
								Replying to:
							</Typography>
						</Box>
						<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', maxHeight: '6rem', overflow: 'auto' }}>
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									justifyContent: 'flex-start',
									alignItems: 'center',
									flex: 1,
									paddingTop: '0.45rem',
								}}>
								<Box>
									<img src={replyToMessage?.userId?.imageUrl} alt='profile' style={{ height: '2rem', width: '2rem', borderRadius: '50%' }} />
								</Box>
								<Box>
									<Typography sx={{ fontSize: '0.65rem' }}>{replyToMessage?.userId?.username}</Typography>
								</Box>
								<Box>
									<Typography variant='caption' sx={{ fontSize: '0.5rem', color: 'gray' }}>
										{formatMessageTime(replyToMessage?.createdAt)}
									</Typography>
								</Box>
							</Box>
							<Box sx={{ padding: '0.75rem', flex: 8, borderLeft: '0.09rem solid lightgray' }}>
								<Typography sx={{ fontSize: '0.8rem', lineHeight: '1.8', minHeight: '3.5rem' }}>
									{renderMessageWithEmojis(replyToMessage.text, '1.25rem')}
								</Typography>
								{replyToMessage.imageUrl && (
									<Box>
										<img
											src={replyToMessage.imageUrl}
											alt='img'
											style={{ maxHeight: '7rem', objectFit: 'contain', borderRadius: '0.15rem', margin: '0.5rem 0' }}
										/>
									</Box>
								)}

								{replyToMessage?.audioUrl && (
									<Box>
										<audio
											src={replyToMessage.audioUrl}
											controls
											style={{
												margin: '0.5rem 0',
												boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
												borderRadius: '0.35rem',
												width: '30%',
												height: '1.5rem',
											}}
										/>
									</Box>
								)}
							</Box>
						</Box>

						<IconButton size='small' sx={{ position: 'absolute', top: '0.2rem', right: '0.2rem' }} onClick={() => setReplyToMessage(null)}>
							<Cancel fontSize='small' />
						</IconButton>
					</Box>
				)}

				<Box sx={{ display: 'flex', position: 'absolute', right: '10%', width: '78%' }}>
					{audioUrl && (
						<Box
							sx={{
								display: 'flex',
								alignItems: 'center',
								position: 'absolute',
								top: '-3rem',
								right: imgUrl ? '10rem' : '1rem',
								width: '10rem',
							}}>
							<audio
								src={audioUrl}
								controls
								style={{
									boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
									borderRadius: '0.35rem',
									width: '100%',
									height: '1.25rem',
								}}
							/>
							<Tooltip title='Remove Recording' placement='top'>
								<IconButton size='small' onClick={() => setAudioUrl('')} sx={{ ':hover': { backgroundColor: 'transparent' } }}>
									<Cancel sx={{ fontSize: '1rem' }} />
								</IconButton>
							</Tooltip>
						</Box>
					)}

					{imgUrl && (
						<Box sx={{ display: 'flex', position: 'absolute', top: '-4.25rem', right: '1rem', maxHeight: '4rem' }}>
							<img src={imgUrl} alt='Preview' style={{ maxHeight: '4rem', objectFit: 'contain', borderRadius: '0.25rem' }} />
							<Tooltip title='Remove Image' placement='top'>
								<IconButton size='small' onClick={() => setImgUrl('')} sx={{ ':hover': { backgroundColor: 'transparent' } }}>
									<Cancel sx={{ fontSize: '1rem' }} />
								</IconButton>
							</Tooltip>
						</Box>
					)}
				</Box>
				{showTopicSuggestions && topicSuggestions.length > 0 && (
					<Box
						sx={{
							position: 'absolute',
							bottom: '5.5rem',
							left: '11%',
							backgroundColor: '#fff',
							borderRadius: '0.25rem',
							boxShadow: '0 0.1rem 0.4rem rgba(0,0,0,0.3)',
							maxHeight: '10rem',
							overflowY: 'auto',
							zIndex: 10,
						}}>
						{topicSuggestions.map((suggestion, index) => (
							<Box
								key={index}
								onClick={() => handleSuggestionClick(suggestion)}
								sx={{ padding: '0.5rem 1rem', cursor: 'pointer', '&:hover': { backgroundColor: '#f0f0f0' } }}>
								<Typography variant='body2'>{truncateText(suggestion.title, 35)}</Typography>
							</Box>
						))}
					</Box>
				)}

				{showUserSuggestions && userSuggestions.length > 0 && (
					<Box
						sx={{
							position: 'absolute',
							bottom: '5.5rem',
							left: '11%',
							backgroundColor: '#fff',
							borderRadius: '0.25rem',
							boxShadow: '0 0.1rem 0.4rem rgba(0,0,0,0.3)',
							maxHeight: '10rem',
							overflowY: 'auto',
							zIndex: 10,
						}}>
						{userSuggestions.map((suggestion, index) => (
							<Box
								key={index}
								onClick={() => handleSuggestionClick(suggestion)}
								sx={{ display: 'flex', alignItems: 'center', padding: '0.5rem 1rem', cursor: 'pointer', '&:hover': { backgroundColor: '#f0f0f0' } }}>
								<Box>
									<img src={suggestion.imageUrl} alt='img' style={{ height: '2rem', width: '2rem', borderRadius: '50%', marginRight: '0.5rem' }} />
								</Box>
								<Box>
									<Typography variant='body2'>{suggestion.username}</Typography>
								</Box>
							</Box>
						))}
					</Box>
				)}

				<CustomTextField
					multiline
					rows={3}
					value={currentMessage}
					required={false}
					disabled={isTopicLocked}
					onChange={handleInputChange}
					placeholder={isTopicLocked ? 'You cannot send a message since topic is locked' : ''}
					sx={{ width: '78%', border: replyToMessage ? 'none' : 'inherit', position: 'relative' }}
					InputProps={{
						sx: {
							fontSize: '0.8rem',
							padding: '0.5rem 1rem',
						},
						endAdornment: (
							<InputAdornment position='end'>
								<IconButton
									onClick={() => setShowPicker(!showPicker)}
									disabled={isTopicLocked}
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
										disabled={isTopicLocked}
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
										disabled={isTopicLocked}
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
										disabled={isTopicLocked || isSending}
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
