import { Alert, Box, Dialog, IconButton, InputAdornment, Snackbar, Tooltip, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import { AddBox, Cancel, Image, InsertEmoticon, Person, PersonOff, Reply, Search } from '@mui/icons-material';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import { useContext, useEffect, useRef, useState } from 'react';
import { generateUniqueId } from '../utils/uniqueIdGenerator';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import {
	addDoc,
	updateDoc,
	setDoc,
	serverTimestamp,
	collection,
	query,
	orderBy,
	onSnapshot,
	doc,
	getDoc,
	where,
	arrayUnion,
	arrayRemove,
	deleteField,
} from 'firebase/firestore';
import { db } from '../firebase';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import emojiRegex from 'emoji-regex';
import useImageUpload from '../hooks/useImageUpload'; // Import the custom hook
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import { User } from '../interfaces/user';
import axios from 'axios';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import theme from '../themes';
import { debounce } from 'lodash';

export interface Message {
	id: string;
	senderId: string;
	receiverId?: string;
	text: string;
	timestamp: Date;
	isRead: boolean;
	imageUrl?: string;
	videoUrl?: string;
	replyTo: string; // This stores the ID of the message being replied to
	quotedText: string; // Optional: Store a snippet of the original message being replied to
}

export interface ParticipantData {
	firebaseUserId: string;
	username: string;
	imageUrl: string;
}

export interface Chat {
	chatId: string;
	participants: ParticipantData[];
	lastMessage: {
		text: string;
		timestamp: Date | null;
	};
	isDeletedBy?: string[];
	blockedUsers?: {
		[blockedUserId: string]: {
			blockedSince: Date | null; // The timestamp when the user was blocked
			blockedUntil: Date | null; // The timestamp when the user was unblocked (or null if still blocked)
		};
	};
}

const Messages = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { user } = useContext(UserAuthContext);
	const { orgId } = useContext(OrganisationContext);

	const [messages, setMessages] = useState<Message[]>([]);
	const [showPicker, setShowPicker] = useState<boolean>(false);
	const [currentMessage, setCurrentMessage] = useState<string>('');
	const [isLargeImgMessageOpen, setIsLargeImgMessageOpen] = useState<boolean>(false);

	const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
	const [searchValue, setSearchValue] = useState<string>('');
	const [searchChatValue, setSearchChatValue] = useState<string>('');

	const [replyToMessage, setReplyToMessage] = useState<Message | null>(null); // To store the message being replied to

	const [chatList, setChatList] = useState<Chat[]>([]); // Storing chats with participants and last message
	const [filteredChatList, setFilteredChatList] = useState<Chat[]>([]);
	const [activeChat, setActiveChat] = useState<Chat | null>(null); // Active chat
	const [activeChatId, setActiveChatId] = useState<string>('');
	const [addUserModalOpen, setAddUserModalOpen] = useState<boolean>(false);

	const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

	const [zoomedImage, setZoomedImage] = useState<string | undefined>('');

	const vertical = 'top';
	const horizontal = 'center';

	const isUserCurrentlyBlocked = (userId: string, chatBlockedUsers: any): boolean => {
		const blockedUser = chatBlockedUsers?.[userId];
		if (!blockedUser) return false;

		const { blockedSince, blockedUntil } = blockedUser;
		return blockedSince && (!blockedUntil || new Date(blockedUntil) > new Date());
	};

	// Check if the current user is blocked by another user
	const isBlockedUser: boolean = isUserCurrentlyBlocked(user?.firebaseUserId!, activeChat?.blockedUsers);

	// Check if the current user has blocked someone else
	const isBlockingUser: boolean | undefined = activeChat?.participants?.some((participant) => {
		if (participant.firebaseUserId === user?.firebaseUserId) return false; // Skip the current user
		return isUserCurrentlyBlocked(participant.firebaseUserId, activeChat?.blockedUsers);
	});

	const { imageUpload, imagePreview, handleImageChange, handleImageUpload, resetImageUpload, isUploading, isImgSizeLarge } = useImageUpload();

	const handleEmojiSelect = (emoji: any) => {
		setCurrentMessage((prevMessage) => prevMessage + emoji.native);
		setShowPicker(false);
	};

	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

	const scrollToOriginalMessage = (messageId: string) => {
		const originalMessageElement = messageRefs.current[messageId]; // Get the ref for the original message

		if (originalMessageElement) {
			// Scroll to the message and center it in view
			originalMessageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

			// Add a highlight class to the message to temporarily change background color
			originalMessageElement.classList.add('highlighted-message');

			// Remove the highlight after 2 seconds
			setTimeout(() => {
				originalMessageElement.classList.remove('highlighted-message');
			}, 2500); // Highlight for 2 seconds
		}
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	useEffect(() => {
		if (isImgSizeLarge) setIsLargeImgMessageOpen(true);
	}, [isImgSizeLarge]);

	// Cache only ParticipantData (minimal details)
	const participantCache = JSON.parse(localStorage.getItem('participantCache') || '{}');

	// Function to fetch and cache only ParticipantData
	const fetchParticipantData = async (firebaseUserId: string): Promise<ParticipantData | null> => {
		// Check if the participant data is already cached
		if (participantCache[firebaseUserId]) {
			return participantCache[firebaseUserId];
		}

		try {
			// Fetch user details from your MongoDB API
			const response = await axios.get(`${base_url}/users/${firebaseUserId}`);
			const userData = response.data.data[0]; // Assume API returns data in this format

			// Extract and cache only ParticipantData (minimal info)
			const participantData: ParticipantData = {
				firebaseUserId: userData.firebaseUserId || '',
				username: userData.username || '',
				imageUrl: userData.imageUrl || '',
			};

			// Cache participant data in localStorage
			participantCache[firebaseUserId] = participantData;
			localStorage.setItem('participantCache', JSON.stringify(participantCache));

			return participantData;
		} catch (error) {
			console.error('Error fetching participant data:', error);
			return null;
		}
	};

	// Fetch chats where the user is a participant, ordered by the last message timestamp
	useEffect(() => {
		if (!user?.firebaseUserId) return;

		const chatsRef = collection(db, 'chats');
		const q = query(chatsRef, where('participants', 'array-contains', user?.firebaseUserId), orderBy('lastMessage.timestamp', 'desc'));

		const unsubscribe = onSnapshot(q, async (querySnapshot) => {
			const chatsArray: Chat[] = [];

			for (const doc of querySnapshot.docs) {
				const data = doc.data();
				const lastMessage = data.lastMessage || { text: 'No messages yet', timestamp: null };

				// Only include chats the user hasn't deleted
				if (data.isDeletedBy?.includes(user.firebaseUserId)) {
					continue;
				}

				// Fetch participants
				const participantsDetails: User[] = await Promise.all(
					data.participants.map(async (participantId: string) => {
						const user = await fetchParticipantData(participantId);
						return { ...user, participantId };
					})
				);

				chatsArray.push({
					chatId: doc.id,
					participants: participantsDetails
						.filter((p): p is User => p !== null)
						.map((p) => ({
							firebaseUserId: p.firebaseUserId,
							username: p.username,
							imageUrl: p.imageUrl,
						})),
					lastMessage: lastMessage,
					blockedUsers: data.blockedUsers,
				});
			}

			// Store chats in localStorage and update state
			localStorage.setItem('chatList', JSON.stringify(chatsArray));
			setChatList(chatsArray);
			setFilteredChatList(chatsArray);
		});

		return () => unsubscribe();
	}, [user?.firebaseUserId]);

	const filterBlockedMessages = (messagesArray: Message[], activeChat: Chat) => {
		return messagesArray.filter((msg) => {
			const blockInfo = activeChat?.blockedUsers?.[msg.senderId];
			const messageTimestamp = new Date(msg.timestamp);

			// If the message sender is blocked and the message was sent during the blocked period, filter it out permanently.
			if (blockInfo && blockInfo.blockedSince) {
				const blockedSince = new Date(blockInfo.blockedSince);
				const blockedUntil = blockInfo.blockedUntil ? new Date(blockInfo.blockedUntil) : null;

				// Message is permanently hidden if it was sent during the blocked period.
				if (messageTimestamp >= blockedSince && (!blockedUntil || messageTimestamp <= blockedUntil)) {
					return false; // Do not show the message
				}
			}
			return true;
		});
	};

	// Use the function in the onSnapshot listener
	useEffect(() => {
		if (!activeChat || !user?.firebaseUserId) return;

		const messagesRef = collection(db, 'chats', activeChat.chatId, 'messages');
		const q = query(messagesRef, orderBy('timestamp', 'asc'));

		const unsubscribe = onSnapshot(q, async (querySnapshot) => {
			const messagesArray: Message[] = [];

			querySnapshot.forEach((doc) => {
				const data = doc.data();
				const messageTimestamp = data.timestamp?.toDate() || new Date();

				messagesArray.push({
					id: doc.id,
					senderId: data.senderId || '',
					receiverId: data.receiverId || '',
					text: data.text || '',
					timestamp: messageTimestamp,
					isRead: data.isRead || false,
					imageUrl: data.imageUrl || '',
					videoUrl: data.videoUrl || '',
					replyTo: data.replyTo || '',
					quotedText: data.quotedText || '',
				});
			});

			// Apply the filter to block messages from blocked users
			const filteredMessages = filterBlockedMessages(messagesArray, activeChat);

			// Restore chat if the user had deleted it and a new message is received
			if (activeChat.isDeletedBy?.includes(user.firebaseUserId)) {
				const chatRef = doc(db, 'chats', activeChat.chatId);
				await updateDoc(chatRef, {
					isDeletedBy: arrayRemove(user.firebaseUserId),
				});
			}

			setMessages(filteredMessages);
		});

		return () => unsubscribe();
	}, [activeChat, user?.firebaseUserId]);

	useEffect(() => {
		const savedActiveChatId = localStorage.getItem('activeChatId');

		if (savedActiveChatId && chatList.length > 0) {
			const chat = chatList.find((chat) => chat.chatId === savedActiveChatId);
			if (chat) {
				setActiveChat(chat);
			}
		}

		setFilteredChatList(chatList);
	}, [chatList]);

	useEffect(() => {
		const savedChatList = localStorage.getItem('chatList');
		const savedActiveChatId = localStorage.getItem('activeChatId');

		if (savedChatList) {
			// Restore the chat list from localStorage
			setChatList(JSON.parse(savedChatList));
		}

		if (savedActiveChatId) {
			// Restore the active chat ID from localStorage
			setActiveChatId(savedActiveChatId);
		}
	}, []);

	const userCache: { [firebaseUserId: string]: User | null } = {}; // A cache for user details

	const startChatIfNotExists = async (selectedUser: User) => {
		const chatId = [user?.firebaseUserId, selectedUser.firebaseUserId].sort().join('&');
		const chatRef = doc(db, 'chats', chatId);

		const chatDoc = await getDoc(chatRef);

		if (chatDoc.exists()) {
			const chatData = chatDoc.data();

			// Check if the chat is marked as deleted by the current user
			if (chatData.isDeletedBy?.includes(user?.firebaseUserId)) {
				// Restore the chat by removing the current user from `isDeletedBy`
				await updateDoc(chatRef, {
					isDeletedBy: arrayRemove(user?.firebaseUserId),
				});
			}

			// If the user is cached, use the cached version instead of refetching
			if (!userCache[selectedUser.firebaseUserId]) {
				userCache[selectedUser.firebaseUserId] = selectedUser;
			}

			// Update the chat list and set the chat as active
			const restoredChat: Chat = {
				chatId: chatId,
				participants: [
					{ firebaseUserId: user?.firebaseUserId!, imageUrl: user?.imageUrl!, username: user?.username! },
					{ firebaseUserId: selectedUser.firebaseUserId, imageUrl: selectedUser.imageUrl, username: selectedUser.username },
				],
				lastMessage: chatData.lastMessage || { text: 'No messages yet', timestamp: null },
				blockedUsers: chatData.blockedUsers || [],
			};

			setChatList((prev) => {
				const updatedChatList = prev.find((chat) => chat.chatId === chatId) ? prev : [restoredChat, ...prev];
				setFilteredChatList(updatedChatList);
				return updatedChatList;
			});

			setActiveChat(restoredChat);
			setActiveChatId(chatId);
			localStorage.setItem('activeChatId', chatId);
		} else {
			// If the chat does not exist, add it to the chatList/UI but don't create it in Firestore yet
			const newChat: Chat = {
				chatId: chatId,
				participants: [
					{ firebaseUserId: user?.firebaseUserId!, imageUrl: user?.imageUrl!, username: user?.username! },
					{ firebaseUserId: selectedUser.firebaseUserId, imageUrl: selectedUser.imageUrl, username: selectedUser.username },
				],
				lastMessage: { text: 'No messages yet', timestamp: null }, // No message yet
				blockedUsers: {},
			};

			// Add the new chat to the UI lists
			setChatList((prev) => {
				const updatedChatList = prev.find((chat) => chat.chatId === chatId) ? prev : [newChat, ...prev];
				setFilteredChatList(updatedChatList);
				return updatedChatList;
			});

			// Set this as the active chat in the UI
			setActiveChat(newChat);
			setActiveChatId(chatId);
			localStorage.setItem('activeChatId', chatId);
		}
	};

	const handleSetActiveChat = (chat: Chat) => {
		setActiveChat(chat);
		localStorage.setItem('activeChatId', chat.chatId);
		setActiveChatId(chat.chatId);
	};

	const handleReplyMessage = (message: Message) => {
		setReplyToMessage(message);
	};

	const handleSendMessage = async () => {
		if ((!currentMessage.trim() && !imageUpload) || !activeChat) return;

		const chatId = activeChat.chatId;
		const chatRef = doc(db, 'chats', chatId);
		const messageRef = collection(db, 'chats', chatId, 'messages');

		try {
			// If the chat doesn't exist yet, create it when sending the first message
			const chatDoc = await getDoc(chatRef);
			if (!chatDoc.exists()) {
				// Create the chat if it doesn't exist
				await setDoc(chatRef, {
					participants: activeChat.participants.map((p) => p.firebaseUserId),
					lastMessage: {
						text: currentMessage || 'Image sent',
						timestamp: serverTimestamp(),
					},
					isDeletedBy: [], // Initialize the isDeletedBy field as an empty array
					blockedUsers: [],
				});
			} else {
				// If the chat exists, ensure both participants are removed from the isDeletedBy array (if they are present)
				await updateDoc(chatRef, {
					isDeletedBy: arrayRemove(...activeChat.participants.map((p) => p.firebaseUserId)), // Remove both participants if they are in isDeletedBy
				});
			}

			// Proceed with message sending
			let imageUrl = '';
			if (imageUpload) {
				await handleImageUpload('messages', (url: string) => {
					imageUrl = url;
				});
			}

			const newMessage: Message = {
				id: generateUniqueId(''),
				senderId: user?.firebaseUserId!,
				receiverId: activeChat.participants[0].firebaseUserId,
				text: currentMessage || '',
				imageUrl: imageUrl || '',
				timestamp: new Date(),
				isRead: false,
				replyTo: replyToMessage?.id || '', // Reference the message being replied to
				quotedText: replyToMessage?.text || '', // Include the text of the replied message
			};

			// Add the message to Firestore
			await addDoc(messageRef, {
				...newMessage,
				timestamp: serverTimestamp(),
			});

			// Update the lastMessage field in the chat document
			await updateDoc(chatRef, {
				lastMessage: {
					text: newMessage.text || 'Image sent',
					timestamp: serverTimestamp(),
				},
			});

			// Clear the reply context after sending the message
			setReplyToMessage(null);
			setCurrentMessage('');
			resetImageUpload();
		} catch (error) {
			console.error('Error sending message: ', error);
		}
	};

	const filterUsers = async () => {
		if (!searchValue.trim()) {
			setFilteredUsers([]);
			return;
		}

		try {
			const response = await axios.get(`${base_url}/users/search`, {
				params: { searchQuery: searchValue, orgId },
			});

			setFilteredUsers(response.data.data);
		} catch (error) {
			console.log(error);
		}
	};

	const handleUserSelection = async (selectedUser: User) => {
		await startChatIfNotExists(selectedUser); // Ensure the chat is started or exists
		setAddUserModalOpen(false); // Close modal
	};

	// Function to render message text with emojis and custom font sizes
	const renderMessageWithEmojis = (message: string) => {
		const regex = emojiRegex();
		const parts = message.split(regex); // Split the message based on where the emojis are
		const emojis = [...message.matchAll(regex)]; // Match all emojis

		return parts.reduce((acc: any[], part: string, index: number) => {
			if (part) {
				acc.push(
					<span key={`text-${index}`} style={{ fontSize: '0.85rem', verticalAlign: 'middle' }}>
						{part}
					</span>
				);
			}

			if (emojis[index]) {
				acc.push(
					<span key={`emoji-${index}`} style={{ fontSize: '1.75rem', verticalAlign: 'middle' }}>
						{emojis[index][0]}
					</span>
				);
			}

			return acc;
		}, []);
	};

	const handleDeleteChat = async (chatId: string) => {
		try {
			// Try updating Firestore directly
			const chatRef = doc(db, 'chats', chatId);
			await updateDoc(chatRef, {
				isDeletedBy: arrayUnion(user?.firebaseUserId),
			});
		} catch (error) {
			// Log Firestore error (e.g., if the chat doesn't exist in Firestore)
			console.error('Error updating Firestore:', error);
		}

		// Update the local state, regardless of Firestore operation success or failure
		setFilteredChatList((prevChatList) => {
			const filteredChatListAfterDelete = prevChatList.filter((chat) => chat.chatId !== chatId);
			localStorage.setItem('chatList', JSON.stringify(filteredChatListAfterDelete));
			return filteredChatListAfterDelete;
		});

		setChatList((prevChatList) => {
			const filteredChatListAfterDelete = prevChatList.filter((chat) => chat.chatId !== chatId);
			localStorage.setItem('chatList', JSON.stringify(filteredChatListAfterDelete));
			return filteredChatListAfterDelete;
		});

		// Reset messages and active chat if necessary
		setMessages([]);
		setReplyToMessage(null);

		if (activeChatId === chatId) {
			setActiveChat(null);
			setActiveChatId('');
			localStorage.setItem('activeChatId', '');
		}
	};

	const handleBlockUnblockUser = async (firebaseUserId: string) => {
		const chatId = activeChat?.chatId;
		if (!chatId) return;

		const chatRef = doc(db, 'chats', chatId);
		const chatDoc = await getDoc(chatRef);

		if (chatDoc.exists()) {
			const chatData = chatDoc.data();
			const isBlocked = chatData.blockedUsers?.[firebaseUserId];

			try {
				if (isBlocked) {
					// Unblock user by completely removing the block entry
					setBlockedUsers((prevList) => prevList.filter((userId) => userId !== firebaseUserId));
					await updateDoc(chatRef, {
						[`blockedUsers.${firebaseUserId}`]: deleteField(), // Remove block information entirely
					});
				} else {
					// Block user by creating a new block entry
					setBlockedUsers((prevList) => [...prevList, firebaseUserId]);
					await updateDoc(chatRef, {
						[`blockedUsers.${firebaseUserId}`]: {
							blockedSince: new Date(),
							blockedUntil: null,
						},
					});
				}
			} catch (error) {
				console.error('Error updating block status: ', error);
			}
		}
	};

	const debouncedFilterChats = debounce((searchValue: string) => {
		if (searchValue) {
			const filteredList = chatList.filter((chat: Chat) =>
				chat.participants.some(
					(participant: ParticipantData) => participant.username.includes(searchValue) && participant.firebaseUserId !== user?.firebaseUserId
				)
			);
			setFilteredChatList(filteredList);
		} else {
			setFilteredChatList(chatList);
		}
	}, 250);

	const handleFilterChats = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newSearchValue = e.target.value.trim(); // Capture and trim the new search value
		setSearchChatValue(newSearchValue); // Update the search state
		debouncedFilterChats(newSearchValue); // Call the debounced function with the new value
	};

	return (
		<DashboardPagesLayout pageName='Messages' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ display: 'flex', width: '100%', height: 'calc(100vh - 4rem)' }}>
				<Box sx={{ display: 'flex', flexDirection: 'column', flex: 3, borderRight: '0.04rem solid gray', padding: '0 0.5rem 0 1rem' }}>
					<Box sx={{ display: 'flex', margin: '1rem auto 0 auto', width: '100%' }}>
						<Box sx={{ flex: 9 }}>
							<CustomTextField
								InputProps={{
									endAdornment: (
										<InputAdornment position='end'>
											<Search />
										</InputAdornment>
									),
								}}
								value={searchChatValue}
								onChange={handleFilterChats}
							/>
						</Box>
						<Box sx={{ flex: 1 }}>
							<IconButton
								sx={{ ':hover': { backgroundColor: 'transparent' } }}
								onClick={() => {
									setAddUserModalOpen(true);
									setFilteredUsers([]);
									setSearchValue('');
								}}>
								<AddBox />
							</IconButton>
						</Box>
					</Box>

					<Box sx={{ display: 'flex', flexDirection: 'column', marginTop: '1rem' }}>
						{filteredChatList?.map((chat) => {
							const otherParticipant = chat.participants.find((participant) => participant.firebaseUserId !== user?.firebaseUserId);

							if (!otherParticipant) return null;

							return (
								<Box
									key={`${chat.chatId}-${chat.participants[0].firebaseUserId}`}
									sx={{
										display: 'flex',
										borderRadius: '0.25rem',
										borderBottom: '0.04rem solid lightgray',
										backgroundColor: chat.chatId === activeChatId ? theme.bgColor?.primary : null,
										':hover': {
											backgroundColor: chat.chatId !== activeChatId ? theme.bgColor?.lessonInProgress : null,
											color: '#fff',
											'& .active-hovered-chat-text-color': {
												color: '#fff',
											},
										},
									}}>
									<Box
										sx={{
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'start',
											padding: '0.5rem',
											cursor: 'pointer',
											flex: 5,
										}}
										onClick={() => {
											handleSetActiveChat(chat);
										}}>
										<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
											<Box sx={{ borderRadius: '100%', marginRight: '1rem' }}>
												<img
													src={otherParticipant.imageUrl}
													alt='profile_img'
													style={{
														height: '2.5rem',
														width: '2.5rem',
														borderRadius: '100%',
														border: 'solid lightgray 0.1rem',
													}}
												/>
											</Box>
											<Box>
												<Typography
													variant='body2'
													className='active-hovered-chat-text-color'
													sx={{ color: chat.chatId === activeChatId ? theme.textColor?.common.main : null }}>
													{otherParticipant.username}
												</Typography>
											</Box>
										</Box>
										<Box
											sx={{
												marginTop: '0.2rem',
											}}>
											<Typography
												variant='caption'
												sx={{ color: chat.chatId === activeChatId ? theme.textColor?.common.main : 'gray' }}
												className='active-hovered-chat-text-color'>
												{chat.lastMessage.text.length > 20 ? `${chat.lastMessage.text.substring(0, 20)}...` : chat.lastMessage.text}
											</Typography>
										</Box>
									</Box>
									<Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
										<Tooltip title='Delete Chat' placement='top'>
											<IconButton onClick={() => handleDeleteChat(chat.chatId)}>
												<Cancel
													className='active-hovered-chat-text-color'
													fontSize='small'
													sx={{
														fontSize: '1.1rem',
														color: chat.chatId === activeChatId ? theme.textColor?.common.main : theme.palette.primary.main,
													}}
												/>
											</IconButton>
										</Tooltip>
									</Box>
								</Box>
							);
						})}
					</Box>
				</Box>

				{/* Message Display */}
				<Box sx={{ display: 'flex', flexDirection: 'column', flex: 10, height: '100%' }}>
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							borderBottom: '0.04rem solid gray',
							width: '100%',
							height: '4rem',
							flexShrink: 0,
						}}>
						{activeChat && (
							<Box sx={{ display: 'flex', alignItems: 'center', margin: '0 1.5rem', width: '100%' }}>
								{activeChat.participants
									.filter((participant) => participant.firebaseUserId !== user?.firebaseUserId)
									.map((otherParticipant) => (
										<Box
											key={otherParticipant.firebaseUserId}
											sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
											<Box sx={{ display: 'flex', alignItems: 'center' }}>
												<Box sx={{ borderRadius: '100%', marginRight: '1rem' }}>
													<img
														src={otherParticipant.imageUrl}
														alt='profile_img'
														style={{
															height: '3rem',
															width: '3rem',
															borderRadius: '100%',
															border: 'solid lightgray 0.1rem',
														}}
													/>
												</Box>
												<Box>
													<Typography variant='body2'>{otherParticipant.username}</Typography>
												</Box>
											</Box>
											<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
												<IconButton
													size='small'
													onClick={() => handleBlockUnblockUser(otherParticipant.firebaseUserId)}
													sx={{ ':hover': { backgroundColor: 'transparent' } }}>
													{blockedUsers.includes(otherParticipant.firebaseUserId) ? (
														<Tooltip title='Unblock User' placement='top'>
															<PersonOff color='error' />
														</Tooltip>
													) : (
														<Tooltip title='Block User' placement='top'>
															<Person color='success' />
														</Tooltip>
													)}
												</IconButton>

												{isBlockingUser && <Typography sx={{ fontSize: '0.75rem' }}>You have blocked this user</Typography>}
											</Box>
										</Box>
									))}
							</Box>
						)}
					</Box>

					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							flexGrow: 1,
							overflowY: 'auto',
							padding: '1rem',
							backgroundImage: `linear-gradient(rgba(80, 144, 166, 0.9), rgba(103, 180, 207, 0.95)), url('https://img.freepik.com/premium-vector/dialogue-balloon-chat-bubble-icons-seamless-pattern-textile-pattern-wrapping-paper-linear-vector-print-fabric-seamless-background-wallpaper-backdrop-with-speak-bubbles-chat-message-frame_8071-58894.jpg?w=1060')`,
							backgroundRepeat: 'repeat',
							backgroundSize: 'contain',
							backgroundPosition: 'center',
							maxHeight: '70vh',
							position: 'relative',
						}}>
						{messages
							.filter((msg) => {
								const blockInfo = activeChat?.blockedUsers?.[msg.senderId]; // Get block info for the sender
								const messageTimestamp = new Date(msg.timestamp);

								// If the current user is the sender, show their own messages
								if (msg.senderId === user?.firebaseUserId) {
									return true;
								}

								// If the sender is blocked and the message was sent during the blocked period, hide it
								if (blockInfo && blockInfo.blockedSince) {
									const blockedSince = new Date(blockInfo.blockedSince);
									const blockedUntil = blockInfo.blockedUntil ? new Date(blockInfo.blockedUntil) : null;

									// Check if the message was sent after the block started and during the blocked period
									if (messageTimestamp >= blockedSince && (!blockedUntil || messageTimestamp <= blockedUntil)) {
										return false; // Filter out the message
									}
								}

								// Show messages sent before block or after unblock
								return true;
							})
							.map((msg) => (
								<Box
									key={msg.id}
									sx={{
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'flex-end',
										alignItems: 'center',
										width: '100%',
									}}>
									<Box
										ref={(el) => {
											messageRefs.current[msg.id] = el as HTMLDivElement | null;
										}}
										sx={{
											display: 'flex',
											flexDirection: msg.senderId === user?.firebaseUserId ? 'row-reverse' : 'row',
											justifyContent: 'flex-start',
											alignItems: 'center',
											width: '100%',
											borderRadius: '0.35rem',
										}}>
										<Box
											sx={{
												display: 'flex',
												flexDirection: 'column',
												padding: '0.5rem 1rem',
												borderRadius: '0.75rem',
												margin: '0.5rem 0',
												transition: 'background-color 0.5s ease',
												backgroundColor: msg.senderId === user?.firebaseUserId ? '#DCF8C6' : '#FFF',
												alignSelf: msg.senderId === user?.firebaseUserId ? 'flex-end' : 'flex-start',
												maxWidth: '60%',
												minWidth: '15%',
												wordWrap: 'break-word',
												wordBreak: 'break-all',
											}}>
											{msg.replyTo && (
												<Box
													sx={{
														backgroundColor: '#f1f1f1',
														borderLeft: '0.25rem solid #aaa',
														padding: '0.5rem',
														marginBottom: '0.5rem',
														borderRadius: '0.25rem',
														cursor: 'pointer',
													}}
													onClick={() => scrollToOriginalMessage(msg.replyTo)}>
													<Typography sx={{ color: 'gray', fontSize: '0.75rem' }}>{msg.quotedText}</Typography>
												</Box>
											)}

											{msg.imageUrl ? (
												<img
													src={msg.imageUrl}
													alt='uploaded'
													style={{
														height: '6rem',
														maxHeight: '8rem',
														objectFit: 'contain',
														maxWidth: '100%',
														borderRadius: '0.35rem',
														cursor: 'pointer',
													}}
													onClick={() => setZoomedImage(msg.imageUrl)}
												/>
											) : (
												<Box sx={{ alignSelf: 'flex-start' }}>
													<Typography sx={{ fontSize: '0.85rem' }}>{renderMessageWithEmojis(msg.text)}</Typography>
												</Box>
											)}

											<Box sx={{ alignSelf: 'flex-end' }}>
												<Typography variant='caption' sx={{ fontSize: '0.65rem' }}>
													{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
												</Typography>
											</Box>
										</Box>

										<Box
											sx={{
												marginLeft: msg.senderId === user?.firebaseUserId ? '0' : '0.25rem',
												marginRight: msg.senderId === user?.firebaseUserId ? '0.25rem' : '0',
											}}>
											<Tooltip title='Reply' placement='top'>
												<IconButton size='small' onClick={() => handleReplyMessage(msg)} sx={{ color: '' }}>
													<Reply />
												</IconButton>
											</Tooltip>
										</Box>
									</Box>
								</Box>
							))}

						<div ref={messagesEndRef} />
					</Box>

					{zoomedImage && (
						<Dialog open={!!zoomedImage} onClose={() => setZoomedImage('')} maxWidth='sm'>
							<img src={zoomedImage} alt='Zoomed' style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'cover', borderRadius: '0.35rem' }} />
						</Dialog>
					)}

					{replyToMessage && activeChat && (
						<Box
							sx={{
								border: '0.01rem solid lightgray',
								padding: '0.75rem',
								position: 'relative',
							}}>
							<Typography variant='body2' sx={{ color: 'gray', mb: '0.35rem' }}>
								Replying to:
							</Typography>
							<Typography sx={{ fontSize: '0.8rem', lineHeight: '1.8' }}> {replyToMessage.text}</Typography>
							<IconButton size='small' sx={{ position: 'absolute', top: '0.2rem', right: '0.2rem' }} onClick={() => setReplyToMessage(null)}>
								<Cancel fontSize='small' />
							</IconButton>
						</Box>
					)}

					{/* Input Box */}
					<Box sx={{ display: 'flex', alignItems: 'center', borderTop: '0.04rem solid gray', padding: '1rem', flexShrink: 0, position: 'relative' }}>
						<input
							type='file'
							accept='image/*'
							onChange={(e) => {
								handleImageChange(e);
								setCurrentMessage('');
							}}
							style={{ display: 'none' }}
							id='image-upload'
							disabled={isUploading || isBlockedUser || isBlockingUser}
						/>
						<label htmlFor='image-upload'>
							<IconButton component='span' disabled={isUploading || isBlockedUser || isBlockingUser}>
								<Image />
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
										: 'Type a message...'
								}
								multiline
								rows={3}
								value={currentMessage}
								onChange={(e) => {
									if (imageUpload) {
										setCurrentMessage('');
									} else {
										setCurrentMessage(e.target.value);
									}
									resetImageUpload();
								}}
								InputProps={{
									sx: {
										padding: '0.5rem 1rem',
									},
									endAdornment: (
										<InputAdornment position='end'>
											<IconButton onClick={() => setShowPicker(!showPicker)} edge='end'>
												<InsertEmoticon color={showPicker ? 'success' : 'disabled'} />
											</IconButton>
										</InputAdornment>
									),
								}}
								sx={{ overflowY: 'auto' }}
								disabled={!!imageUpload || isBlockedUser || isBlockingUser}
							/>

							<Snackbar
								open={isLargeImgMessageOpen}
								autoHideDuration={3000}
								anchorOrigin={{ vertical, horizontal }}
								sx={{ mt: '5rem' }}
								onClose={() => {
									setIsLargeImgMessageOpen(false);
									resetImageUpload();
								}}>
								<Alert severity='error' variant='filled' sx={{ width: '100%' }}>
									Image size exceeds the limit of 1 MB
								</Alert>
							</Snackbar>

							{imagePreview && (
								<Box sx={{ display: 'flex', position: 'absolute', bottom: '1rem', left: '1rem', maxHeight: '5rem' }}>
									<img src={imagePreview} alt='Preview' style={{ maxHeight: '5rem', objectFit: 'contain' }} />
									<Tooltip title='Remove Preview' placement='right'>
										<IconButton size='small' onClick={resetImageUpload} sx={{ ':hover': { backgroundColor: 'transparent' } }}>
											<Cancel fontSize='small' />
										</IconButton>
									</Tooltip>
								</Box>
							)}
						</Box>

						{showPicker && (
							<Box sx={{ position: 'absolute', bottom: '6rem', right: '3rem', zIndex: 10 }}>
								<Picker data={data} onEmojiSelect={handleEmojiSelect} theme='dark' />
							</Box>
						)}

						<CustomSubmitButton
							sx={{ margin: '0 0 1rem 1rem' }}
							size='small'
							onClick={handleSendMessage}
							disabled={isUploading || isBlockedUser || isBlockingUser}>
							Send
						</CustomSubmitButton>
					</Box>
				</Box>
			</Box>

			{/* Custom Dialog for User Search */}
			<CustomDialog
				openModal={addUserModalOpen}
				closeModal={() => {
					setAddUserModalOpen(false);
					setSearchValue('');
				}}
				title='Find User'
				content='Search users by username or email address to start a chat'
				maxWidth='sm'>
				<Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mb: filteredUsers.length === 0 ? '1.5rem' : null }}>
					<CustomTextField
						sx={{ width: '50%' }}
						value={searchValue}
						onChange={(e) => {
							setSearchValue(e.target.value);
							setFilteredUsers([]);
						}}
					/>
					<CustomSubmitButton sx={{ marginLeft: '1rem', height: '2.35rem' }} onClick={filterUsers}>
						Search
					</CustomSubmitButton>
				</Box>
				{filteredUsers.length !== 0 && (
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'center',
							alignItems: 'flex-start',
							width: '65%',
							margin: '0 auto 1.5rem auto',
							border: 'solid 0.05rem lightgray',
						}}>
						{filteredUsers
							?.filter((filteredUser) => filteredUser.firebaseUserId !== user?.firebaseUserId)
							.map((user) => (
								<Box
									key={user.firebaseUserId}
									sx={{
										display: 'flex',
										justifyContent: 'flex-start',
										alignItems: 'center',
										width: '100%',
										padding: '0.5rem',
										transition: '0.5s',
										borderRadius: '0.25rem',
										':hover': {
											backgroundColor: theme.bgColor?.primary,
											color: '#fff',
											cursor: 'pointer',
											'& .username': {
												color: '#fff',
											},
										},
									}}
									onClick={() => handleUserSelection(user)}>
									<Box sx={{ borderRadius: '100%', marginRight: '1rem' }}>
										<img
											src={user.imageUrl}
											alt='profile_img'
											style={{
												height: '2.5rem',
												width: '2.5rem',
												borderRadius: '100%',
												border: 'solid lightgray 0.1rem',
											}}
										/>
									</Box>
									<Box>
										<Typography className='username' variant='body2'>
											{user.username}
										</Typography>
									</Box>
								</Box>
							))}
					</Box>
				)}
			</CustomDialog>
		</DashboardPagesLayout>
	);
};

export default Messages;
