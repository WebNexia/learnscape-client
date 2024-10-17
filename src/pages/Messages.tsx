import { Alert, Badge, Box, Dialog, IconButton, InputAdornment, Snackbar, Tooltip, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import { AddBox, Cancel, Chat, Image, InsertEmoticon, Person, PersonOff, Search, TurnLeftOutlined } from '@mui/icons-material';
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
	deleteDoc,
	writeBatch,
	getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import useImageUpload from '../hooks/useImageUpload'; // Import the custom hook
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import { User } from '../interfaces/user';
import axios from 'axios';
import theme from '../themes';
import { debounce } from 'lodash';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import { formatMessageTime } from '../utils/formatTime';
import { renderMessageWithEmojis } from '../utils/renderMessageWithEmojis';
import { useLocation } from 'react-router-dom';
import { UsersContext } from '../contexts/UsersContextProvider';

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
	hasUnreadMessages?: boolean;
	unreadMessagesCount?: number;
}

const Messages = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { user } = useContext(UserAuthContext);
	const { sortedUsersData } = useContext(UsersContext);

	const location = useLocation();

	const [messages, setMessages] = useState<Message[]>([]);
	const [showPicker, setShowPicker] = useState<boolean>(false);
	const [currentMessage, setCurrentMessage] = useState<string>('');
	const [isLargeImgMessageOpen, setIsLargeImgMessageOpen] = useState<boolean>(false);
	const [isDeleteMessageOpen, setIsDeleteMessageOpen] = useState<boolean>(false);
	const [messageIdToDelete, setMessageIdToDelete] = useState<string>('');

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
			originalMessageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

			originalMessageElement.classList.add('highlighted-message');

			setTimeout(() => {
				originalMessageElement.classList.remove('highlighted-message');
			}, 2500);
		}
	};

	useEffect(() => {
		const handleRouteChange = async () => {
			if (user?.firebaseUserId) {
				const userRef = doc(db, 'users', user.firebaseUserId);
				await updateDoc(userRef, {
					activeChatId: '', // Clear the active chat ID when navigating away
				});
			}
		};

		return () => {
			handleRouteChange(); // Runs when the route changes (component unmount)
		};
	}, [location, user?.firebaseUserId]);

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

	useEffect(() => {
		if (!user?.firebaseUserId) return;

		const chatsRef = collection(db, 'chats');
		const q = query(chatsRef, where('participants', 'array-contains', user?.firebaseUserId), orderBy('lastMessage.timestamp', 'desc'));

		const unsubscribe = onSnapshot(q, async (querySnapshot) => {
			const chatsArray: Chat[] = [];

			for (const doc of querySnapshot.docs) {
				const data = doc.data();
				const lastMessage = data.lastMessage || { text: 'No messages yet', timestamp: null };

				// Check if the chat is deleted by the current user
				if (data.isDeletedBy?.includes(user.firebaseUserId)) {
					continue; // Skip deleted chats
				}

				// Fetch unread messages for the current user only (receiver)
				const messagesRef = collection(db, 'chats', doc.id, 'messages');
				const unreadMessagesQuery = query(
					messagesRef,
					where('receiverId', '==', user?.firebaseUserId), // Only messages sent to the current user
					where('isRead', '==', false) // Unread messages
				);

				const unreadMessagesSnapshot = await getDocs(unreadMessagesQuery);
				const unreadMessagesCount = unreadMessagesSnapshot.size; // Calculate the unread count

				// Fetch participant details
				const participantsDetails: User[] = await Promise.all(
					data.participants?.map(async (participantId: string) => {
						const user = await fetchParticipantData(participantId);
						return { ...user, participantId };
					})
				);

				// Collect chat data along with unread message count and participant info
				chatsArray.push({
					chatId: doc.id,
					participants: participantsDetails
						?.filter((p): p is User => p !== null)
						?.map((p) => ({
							firebaseUserId: p.firebaseUserId,
							username: p.username,
							imageUrl: p.imageUrl,
						})),
					lastMessage,
					isDeletedBy: data.isDeletedBy,
					blockedUsers: data.blockedUsers,
					hasUnreadMessages: unreadMessagesCount > 0, // Flag chats with unread messages
					unreadMessagesCount, // Store unread message count for the current user
				});
			}

			// Store the chat list in localStorage and update state
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
			const batch = writeBatch(db); // To batch update messages

			querySnapshot.forEach((doc) => {
				const data = doc.data();
				const messageTimestamp = data.timestamp?.toDate() || new Date();

				// Collect all messages
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

				// If the message is for the current user and is not read, mark it as read
				if (data.receiverId === user.firebaseUserId && !data.isRead) {
					const messageDocRef = doc.ref;
					batch.update(messageDocRef, { isRead: true }); // Mark the message as read
				}
			});

			// Commit the batch update for all unread messages
			await batch.commit();

			// Apply the filter to block messages from blocked users
			const filteredMessages = filterBlockedMessages(messagesArray, activeChat);

			// Restore chat if the user had deleted it and a new message is received
			if (activeChat.isDeletedBy?.includes(user.firebaseUserId)) {
				const chatRef = doc(db, 'chats', activeChat.chatId);
				await updateDoc(chatRef, {
					isDeletedBy: arrayRemove(user.firebaseUserId),
				});
			}

			setMessages(filteredMessages); // Set the messages after processing
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
				isDeletedBy: chatData.isDeletedBy || [],
				hasUnreadMessages: chatData.hasUnreadMessages,
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
				isDeletedBy: [],
				blockedUsers: {},
				hasUnreadMessages: false,
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

	const handleSetActiveChat = async (chat: Chat) => {
		setActiveChat(chat);
		localStorage.setItem('activeChatId', chat.chatId);
		setActiveChatId(chat.chatId);

		const chatBlockedUsers = chat.blockedUsers || {};
		const blockedUsersArray = Object.keys(chatBlockedUsers);
		setBlockedUsers(blockedUsersArray);

		const userRef = doc(db, 'users', user?.firebaseUserId!);
		await updateDoc(userRef, {
			activeChatId: chat.chatId, // Set the active chat ID in Firestore
		});

		// Mark unread messages as read when user opens chat
		const messagesRef = collection(db, 'chats', chat.chatId, 'messages');
		const unreadMessagesQuery = query(messagesRef, where('receiverId', '==', user?.firebaseUserId), where('isRead', '==', false));

		const unreadMessagesSnapshot = await getDocs(unreadMessagesQuery);

		unreadMessagesSnapshot.forEach(async (doc) => {
			await updateDoc(doc.ref, {
				isRead: true, // Mark each message as read
			});
		});

		// Update Firestore to reflect no unread messages for this chat
		const chatDocRef = doc(db, 'chats', chat.chatId);
		await updateDoc(chatDocRef, {
			hasUnreadMessages: false, // Set unread to false after the chat is opened
		});
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
			// Ensure the chat document is created if it doesn’t exist
			const chatDoc = await getDoc(chatRef);
			if (!chatDoc.exists()) {
				await setDoc(chatRef, {
					participants: activeChat.participants?.map((p) => p.firebaseUserId),
					lastMessage: {
						text: currentMessage.trim() || 'Image sent',
						timestamp: serverTimestamp(),
					},
					isDeletedBy: [],
					blockedUsers: {},
					hasUnreadMessages: false,
				});
			} else {
				await updateDoc(chatRef, {
					isDeletedBy: arrayRemove(...activeChat.participants?.map((p) => p.firebaseUserId)),
				});
			}

			// Image upload handling
			let imageUrl = '';
			if (imageUpload) {
				await handleImageUpload('messages', (url: string) => {
					imageUrl = url;
				});
			}

			const receiverId = activeChat.participants.find((p) => p.firebaseUserId !== user?.firebaseUserId)?.firebaseUserId;

			const newMessage: Message = {
				id: generateUniqueId(''),
				senderId: user?.firebaseUserId!,
				receiverId: receiverId || '',
				text: currentMessage.trim() || '',
				imageUrl: imageUrl.trim() || '',
				timestamp: new Date(),
				isRead: false,
				replyTo: replyToMessage?.id || '',
				quotedText: replyToMessage?.text || '',
			};

			// Add the message to Firestore
			await addDoc(messageRef, {
				...newMessage,
				timestamp: serverTimestamp(),
			});

			if (receiverId) {
				const recipientRef = doc(db, 'users', receiverId);
				const recipientDoc = await getDoc(recipientRef);
				const recipientData = recipientDoc.data();

				const isRecipientChatting = recipientData?.activeChatId === activeChat.chatId;

				// Check if the receiver has unread messages in the active chat
				const unreadMessagesQuery = query(
					collection(db, 'chats', activeChat.chatId, 'messages'),
					where('receiverId', '==', receiverId),
					where('isRead', '==', false)
				);
				const unreadMessagesSnapshot = await getDocs(unreadMessagesQuery);

				// Send a notification only if there are no unread messages and the recipient is not currently viewing the chat
				if (unreadMessagesSnapshot.size === 1 && !isRecipientChatting) {
					const notificationData = {
						title: 'New Message',
						message: `${user?.username} sent you a message.`,
						isRead: false,
						timestamp: serverTimestamp(),
						type: 'MessageReceived',
						userImageUrl: user?.imageUrl,
					};

					const notificationRef = collection(db, 'notifications', receiverId, 'userNotifications');
					await addDoc(notificationRef, notificationData);
				}
			}

			// Update the lastMessage field and set hasUnreadMessages to true for the receiver
			await updateDoc(chatRef, {
				lastMessage: {
					text: newMessage.text.trim() || 'Image sent',
					timestamp: serverTimestamp(),
				},
				hasUnreadMessages: true,
			});

			// Clear the reply context and reset state after sending the message
			setReplyToMessage(null);
			setCurrentMessage('');
			resetImageUpload();
		} catch (error) {
			console.error('Error sending message: ', error);
		}
	};

	const filterUsers = async (searchQuery: string) => {
		if (!searchQuery.trim()) {
			setFilteredUsers([]);
			return;
		}

		const searchResults = sortedUsersData.filter(
			(filteredUser) => filteredUser.username.toLowerCase().includes(searchQuery) || filteredUser.email.toLowerCase().includes(searchQuery)
		);

		setFilteredUsers(searchResults);
	};

	const handleUserSelection = async (selectedUser: User) => {
		await startChatIfNotExists(selectedUser); // Ensure the chat is started or exists
		setAddUserModalOpen(false); // Close modal
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
			const filteredChatListAfterDelete = prevChatList?.filter((chat) => chat.chatId !== chatId);
			localStorage.setItem('chatList', JSON.stringify(filteredChatListAfterDelete));
			return filteredChatListAfterDelete;
		});

		setChatList((prevChatList) => {
			const filteredChatListAfterDelete = prevChatList?.filter((chat) => chat.chatId !== chatId);
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

	const handleDeleteMessage = async (messageId: string) => {
		if (!activeChat) return;

		const messageRef = doc(db, 'chats', activeChat.chatId, 'messages', messageId);

		try {
			// Delete the message from Firestore
			await deleteDoc(messageRef);

			// Update the local state to remove the deleted message
			setMessages((prevMessages) => prevMessages?.filter((msg) => msg.id !== messageId));

			// Optionally, you can also update the `lastMessage` field in the chat document if the deleted message was the last message.
			const chatRef = doc(db, 'chats', activeChat.chatId);
			const lastMessage = messages?.filter((msg) => msg.id !== messageId).slice(-1)[0];

			if (lastMessage) {
				await updateDoc(chatRef, {
					lastMessage: {
						text: lastMessage.text || 'Image sent',
						timestamp: lastMessage.timestamp,
					},
				});
			} else {
				// If there are no messages left after deletion, set lastMessage to a default value
				await updateDoc(chatRef, {
					lastMessage: {
						text: 'No messages yet',
						timestamp: null,
					},
				});
			}
		} catch (error) {
			console.error('Error deleting message:', error);
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
					setBlockedUsers((prevList) => prevList?.filter((userId) => userId !== firebaseUserId));
					await updateDoc(chatRef, {
						[`blockedUsers.${firebaseUserId}`]: deleteField(),
					});
				} else {
					// Block user by creating a new block entry
					setBlockedUsers((prevList) => [...prevList, firebaseUserId]);
					setCurrentMessage('');
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
			const filteredList = chatList?.filter((chat: Chat) =>
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
				<Box sx={{ display: 'flex', flexDirection: 'column', flex: 3, borderRight: '0.04rem solid lightgray', padding: '0 0rem 0 1rem' }}>
					<Box sx={{ display: 'flex', margin: '0.5rem auto 0 auto', width: '100%', height: '3rem', paddingTop: '0.5rem' }}>
						<Box sx={{ flex: 9 }}>
							<CustomTextField
								InputProps={{
									endAdornment: (
										<InputAdornment position='end'>
											<Search sx={{ mr: '-0.5rem' }} />
										</InputAdornment>
									),
								}}
								value={searchChatValue}
								onChange={handleFilterChats}
							/>
						</Box>
						<Box sx={{ flex: 1 }}>
							<Tooltip title='Find User' placement='top'>
								<IconButton
									sx={{ ':hover': { backgroundColor: 'transparent' } }}
									onClick={() => {
										setAddUserModalOpen(true);
										setFilteredUsers([]);
										setSearchValue('');
									}}>
									<AddBox />
								</IconButton>
							</Tooltip>
						</Box>
					</Box>

					<Box sx={{ display: 'flex', flexDirection: 'column', marginTop: '0.5rem', overflow: 'auto', width: '100%' }}>
						{filteredChatList?.map((chat) => {
							const otherParticipant = chat.participants.find((participant) => participant.firebaseUserId !== user?.firebaseUserId);

							if (!otherParticipant) return null;

							return (
								<Box
									key={`${chat.chatId}-${chat.participants[0].firebaseUserId}`}
									sx={{
										display: 'flex',
										border: '0.04rem solid lightgray',
										borderRight: 'none',
										borderBottom: 'none',
										'&:last-of-type': {
											borderBottom: '0.04rem solid lightgray',
											borderBottomLeftRadius: '0.35rem',
										},

										'&:first-of-type': {
											borderTopLeftRadius: '0.35rem',
										},
										backgroundImage: chat.chatId === activeChatId ? `url(/msg-bg.png)` : null,
										backgroundRepeat: 'no-repeat',
										backgroundSize: 'cover',
										backgroundPosition: 'center',
									}}>
									<Box
										sx={{
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'start',
											padding: '0.5rem',
											cursor: 'pointer',
											flex: 6,
										}}
										onClick={() => {
											handleSetActiveChat(chat);
										}}>
										<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
											<Box sx={{ borderRadius: '100%', marginRight: '1rem' }}>
												<Badge color='error' badgeContent={chat.unreadMessagesCount} max={9} sx={{ margin: '0.5rem 0.5rem 0 0' }}>
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
												</Badge>
											</Box>
											<Box>
												<Typography variant='body2' sx={{ color: chat.chatId === activeChatId ? theme.textColor?.common.main : null }}>
													{otherParticipant.username}
												</Typography>
											</Box>
										</Box>
										<Box
											sx={{
												marginTop: '0.2rem',
											}}>
											<Typography variant='caption' sx={{ color: chat.chatId === activeChatId ? theme.textColor?.common.main : 'gray' }}>
												{chat.lastMessage.text.length > 20 ? `${chat.lastMessage.text.substring(0, 20)}...` : chat.lastMessage.text}
											</Typography>
										</Box>
									</Box>
									<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1, mr: '0.2rem' }}>
										<Tooltip title='Delete Chat' placement='top'>
											<IconButton
												onClick={() => handleDeleteChat(chat.chatId)}
												sx={{
													':hover': {
														backgroundColor: 'transparent',
													},
												}}>
												<Cancel
													fontSize='small'
													sx={{
														fontSize: '1.1rem',
														color: chat.chatId === activeChatId ? theme.textColor?.common.main : theme.palette.primary.main,
													}}
												/>
											</IconButton>
										</Tooltip>
										<Typography variant='caption' sx={{ color: chat.chatId !== activeChatId ? 'gray' : '#fff', fontSize: '0.65rem', mt: '0.25rem' }}>
											{chat.lastMessage.timestamp ? formatMessageTime(chat.lastMessage.timestamp) : null}
										</Typography>
									</Box>
								</Box>
							);
						})}
					</Box>
				</Box>

				{/* Message Display */}
				<Box sx={{ display: 'flex', flexDirection: 'column', flex: 10, height: '100%', marginLeft: '-0.04rem' }}>
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							borderBottom: '0.04rem solid lightgray',
							width: '100%',
							height: '4rem',
							flexShrink: 0,
						}}>
						{activeChat && (
							<Box sx={{ display: 'flex', alignItems: 'center', margin: '0 1.5rem', width: '100%' }}>
								{activeChat.participants
									?.filter((participant) => participant.firebaseUserId !== user?.firebaseUserId)
									?.map((otherParticipant) => (
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
							borderLeft: 'none',
						}}>
						{activeChat ? (
							messages
								?.filter((msg) => {
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
								?.map((msg) => (
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
														<Typography sx={{ fontSize: '0.85rem', wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
															{renderMessageWithEmojis(msg.text, '1.75rem')}
														</Typography>
													</Box>
												)}

												<Box sx={{ alignSelf: 'flex-end' }}>
													<Typography variant='caption' sx={{ fontSize: '0.65rem', color: 'gray' }}>
														{formatMessageTime(msg.timestamp)}
													</Typography>
												</Box>
											</Box>

											<Box>
												<Tooltip title='Reply' placement='top'>
													<IconButton
														size='small'
														onClick={() => handleReplyMessage(msg)}
														sx={{
															':hover': {
																backgroundColor: 'transparent',
															},
														}}>
														<TurnLeftOutlined sx={{ fontSize: '1.25rem' }} />
													</IconButton>
												</Tooltip>
											</Box>
											<Box
												sx={{
													marginRight: 0,
												}}>
												{msg.senderId === user?.firebaseUserId && (
													<Tooltip title='Delete' placement='top'>
														<IconButton
															size='small'
															onClick={() => {
																setIsDeleteMessageOpen(true);
																setMessageIdToDelete(msg.id);
															}}
															sx={{
																':hover': {
																	backgroundColor: 'transparent',
																},
															}}>
															<Cancel sx={{ fontSize: '1.15rem' }} />
														</IconButton>
													</Tooltip>
												)}
											</Box>
										</Box>
									</Box>
								))
						) : (
							<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
								<Box>
									<Chat sx={{ color: theme.textColor?.common.main, fontSize: '6rem', mb: '1rem' }} />
								</Box>
								<Box>
									<Typography variant='body1' sx={{ color: theme.textColor?.common.main }}>
										Select an existing chat or start a new chat by adding a user
									</Typography>
								</Box>
							</Box>
						)}

						<div ref={messagesEndRef} />
					</Box>

					<CustomDialog
						openModal={isDeleteMessageOpen}
						closeModal={() => {
							setIsDeleteMessageOpen(false);
							setMessageIdToDelete('');
						}}
						maxWidth='sm'
						title='Delete Message'
						content='Are you sure you want to delete this message?'>
						<CustomDialogActions
							deleteBtn
							deleteBtnText='Delete'
							onCancel={() => {
								setIsDeleteMessageOpen(false);
								setMessageIdToDelete('');
							}}
							onDelete={() => {
								handleDeleteMessage(messageIdToDelete);
								setIsDeleteMessageOpen(false);
								setMessageIdToDelete('');
							}}
						/>
					</CustomDialog>

					{zoomedImage && (
						<Dialog open={!!zoomedImage} onClose={() => setZoomedImage('')} maxWidth='sm'>
							<img src={zoomedImage} alt='Zoomed' style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0.25rem' }} />
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
							disabled={isUploading || isBlockedUser || isBlockingUser || !activeChat}
						/>
						<label htmlFor='image-upload'>
							<IconButton component='span' disabled={isUploading || isBlockedUser || isBlockingUser || !activeChat}>
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
											<IconButton
												onClick={() => setShowPicker(!showPicker)}
												edge='end'
												disabled={isUploading || isBlockedUser || isBlockingUser || !activeChat}>
												<InsertEmoticon color={showPicker ? 'success' : 'disabled'} />
											</IconButton>
										</InputAdornment>
									),
								}}
								sx={{ overflowY: 'auto' }}
								disabled={!!imageUpload || isBlockedUser || isBlockingUser || !activeChat}
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

						{showPicker && !(isUploading || isBlockedUser || isBlockingUser || !activeChat) && (
							<Box sx={{ position: 'absolute', bottom: '6rem', right: '3rem', zIndex: 10 }}>
								<Picker data={data} onEmojiSelect={handleEmojiSelect} theme='dark' />
							</Box>
						)}

						<CustomSubmitButton
							sx={{ margin: '0 0 1rem 1rem' }}
							size='small'
							onClick={handleSendMessage}
							disabled={isUploading || isBlockedUser || isBlockingUser || !activeChat}>
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
						sx={{ width: '80%' }}
						value={searchValue}
						onChange={(e) => {
							setSearchValue(e.target.value);
							filterUsers(e.target.value);
						}}
					/>
				</Box>
				{filteredUsers.length !== 0 && (
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'center',
							alignItems: 'flex-start',
							width: '65%',
							maxHeight: '15rem',
							overflow: 'auto',
							margin: '0 auto 1.5rem auto',
							border: 'solid 0.05rem lightgray',
						}}>
						{filteredUsers
							?.filter((filteredUser) => filteredUser.firebaseUserId !== user?.firebaseUserId)
							?.map((user) => (
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
