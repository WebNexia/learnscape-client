import { Alert, Box, Dialog, DialogActions, DialogContent, IconButton, InputAdornment, Snackbar, Tooltip, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import TopicPaper from '../components/layouts/community/topicPage/TopicPaper';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import axios from '@utils/axiosInstance';
import { CommunityMessage, TopicInfo } from '../interfaces/communityMessage';
import Message from '../components/layouts/community/communityMessage/Message';
import theme from '../themes';
import { renderMessageWithEmojis } from '../utils/renderMessageWithEmojis';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { Cancel, Image, InsertEmoticon, Mic, OpenInFullOutlined, Send } from '@mui/icons-material';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import HandleImageUploadURL from '../components/forms/uploadImageVideoDocument/HandleImageUploadURL';
import ImageThumbnail from '../components/forms/uploadImageVideoDocument/ImageThumbnail';
import AudioRecorder from '../components/userCourses/AudioRecorder';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase';
import { sendCommunityNotifications } from '../utils/communityNotifications';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import { Select, MenuItem, FormControl } from '@mui/material';
import { FirstPage, LastPage, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { formatMessageTime } from '../utils/formatTime';
import { CommunityMessagesContext } from '../contexts/CommunityMessagesContextProvider';
import { CustomAudioPlayer } from '../components/audio';

import { Roles } from '../interfaces/enums';
import { validateImageUrl } from '../utils/urlValidation';
import { renderMessageWithMentions } from '../utils/renderMessageWithMentions';

import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { useUploadLimit } from '../contexts/UploadLimitContextProvider';
import CommunityUserSearchSelect from '../components/CommunityUserSearchSelect';
import { SearchUser } from '../interfaces/search';
import { useAuth } from '../hooks/useAuth';

export interface UserSuggestion {
	username: string;
	imageUrl: string;
}

const CommunityTopicPage = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { topicId } = useParams();
	const { user } = useContext(UserAuthContext);
	const { orgId } = useContext(OrganisationContext);

	const {
		messages,
		numberOfPages,
		pageNumber,
		setPageNumber,
		fetchMessages,
		fetchMoreMessages,
		fetchSpecificPage, // eslint-disable-line @typescript-eslint/no-unused-vars
		loadedPages,
		totalItems,
		addNewMessage,
		currentTopicId,
		enableCommunityMessagesFetch,
	} = useContext(CommunityMessagesContext);

	const { isRotated, isVerySmallScreen, isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const location = useLocation();
	const queryParams = new URLSearchParams(location.search);
	const initialPageNumber = parseInt(queryParams.get('page') || '1', 10);
	const messageIdFromNotification = queryParams.get('messageId') || '';

	// Messages state now comes from CommunityMessagesContext

	const [currentMessage, setCurrentMessage] = useState<string>('');
	const [replyToMessage, setReplyToMessage] = useState<CommunityMessage | null>(null);

	const [zoomedImage, setZoomedImage] = useState<string | undefined>('');

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

	// URL validation error handling
	const [isUrlErrorOpen, setIsUrlErrorOpen] = useState<boolean>(false);

	// State to track if topic content is scrollable
	const [isTopicScrollable, setIsTopicScrollable] = useState<boolean>(false);
	const topicContentRef = useRef<HTMLDivElement>(null);
	const [urlErrorMessage, setUrlErrorMessage] = useState<string>('');

	// Session attempt limits
	const [audioUploadAttempts, setAudioUploadAttempts] = useState<number>(0);
	const [imageUploadAttempts, setImageUploadAttempts] = useState<number>(0);
	const MAX_SESSION_ATTEMPTS = 5;

	const { hasAdminAccess } = useAuth();
	const [enterImageUrl, setEnterImageUrl] = useState<boolean>(hasAdminAccess ? true : false);
	const [isAudioUploading, setIsAudioUploading] = useState<boolean>(false);

	// numberOfPages and pageNumber now come from CommunityMessagesContext

	const [refreshTopics, setRefreshTopics] = useState<boolean>(false);

	const [isSending, setIsSending] = useState(false);

	const [highlightedMessageId, setHighlightedMessageId] = useState<string>(messageIdFromNotification);

	const [isTopicLocked, setIsTopicLocked] = useState<boolean>(false);

	const [showUserSearch, setShowUserSearch] = useState<boolean>(false);
	const [userSearchValue, setUserSearchValue] = useState<string>('');

	const [isTopicZoomed, setIsTopicZoomed] = useState<boolean>(false);

	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

	// Enable community messages fetching only once when component mounts
	useEffect(() => {
		enableCommunityMessagesFetch();
	}, []); // Empty dependency array - only run once

	useEffect(() => {
		setPageNumber(initialPageNumber);
		setHighlightedMessageId(messageIdFromNotification);
	}, [initialPageNumber, messageIdFromNotification]);

	useEffect(() => {
		if (topicId) {
			const fetchTopicInfo = async () => {
				try {
					// Only fetch topic info, not messages
					const topicResponse = await axios.get(`${base_url}/communityTopics/${topicId}`);

					setTopic(topicResponse.data.data);
					setIsTopicLocked(!topicResponse.data.data.isActive);

					// Initialize messages in context
					fetchMessages(topicId);
				} catch (error) {
					console.log(error);
				}
			};

			fetchTopicInfo();
		}
	}, [topicId, fetchMessages]);

	useEffect(() => {
		if (highlightedMessageId && messages && messages.length > 0) {
			// Find the message in the full messages array
			const messageIndex = messages.findIndex((msg) => msg._id === highlightedMessageId);

			if (messageIndex !== -1) {
				// Calculate which frontend page this message is on (20 messages per frontend page)
				const frontendPage = Math.floor(messageIndex / 20) + 1;

				// If the message is not on the current frontend page, navigate to the correct page
				if (frontendPage !== pageNumber) {
					setPageNumber(frontendPage);
					// The highlighting will happen after the page changes
					return;
				}
			} else {
				// Message not found in loaded messages - it might be on a further backend page
				const fetchMessagePage = async () => {
					try {
						// Get the message details to find which backend page it's on
						const response = await axios.get(`${base_url}/communityMessages/message/${highlightedMessageId}?limit=200`);
						const { page: backendPage } = response.data;

						if (backendPage) {
							// Find the highest currently loaded backend page
							const maxLoadedBackendPage = Math.max(...loadedPages, 1);

							// If the target backend page is beyond what we've loaded, fetch all backend pages in between
							if (backendPage > maxLoadedBackendPage) {
								await fetchMoreMessages(topicId || '', maxLoadedBackendPage + 1, backendPage);
							}

							// After loading the backend page, the message should now be in the messages array
							// The highlighting will happen when the effect runs again with the updated messages
							return;
						}
					} catch (error) {
						console.error('Error fetching message page:', error);
						// Clear the highlighted message if we can't find it
						setHighlightedMessageId('');
					}
				};

				fetchMessagePage();
				return;
			}

			// Add a small delay to ensure messages are fully rendered
			const timer = setTimeout(() => {
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
				} else {
					// If element not found, try again after a longer delay
					setTimeout(() => {
						const retryElement = messageRefs.current[highlightedMessageId];
						if (retryElement) {
							retryElement.scrollIntoView({
								behavior: 'smooth',
								block: 'center',
							});
							retryElement.classList.add('highlight-community-message');
							setTimeout(() => {
								retryElement.classList.remove('highlight-community-message');
							}, 2500);
						}
						setHighlightedMessageId('');
					}, 1000);
				}
			}, 100);

			return () => clearTimeout(timer);
		}
	}, [highlightedMessageId, messages, pageNumber, topicId, fetchMoreMessages, loadedPages]);

	useEffect(() => {
		// scrollToBottom();
	}, [messages, pageNumber, numberOfPages, loadedPages, totalItems]);

	const handleEmojiSelect = (emoji: any) => {
		setCurrentMessage((prevMessage) => prevMessage + emoji.native);
		setShowPicker(false);
	};

	// Function to check if topic content is scrollable
	const checkTopicScrollable = () => {
		if (topicContentRef.current) {
			const element = topicContentRef.current;
			// Check if content is actually scrollable
			const isScrollable = element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
			setIsTopicScrollable(isScrollable);
		}
	};

	// URL validation function
	const validateUrls = async (): Promise<boolean> => {
		let hasErrors = false;
		let errorMessages: string[] = [];

		// Validate image URL if provided
		if (imgUrl?.trim()) {
			const imageValidation = await validateImageUrl(imgUrl.trim());
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

	const sendMessage = async () => {
		if (isSending) return;

		// Validate URLs before proceeding
		const urlsValid = await validateUrls();
		if (!urlsValid) {
			return; // Don't proceed if URL validation fails
		}

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

			setRefreshTopics(true);

			addNewMessage(response.data);

			// Capture data for background notifications
			const newMessageId = response.data._id;
			const messageCopy = currentMessage;

			// Refresh upload limits after successful message send (non-blocking)
			// Use optimistic update for instant UI feedback
			if (imgUrl.trim() || audioUrl.trim()) {
				if (imgUrl.trim()) incrementImageUpload();
				if (audioUrl.trim()) incrementAudioUpload();
			}

			// Reset form
			setCurrentMessage('');
			setImgUrl('');
			setAudioUrl('');
			setReplyToMessage(null);
			setShowUserSearch(false);
			setUserSearchValue('');
			scrollToBottom();

			// Send notifications in background (non-blocking)
			sendCommunityNotifications({
				user,
				topic,
				replyToMessage,
				currentMessage: messageCopy,
				newMessageId,
				baseUrl: base_url,
				orgId,
			}).catch((error) => {
				console.warn('Failed to send notifications:', error);
				// Don't block UI, just log the error
			});
		} catch (error: any) {
			// Show error message to user
			if (error?.response?.data?.message) {
				setUrlErrorMessage(error.response.data.message);
			} else {
				setUrlErrorMessage('Failed to send message. Please try again.');
			}
			setIsUrlErrorOpen(true);
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

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const input = e.target.value;
		// Check if non-admin user is trying to mention @everyone
		if (input?.includes('@everyone') && !hasAdminAccess) {
			setEveryoneMsg(true);
			const sanitizedInput = input.replace('@everyone', '');
			setCurrentMessage(sanitizedInput);
		} else {
			setCurrentMessage(input);
		}

		// Split by spaces to isolate the word being typed
		const words = input.split(/\s+/);
		const lastWord = words && words.length > 0 ? (words && words.length > 0 ? words[words.length - 1] : undefined) : '';

		// Check if admin is typing @everyone - close search box
		if (lastWord === '@everyone' && hasAdminAccess) {
			setShowUserSearch(false);
			setUserSearchValue('');
			return;
		}

		// Determine if the last word starts with '@'
		if (lastWord?.startsWith('@')) {
			setShowUserSearch(true);
			setUserSearchValue(lastWord?.slice(1) || '');
		} else if (!input?.includes('@')) {
			// Hide search if there are no `@` triggers anywhere in the input
			setShowUserSearch(false);
		}
	};

	const handleUserSelection = (selectedUser: SearchUser) => {
		const updatedSuggestion = selectedUser.username
			.replace(/[^a-zA-Z0-9 .]/g, '_')
			.split(' ')
			.join('_');

		const triggerSymbol = '@';
		const currentMessageArray = currentMessage.split(/[@]\w*$/);
		const updatedMessage = `${currentMessageArray[0]}${triggerSymbol}${updatedSuggestion} `;

		setCurrentMessage(updatedMessage);
		setShowUserSearch(false);
		setUserSearchValue('');
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

	// Get list of already mentioned usernames (excluding the current search term)
	const getAlreadyMentionedUsernames = useCallback(() => {
		const mentions = extractMentions(currentMessage);
		// Filter out the current search term to allow editing the current mention
		const currentSearchTerm = userSearchValue.trim();
		return mentions?.filter((mention) => mention !== currentSearchTerm) || [];
	}, [currentMessage, userSearchValue]);

	const renderMessageContent = (text: string) => {
		// Step 1: Wrap mentions in links
		const withMentions = renderMessageWithMentions(text, [], user!);

		// Step 2: Pass the result to emoji rendering, handling both strings and arrays
		return renderMessageWithEmojis(withMentions, isMobileSize ? '1rem' : '1.5rem', isMobileSize);
	};
	const renderedTopicContent = useMemo(() => renderMessageContent(topic?.text || ''), [topic?.text]);

	// Check if topic content is scrollable when topic or rendered content changes
	useEffect(() => {
		// Use a longer delay to ensure images and content are fully loaded
		const timer = setTimeout(() => {
			checkTopicScrollable();
		}, 300);

		return () => clearTimeout(timer);
	}, [topic, renderedTopicContent]);

	// Also check when images load
	useEffect(() => {
		if (topic?.imageUrl) {
			// Check scrollability after a delay to allow images to load
			const timer = setTimeout(() => {
				checkTopicScrollable();
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [topic?.imageUrl]);

	// Add resize observer to handle window resize events
	useEffect(() => {
		const handleResize = () => {
			checkTopicScrollable();
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	// Upload limit management - for all roles
	const { getRemainingAudioUploads, getRemainingImageUploads, getImageLimit, getAudioLimit, incrementAudioUpload, incrementImageUpload } =
		useUploadLimit();

	// Smart pagination handler
	const handlePageChange = async (newPage: number) => {
		const pageSize = 20; // 20 messages per page
		const requiredRecords = newPage * pageSize;

		// Smart "Last" button optimization: If jumping to a page far from current data, fetch directly
		const isJumpingToLastPage = newPage === numberOfPages;
		const hasRequiredData = messages && messages.length >= requiredRecords;

		if (isJumpingToLastPage || !hasRequiredData) {
			// For "Last" button or any page without data, fetch the specific page directly
			await fetchSpecificPage(currentTopicId, newPage);
		} else {
			// For normal navigation, use progressive loading
			const currentLoadedPages = loadedPages && loadedPages.length > 0 ? Math.max(...loadedPages) : 0;
			const targetBackendPage = Math.ceil(requiredRecords / 200); // Calculate which backend page we need (200 messages per backend page)

			// Fetch missing backend pages using batch approach (like other admin pages)
			if (currentLoadedPages < targetBackendPage) {
				await fetchMoreMessages(currentTopicId, currentLoadedPages + 1, targetBackendPage);
			}
		}

		setPageNumber(newPage);
	};

	return (
		<DashboardPagesLayout pageName='Community' customSettings={{ justifyContent: 'flex-start' }}>
			<Box
				sx={{
					width: isVerySmallScreen ? '95%' : isMobileSize ? '90%' : '80%',
					position: 'fixed',
					top: isMobileSize ? '3rem' : '4rem',
					zIndex: 1000,
					backgroundColor: theme.bgColor?.secondary,
				}}>
				<TopicPaper
					topic={topic}
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
				<Alert
					onClose={() => setDisplayDeleteTopicMsg(false)}
					severity='success'
					sx={{ width: isMobileSize ? '60%' : '100%', fontSize: isMobileSize ? '0.75rem' : undefined }}>
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
				<Alert severity='error' variant='filled' sx={{ width: isMobileSize ? '60%' : '100%', fontSize: isMobileSize ? '0.75rem' : undefined }}>
					Only admin users can mention @everyone.
				</Alert>
			</Snackbar>
			<Box
				sx={{
					display: 'flex',
					width: isMobileSize ? '90%' : '87%',
					minHeight: isMobileSize ? '3rem' : '5rem',
					maxHeight: isMobileSize ? '5rem' : '7rem',
					border: 'solid lightgray 0.1rem',
					marginTop: isMobileSize ? '3.75rem' : '9rem',
					borderRadius: '0.35rem',
					boxShadow: isMobileSize ? '0rem 0.1rem 0.3rem 0.1rem rgba(0,0,0,0.2)' : '0rem 0.2rem 0.5rem 0.1rem rgba(0,0,0,0.2)',
					position: 'relative',
				}}>
				{isTopicScrollable && (
					<Tooltip title='Full View' placement='top' arrow>
						<IconButton
							sx={{ 'position': 'absolute', 'top': '0rem', 'right': '0.85rem', 'zIndex': 10, ':hover': { backgroundColor: 'transparent' } }}
							onClick={() => setIsTopicZoomed(true)}>
							<OpenInFullOutlined fontSize='small' />
						</IconButton>
					</Tooltip>
				)}
				<CustomDialog openModal={isTopicZoomed} closeModal={() => setIsTopicZoomed(false)} maxWidth='sm'>
					<DialogContent>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<Box>
								<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.65rem' : undefined, mb: '0.75rem' }}>
									Topic: {topic?.title}
								</Typography>
							</Box>
							<Box sx={{ display: 'flex' }}>
								<Typography variant='caption' sx={{ fontSize: isMobileSize ? '0.65rem' : undefined, mb: '0.75rem', color: 'gray' }}>
									{topic?.userId?.username} - {formatMessageTime(topic?.createdAt)}
								</Typography>
							</Box>
						</Box>
						<Typography
							variant='body2'
							sx={{
								lineHeight: 1.7,
								mb: '0.75rem',
								whiteSpace: 'pre-wrap',
								wordBreak: 'break-word',
								fontSize: isMobileSize ? '0.65rem' : undefined,
							}}>
							{renderedTopicContent}
						</Typography>
						{topic?.imageUrl && (
							<Box>
								<img
									src={topic.imageUrl}
									alt='img'
									style={{ maxHeight: isMobileSize ? '11rem' : '15rem', objectFit: 'contain', borderRadius: '0.15rem', cursor: 'pointer' }}
									onClick={() => setZoomedImage(topic?.imageUrl)}
								/>
							</Box>
						)}
						{zoomedImage && (
							<Dialog open={!!zoomedImage} onClose={() => setZoomedImage('')} maxWidth='sm'>
								<img src={zoomedImage} alt='Zoomed' style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '0.25rem' }} />
							</Dialog>
						)}

						{topic?.audioUrl && (
							<Box sx={{ mt: 2 }}>
								<CustomAudioPlayer
									audioUrl={topic.audioUrl}
									title={topic.title || 'Topic Audio'}
									sx={{ maxWidth: isVerySmallScreen ? '95%' : isMobileSize ? '80%' : '500px' }}
								/>
							</Box>
						)}
					</DialogContent>
					<DialogActions>
						<CustomCancelButton onClick={() => setIsTopicZoomed(false)} sx={{ margin: '0 1rem 0.5rem 0' }}>
							Close
						</CustomCancelButton>
					</DialogActions>
				</CustomDialog>
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
						<img
							src={topic?.userId?.imageUrl || 'https://img.sportsbookreview.com/images/avatars/default-avatar.jpg'}
							alt='profile'
							style={{ height: isMobileSize ? '2rem' : '4rem', width: isMobileSize ? '2rem' : '4rem', borderRadius: '50%' }}
						/>
					</Box>
					<Box>
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.65rem' : undefined }}>
							{topic?.userId?.username}
						</Typography>
					</Box>
				</Box>
				<Box ref={topicContentRef} sx={{ flex: 8, padding: isMobileSize ? '0.25rem' : '1rem', overflow: 'auto' }}>
					<Box>
						<Typography
							variant='body2'
							sx={{
								lineHeight: 1.7,
								mb: '0.75rem',
								whiteSpace: 'pre-wrap',
								wordBreak: 'break-word',
								fontSize: isMobileSize ? '0.65rem' : undefined,
							}}>
							{renderedTopicContent}
						</Typography>
					</Box>
					{topic?.imageUrl && (
						<Box onClick={() => setZoomedImage(topic?.imageUrl)} sx={{ cursor: 'pointer' }}>
							<img
								src={topic.imageUrl}
								alt='img'
								style={{ maxHeight: isMobileSize ? '11rem' : '15rem', objectFit: 'contain', borderRadius: '0.15rem' }}
							/>
						</Box>
					)}

					{zoomedImage && (
						<Dialog open={!!zoomedImage} onClose={() => setZoomedImage('')} maxWidth='sm'>
							<img src={zoomedImage} alt='Zoomed' style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '0.25rem' }} />
						</Dialog>
					)}

					{topic?.audioUrl && (
						<Box sx={{ mt: 2 }}>
							<CustomAudioPlayer
								audioUrl={topic.audioUrl}
								title={topic.title || 'Topic Audio'}
								sx={{ maxWidth: isVerySmallScreen ? '95%' : isMobileSize ? '80%' : '500px' }}
							/>
						</Box>
					)}
				</Box>
			</Box>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					width: isMobileSize ? '92%' : '87%',
					margin: '1.5rem 0 5rem 0',
					paddingBottom: isMobileSize ? '2rem' : '5rem',
				}}>
				{(() => {
					const pageSize = 20;
					const startIndex = (pageNumber - 1) * pageSize;
					const endIndex = startIndex + pageSize;
					const pageMessages = messages?.slice(startIndex, endIndex) || [];

					// If we don't have enough messages for this page, show appropriate state
					if (pageMessages.length === 0) {
						// If there are no messages at all, show empty state
						if (totalItems === 0) {
							return (
								<Box sx={{ textAlign: 'center', padding: '2rem', color: 'gray' }}>
									<Typography sx={{ fontSize: isMobileSize ? '0.7rem' : '0.85rem' }}>
										No messages yet. Be the first to start the conversation!
									</Typography>
								</Box>
							);
						}
						// Otherwise show loading state
						return (
							<Box sx={{ textAlign: 'center', padding: '2rem', color: 'gray' }}>
								<Typography>Loading messages for page {pageNumber}...</Typography>
								<Typography variant='caption'>
									Page {pageNumber} of {numberOfPages}
								</Typography>
							</Box>
						);
					}

					return pageMessages.map((message: CommunityMessage, index) => (
						<Message
							key={message?._id}
							message={message}
							isFirst={index === 0}
							isLast={index === pageMessages.length - 1}
							setReplyToMessage={setReplyToMessage}
							messageRefs={messageRefs}
							setPageNumber={setPageNumber}
							setHighlightedMessageId={setHighlightedMessageId}
							isTopicLocked={isTopicLocked}
							topicTitle={topic.title}
							renderMessageContent={renderMessageContent}
						/>
					));
				})()}
				<div ref={messagesEndRef} />
				<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: '1.5rem', width: '95%', gap: 1 }}>
					{/* First Page Button */}
					<IconButton onClick={() => handlePageChange(1)} disabled={pageNumber === 1} sx={{ fontSize: isMobileSize ? '0.8rem' : '1rem' }}>
						<FirstPage fontSize='small' />
					</IconButton>

					{/* Previous Page Button */}
					<IconButton
						onClick={() => handlePageChange(pageNumber - 1)}
						disabled={pageNumber === 1}
						sx={{ fontSize: isMobileSize ? '0.8rem' : '1rem' }}>
						<NavigateBefore fontSize='small' />
					</IconButton>

					{/* Page Select Dropdown */}
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.85rem' }}>
							Page:
						</Typography>
						<FormControl size='small' sx={{ minWidth: 60 }}>
							<Select
								value={pageNumber}
								onChange={(e) => handlePageChange(Number(e.target.value))}
								sx={{
									'fontSize': isMobileSize ? '0.7rem' : '0.85rem',
									'& .MuiSelect-select': {
										padding: isMobileSize ? '4px 8px' : '6px 12px',
									},
								}}>
								{Array.from({ length: numberOfPages }, (_, i) => i + 1).map((page) => (
									<MenuItem key={page} value={page} sx={{ fontSize: isMobileSize ? '0.7rem' : '0.85rem' }}>
										{page}
									</MenuItem>
								))}
							</Select>
						</FormControl>
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.85rem' }}>
							of {numberOfPages}
						</Typography>
					</Box>

					{/* Next Page Button */}
					<IconButton
						onClick={() => handlePageChange(pageNumber + 1)}
						disabled={pageNumber === numberOfPages}
						sx={{ fontSize: isMobileSize ? '0.8rem' : '1rem' }}>
						<NavigateNext fontSize='small' />
					</IconButton>

					{/* Last Page Button */}
					<IconButton
						onClick={() => handlePageChange(numberOfPages)}
						disabled={pageNumber === numberOfPages}
						sx={{ fontSize: isMobileSize ? '0.8rem' : '1rem' }}>
						<LastPage fontSize='small' />
					</IconButton>
				</Box>
			</Box>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					width: isMobileSize ? '95%' : '100%',
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
							width: isVerySmallScreen ? '95%' : isMobileSize ? '90%' : '78%',
							borderRadius: '0.35rem 0.35rem 0 0',
							bgcolor: '#E8E8E8',
						}}>
						<Box sx={{ borderBottom: '0.09rem solid lightgray', padding: isMobileSize ? '0.15rem' : '0.5rem' }}>
							<Typography variant='body2' sx={{ color: 'gray', mb: '0.35rem', fontSize: isMobileSize ? '0.7rem' : '0.85rem' }}>
								Replying to:
							</Typography>
						</Box>
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'flex-start',
								maxHeight: isMobileSize ? '4rem' : '6rem',
								overflow: 'auto',
							}}>
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
									<img
										src={replyToMessage?.userId?.imageUrl}
										alt='profile'
										style={{ height: isMobileSize ? '1.5rem' : '2rem', width: isMobileSize ? '1.5rem' : '2rem', borderRadius: '50%' }}
									/>
								</Box>
								<Box>
									<Typography sx={{ fontSize: isMobileSize ? '0.55rem' : '0.65rem' }}>{replyToMessage?.userId?.username}</Typography>
								</Box>
								<Box>
									<Typography variant='caption' sx={{ fontSize: isMobileSize ? '0.45rem' : '0.5rem', color: 'gray' }}>
										{formatMessageTime(replyToMessage?.createdAt)}
									</Typography>
								</Box>
							</Box>
							<Box sx={{ padding: isMobileSize ? '0.15rem' : '0.75rem', flex: 8, borderLeft: '0.09rem solid lightgray' }}>
								<Typography sx={{ fontSize: '0.8rem', lineHeight: '1.8', minHeight: '3.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
									{renderMessageWithEmojis(replyToMessage.text, '1.25rem', isMobileSize)}
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
									<Box sx={{ mt: 1 }}>
										<CustomAudioPlayer
											audioUrl={replyToMessage.audioUrl}
											title={`Reply to ${replyToMessage.userId?.username || 'User'}`}
											sx={{ maxWidth: '300px' }}
										/>
									</Box>
								)}
							</Box>
						</Box>

						<IconButton size='small' sx={{ position: 'absolute', top: '0.2rem', right: '0.2rem' }} onClick={() => setReplyToMessage(null)}>
							<Cancel fontSize='small' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }} />
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
								top: isMobileSize ? '-2rem' : '-3rem',
								right: !imgUrl && isMobileSize ? '-2rem' : imgUrl && isMobileSize ? '2rem' : imgUrl ? '10rem' : '1rem',
								width: '10rem',
							}}>
							<CustomAudioPlayer
								audioUrl={audioUrl}
								title='Recording Preview'
								sx={{
									'maxWidth': '100%',
									'padding': '8px',
									'& .MuiBox-root': {
										fontSize: '0.75rem',
									},
								}}
							/>
							<Tooltip title='Remove Recording' placement='top' arrow>
								<IconButton size='small' onClick={() => setAudioUrl('')} sx={{ ':hover': { backgroundColor: 'transparent' } }}>
									<Cancel sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem' }} />
								</IconButton>
							</Tooltip>
						</Box>
					)}

					{imgUrl && (
						<Box
							sx={{
								display: 'flex',
								position: 'absolute',
								top: isMobileSize ? '-3.25rem' : '-4.25rem',
								right: isMobileSize ? '-2rem' : '1rem',
								maxHeight: '4rem',
							}}>
							<img src={imgUrl} alt='Preview' style={{ maxHeight: isMobileSize ? '3rem' : '4rem', objectFit: 'contain', borderRadius: '0.25rem' }} />
							<Tooltip title='Remove Image' placement='top' arrow>
								<IconButton size='small' onClick={() => setImgUrl('')} sx={{ ':hover': { backgroundColor: 'transparent' } }}>
									<Cancel sx={{ fontSize: '1rem' }} />
								</IconButton>
							</Tooltip>
						</Box>
					)}
				</Box>
				{showUserSearch && (
					<Box
						sx={{
							position: 'absolute',
							bottom: isMobileSize ? '5.5rem' : '7.15rem',
							left: isVerySmallScreen ? '2.5%' : isMobileSize ? '5%' : '11%',
							backgroundColor: '#fff',
							borderRadius: '0.25rem',
							boxShadow: '0 0.1rem 0.4rem rgba(0,0,0,0.3)',
							maxHeight: '15rem',
							minHeight: '10rem',
							overflowY: 'auto',
							zIndex: 10,
							width: isVerySmallScreen ? '95%' : isMobileSize ? '60%' : '40%',
						}}>
						<CommunityUserSearchSelect
							topicId={topicId || ''}
							value={userSearchValue}
							onChange={setUserSearchValue}
							onSelect={handleUserSelection}
							onReset={() => {
								setUserSearchValue('');
								// Remove the text after @ symbol from currentMessage
								const currentMessageArray = currentMessage.split(/[@]\w*$/);
								setCurrentMessage(currentMessageArray[0]);
								setShowUserSearch(false);
							}}
							onSearchChange={(searchValue) => {
								// Update the text after @ symbol in currentMessage
								const currentMessageArray = currentMessage.split(/[@]\w*$/);
								setCurrentMessage(`${currentMessageArray[0]}@${searchValue}`);
							}}
							currentUserId={user?.firebaseUserId}
							excludeUsernames={getAlreadyMentionedUsernames()}
							placeholder='Search users to mention...'
							sx={{ width: '100%' }}
							listSx={{
								margin: '0',
								width: '100%',
							}}
						/>
					</Box>
				)}

				<CustomTextField
					multiline
					rows={isMobileSize ? 2 : 3}
					value={currentMessage}
					required={false}
					disabled={isTopicLocked}
					onChange={handleInputChange}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault();
							if (!isSending && currentMessage.trim()) {
								sendMessage();
							}
						}
					}}
					placeholder={
						isTopicLocked
							? 'You cannot send a message since topic is locked'
							: hasAdminAccess
								? 'You can use @everyone to mention all users, @ to mention specific users'
								: 'You can use @ to mention specific users'
					}
					sx={{
						width: isVerySmallScreen ? '95%' : isMobileSize ? '90%' : '78%',
						border: replyToMessage ? 'none' : 'inherit',
						position: 'relative',
					}}
					InputProps={{
						endAdornment: (
							<InputAdornment position='end'>
								<IconButton
									onClick={() => setShowPicker(!showPicker)}
									disabled={isTopicLocked}
									edge='end'
									sx={{
										'mr': isMobileSize ? '-0.5rem' : '-0.25rem',
										':hover': {
											backgroundColor: 'transparent',
										},
									}}>
									<InsertEmoticon
										color={showPicker ? 'success' : 'disabled'}
										fontSize='small'
										sx={{ fontSize: isMobileSize ? '0.95rem' : undefined }}
									/>
								</IconButton>

								<Tooltip title={audioUrl ? 'Update Audio' : 'Upload Audio'} placement='top' arrow>
									<IconButton
										onClick={() => setUploadAudioDialogOpen(true)}
										disabled={isTopicLocked}
										sx={{
											':hover': {
												backgroundColor: 'transparent',
											},
										}}>
										<Mic
											fontSize='small'
											color={audioUrl ? 'success' : 'inherit'}
											sx={{ fontSize: isMobileSize ? '0.95rem' : undefined, mr: isMobileSize ? '-0.5rem' : '-0.25rem' }}
										/>
									</IconButton>
								</Tooltip>
								<CustomDialog openModal={uploadAudioDialogOpen} closeModal={() => setUploadAudioDialogOpen(false)} maxWidth='sm'>
									<DialogContent>
										<Typography
											variant='body2'
											sx={{
												mb: '2rem',
												textAlign: 'center',
												color: 'gray',
												padding: '0 1rem',
												fontSize: isMobileSize ? '0.75rem' : '0.85rem',
												lineHeight: 1.6,
											}}>
											You can add a single audio recording per message and it will be displayed at the bottom of the message
										</Typography>

										{!audioUrl && getRemainingAudioUploads() > 0 ? (
											<AudioRecorder
												uploadAudio={uploadAudio}
												isAudioUploading={isAudioUploading}
												maxRecordTime={60000}
												fromCreateCommunityTopic={true}
												audioUploadAttempts={audioUploadAttempts}
												maxSessionAttempts={MAX_SESSION_ATTEMPTS}
												onAudioUploadAttempt={() => setAudioUploadAttempts((prev) => prev + 1)}
												recorderTitleDescription={
													getRemainingAudioUploads() <= 0
														? '(Daily limit reached. Resets everyday)'
														: getRemainingAudioUploads() <= 5
															? '(' + getRemainingAudioUploads() + ' of ' + getAudioLimit() + ' audio uploads remaining today)'
															: ''
												}
											/>
										) : (
											<Box sx={{ display: 'flex', alignItems: 'center', mb: isMobileSize ? '1rem' : '2rem' }}>
												{getRemainingAudioUploads() > 0 && (
													<>
														<Box sx={{ flex: 9 }}>
															<audio
																src={audioUrl}
																controls
																style={{
																	marginTop: '1rem',
																	boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
																	borderRadius: '0.35rem',
																	width: '100%',
																	height: isMobileSize ? '1.75rem' : '2rem',
																}}
															/>
														</Box>
														<Box sx={{ flex: 1, margin: isMobileSize ? '0.75rem -0.5rem 0 1.5rem' : '0.75rem 0 0 1.5rem' }}>
															<CustomSubmitButton
																sx={{ borderRadius: '0.35rem', padding: isMobileSize ? '0.1rem' : undefined }}
																onClick={() => {
																	setAudioUrl('');
																}}>
																Remove
															</CustomSubmitButton>
														</Box>
													</>
												)}
											</Box>
										)}
									</DialogContent>
									<CustomCancelButton
										onClick={() => {
											setUploadAudioDialogOpen(false);
										}}
										sx={{
											margin: isMobileSize ? '0 1rem 1rem 0' : '0 1.5rem 1.5rem 0',
											width: '8%',
											alignSelf: 'flex-end',
											padding: 0,
											fontSize: isMobileSize ? '0.7rem' : undefined,
										}}>
										Close
									</CustomCancelButton>
								</CustomDialog>

								<Tooltip title={imgUrl ? 'Update Image' : 'Upload Image'} placement='top' arrow>
									<IconButton
										onClick={() => setUploadImgDialogOpen(true)}
										disabled={isTopicLocked}
										sx={{
											':hover': {
												backgroundColor: 'transparent',
											},
										}}>
										<Image
											fontSize='small'
											color={imgUrl ? 'success' : 'inherit'}
											sx={{ fontSize: isMobileSize ? '0.95rem' : undefined, mr: isMobileSize ? '-0.5rem' : '-0.25rem' }}
										/>
									</IconButton>
								</Tooltip>
								<CustomDialog openModal={uploadImgDialogOpen} closeModal={() => setUploadImgDialogOpen(false)} maxWidth='sm'>
									<DialogContent>
										<Typography
											sx={{
												mb: '2rem',
												textAlign: 'center',
												color: 'gray',
												fontSize: isMobileSize ? '0.75rem' : '0.85rem',
												lineHeight: 1.6,
												padding: '0 1rem',
											}}>
											You can add a single image per message and it will be displayed at the bottom of the message
										</Typography>

										<HandleImageUploadURL
											onImageUploadLogic={(url) => setImgUrl(url)}
											onChangeImgUrl={(e) => setImgUrl(e.target.value)}
											imageUrlValue={imgUrl}
											imageFolderName='TopicMessageImages'
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
										{imgUrl && <ImageThumbnail imgSource={imgUrl} removeImage={() => setImgUrl('')} />}
									</DialogContent>
									<CustomCancelButton
										onClick={() => {
											setUploadImgDialogOpen(false);
										}}
										sx={{
											margin: isMobileSize ? '0 1rem 1rem 0' : '0 1.5rem 1.5rem 0',
											width: '8%',
											alignSelf: 'flex-end',
											padding: 0,
											fontSize: isMobileSize ? '0.7rem' : undefined,
										}}>
										Close
									</CustomCancelButton>
								</CustomDialog>

								<IconButton
									disabled={isTopicLocked || isSending || (!!!currentMessage && !imgUrl && !audioUrl)}
									sx={{
										':hover': {
											backgroundColor: 'transparent',
										},
									}}
									onClick={sendMessage}>
									<Send fontSize='small' sx={{ fontSize: isMobileSize ? '0.95rem' : undefined }} />
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
							bottom: isVerySmallScreen ? '-5.5rem' : isRotated ? '-7rem' : isRotatedMedium ? '-5.5rem' : isSmallScreen ? '0.5rem' : '1rem',
							right: isVerySmallScreen ? '2.25rem' : isRotated ? '3rem' : isRotatedMedium ? '4.5rem' : isSmallScreen ? '8rem' : '20rem',
							zIndex: 10,
							transform: isVerySmallScreen
								? 'scale(0.55)'
								: isRotated
									? 'scale(0.5)'
									: isRotatedMedium
										? 'scale(0.55)'
										: isSmallScreen
											? 'scale(0.8)'
											: 'scale(1)',
						}}>
						<Picker data={data} onEmojiSelect={handleEmojiSelect} theme='dark' />
					</Box>
				)}
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'flex-end',
						alignItems: 'center',
						width: isVerySmallScreen ? '95%' : isMobileSize ? '90%' : '78%',
						mb: '0.5rem',
					}}>
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.65rem' : '0.75rem' }}>
						{currentMessage.length}/1500 Characters
					</Typography>
				</Box>
			</Box>
			<Snackbar
				open={isUrlErrorOpen}
				autoHideDuration={3500}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				onClose={() => setIsUrlErrorOpen(false)}>
				<Alert severity='error' variant='filled' sx={{ width: isMobileSize ? '60%' : '100%', fontSize: isMobileSize ? '0.75rem' : undefined }}>
					{urlErrorMessage}
				</Alert>
			</Snackbar>
		</DashboardPagesLayout>
	);
};

export default CommunityTopicPage;
