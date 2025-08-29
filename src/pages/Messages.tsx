import { Box, IconButton, Typography, Dialog, DialogContent } from '@mui/material';
import { Cancel, Chat } from '@mui/icons-material';

import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';

import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import UserSearchSelect from '../components/UserSearchSelect';
import { useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
import useImageUpload from '../hooks/useImageUpload';
import { useUploadLimit } from '../contexts/UploadLimitContextProvider';
import { User } from '../interfaces/user';
import axios from '@utils/axiosInstance';
import { debounce } from 'lodash';
import { useLocation } from 'react-router-dom';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { SearchUser } from '../interfaces/search';
import ChatList from '../components/messages/ChatList';
import ChatHeader from '../components/messages/ChatHeader';
import MessageList from '../components/messages/MessageList';
import MessageInput from '../components/messages/MessageInput';
import GroupChatModal from '../components/messages/GroupChatModal';
import GroupChatEditModal from '../components/messages/GroupChatEditModal';
import GroupMembersModal from '../components/messages/GroupMembersModal';
import CustomErrorMessage from '../components/forms/customFields/CustomErrorMessage';

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
	isSystemMessage?: boolean; // For system messages like "User left"
	systemMessageType?: 'user_left' | 'user_joined' | 'group_created'; // Type of system message
}

export interface ParticipantData {
	firebaseUserId: string;
	username: string;
	imageUrl: string;
	role: string;
}

export interface Chat {
	chatId: string;
	participants: ParticipantData[];
	lastMessage: {
		text: string;
		timestamp: Date | null;
	};
	isDeletedBy?: string[]; // For hiding chats
	removedParticipants?: string[]; // For permanently removed participants
	blockedUsers?: {
		[blockedUserId: string]: {
			blockedSince: Date | null; // The timestamp when the user was blocked
			blockedUntil: Date | null; // The timestamp when the user was unblocked (or null if still blocked)
		};
	};
	hasUnreadMessages?: boolean;
	unreadMessagesCount?: number;
	unreadBy?: string[];
	// Group chat fields
	chatType?: '1-1' | 'group';
	groupName?: string;
	groupImageUrl?: string;
	createdBy?: string;
	groupSettings?: {
		onlyAdminsCanAddUsers?: boolean;
		onlyAdminsCanSendMessages?: boolean;
	};
}

const Messages = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { user } = useContext(UserAuthContext);

	const { isSmallScreen, isRotatedMedium, isVerySmallScreen, isRotated } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const location = useLocation();

	const [messages, setMessages] = useState<Message[]>([]);
	const [showPicker, setShowPicker] = useState<boolean>(false);
	const [currentMessage, setCurrentMessage] = useState<string>('');
	const [isLargeImgMessageOpen, setIsLargeImgMessageOpen] = useState<boolean>(false);
	const [isDeleteMessageOpen, setIsDeleteMessageOpen] = useState<boolean>(false);
	const [messageIdToDelete, setMessageIdToDelete] = useState<string>('');
	const [isDeleteChatDialogOpen, setIsDeleteChatDialogOpen] = useState<boolean>(false);
	const [isDeleteGroupDialogOpen, setIsDeleteGroupDialogOpen] = useState<boolean>(false);
	const [chatIdToDelete, setChatIdToDelete] = useState<string>('');

	const [errorMsg, setErrorMsg] = useState<string>('');

	const [isChatsListVisible, setIsChatsListVisible] = useState<boolean>(false);

	const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
	const [searchValue, setSearchValue] = useState<string>('');
	const [searchChatValue, setSearchChatValue] = useState<string>('');

	const [replyToMessage, setReplyToMessage] = useState<Message | null>(null); // To store the message being replied to

	const [chatList, setChatList] = useState<Chat[]>([]); // Storing chats with participants and last message
	const [filteredChatList, setFilteredChatList] = useState<Chat[]>([]);
	const [activeChat, setActiveChat] = useState<Chat | null>(null); // Active chat
	const [activeChatId, setActiveChatId] = useState<string>('');
	const [addUserModalOpen, setAddUserModalOpen] = useState<boolean>(false);
	const [createGroupModalOpen, setCreateGroupModalOpen] = useState<boolean>(false);
	const [editGroupModalOpen, setEditGroupModalOpen] = useState<boolean>(false);
	const [membersModalOpen, setMembersModalOpen] = useState<boolean>(false);

	const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
	const [globalBlockedUsers, setGlobalBlockedUsers] = useState<string[]>([]);
	const [blockedByUsers, setBlockedByUsers] = useState<string[]>([]); // Track who has blocked the current user

	const [zoomedImage, setZoomedImage] = useState<string | undefined>('');

	// Function to fetch all blocked users for the current user
	const fetchAllBlockedUsers = useCallback(async () => {
		if (!user?.firebaseUserId) return;

		try {
			// Get blocked users from userBlocks collection (who current user has blocked)
			const userBlocksRef = doc(db, 'userBlocks', user.firebaseUserId);
			const userBlocksDoc = await getDoc(userBlocksRef);

			if (userBlocksDoc.exists()) {
				const userBlocksData = userBlocksDoc.data();
				const blockedUsers = userBlocksData.blockedUsers || {};
				setGlobalBlockedUsers(Object.keys(blockedUsers));
			} else {
				setGlobalBlockedUsers([]);
			}

			// Check who has blocked the current user by querying userBlocks collection
			const blockedByUsers: string[] = [];
			const userBlocksQuery = query(collection(db, 'userBlocks'), where(`blockedUsers.${user.firebaseUserId}`, '!=', null));
			const userBlocksSnapshot = await getDocs(userBlocksQuery);

			userBlocksSnapshot.forEach((doc) => {
				const userBlocksData = doc.data();
				const blockedUsers = userBlocksData.blockedUsers || {};
				if (blockedUsers[user.firebaseUserId]) {
					// This user has blocked the current user
					blockedByUsers.push(doc.id);
				}
			});

			setBlockedByUsers([...new Set(blockedByUsers)]); // Remove duplicates
		} catch (error) {
			console.error('Error fetching blocked users:', error);
		}
	}, [user?.firebaseUserId]);

	// Real-time listener for userBlocks collection to automatically update blocking status
	useEffect(() => {
		if (!user?.firebaseUserId) return;

		// Listen to changes in the current user's userBlocks document
		const userBlocksRef = doc(db, 'userBlocks', user.firebaseUserId);
		const unsubscribeUserBlocks = onSnapshot(userBlocksRef, (doc) => {
			if (doc.exists()) {
				const userBlocksData = doc.data();
				const blockedUsers = userBlocksData.blockedUsers || {};
				setGlobalBlockedUsers(Object.keys(blockedUsers));
			} else {
				setGlobalBlockedUsers([]);
			}
		});

		// Listen to changes in userBlocks collection where current user is blocked
		const userBlocksQuery = query(collection(db, 'userBlocks'), where(`blockedUsers.${user.firebaseUserId}`, '!=', null));
		const unsubscribeBlockedBy = onSnapshot(userBlocksQuery, (querySnapshot) => {
			const blockedByUsers: string[] = [];
			querySnapshot.forEach((doc) => {
				const userBlocksData = doc.data();
				const blockedUsers = userBlocksData.blockedUsers || {};
				if (blockedUsers[user.firebaseUserId]) {
					blockedByUsers.push(doc.id);
				}
			});
			setBlockedByUsers([...new Set(blockedByUsers)]);
		});

		return () => {
			unsubscribeUserBlocks();
			unsubscribeBlockedBy();
		};
	}, [user?.firebaseUserId]);

	// Group chat creation state
	const [groupName, setGroupName] = useState<string>('');
	const [selectedGroupUsers, setSelectedGroupUsers] = useState<User[]>([]);
	const [groupSearchValue, setGroupSearchValue] = useState<string>('');
	const [groupImageUrl, setGroupImageUrl] = useState<string>('');
	const [enterGroupImageUrl, setEnterGroupImageUrl] = useState<boolean>(true);
	const [removedMembers, setRemovedMembers] = useState<string[]>([]);

	const hasLeftParticipants = (chat: Chat | null): boolean => {
		// For group chats, don't prevent sending messages if some users have left
		// Only prevent if the current user has left
		if (chat?.chatType === 'group') {
			return !!(chat?.removedParticipants && user?.firebaseUserId && chat.removedParticipants?.includes(user.firebaseUserId));
		}
		// For 1-1 chats, prevent if any participant has left
		return !!(chat?.removedParticipants && chat.removedParticipants?.length > 0);
	};

	// Helper function to check if two chats have the same participants (only for 1-1 chats)
	const hasSameParticipants = (chat1: Chat, chat2: Chat): boolean => {
		// Only check for 1-1 chats, not group chats
		if (chat1.chatType === 'group' || chat2.chatType === 'group') {
			return false;
		}

		const participants1 = chat1.participants.map((p) => p.firebaseUserId).sort();
		const participants2 = chat2.participants.map((p) => p.firebaseUserId).sort();
		return participants1.length === participants2.length && participants1.every((id, index) => id === participants2[index]);
	};

	// Helper function to find existing chat with same participants
	const findExistingChatWithParticipants = (participantIds: string[]): Chat | null => {
		const sortedParticipantIds = participantIds.sort();
		return (
			chatList.find((chat) => {
				if (chat.chatType === 'group') return false;
				const chatParticipantIds = chat.participants.map((p) => p.firebaseUserId).sort();
				return (
					chatParticipantIds.length === sortedParticipantIds.length && chatParticipantIds.every((id, index) => id === sortedParticipantIds[index])
				);
			}) || null
		);
	};

	const addSystemMessage = useCallback(async (chatId: string, messageType: 'user_left' | 'user_joined' | 'group_created', username?: string) => {
		const messageRef = collection(db, 'chats', chatId, 'messages');

		let systemText = '';
		switch (messageType) {
			case 'user_left':
				systemText = `${username || 'User'} left the chat`;
				break;
			case 'user_joined':
				systemText = `${username || 'User'} joined the chat`;
				break;
			case 'group_created':
				systemText = 'Group chat created';
				break;
		}

		const systemMessage: Message = {
			id: generateUniqueId(''),
			senderId: 'system',
			text: systemText,
			timestamp: new Date(),
			isRead: false,
			imageUrl: '',
			videoUrl: '',
			replyTo: '',
			quotedText: '',
			isSystemMessage: true,
			systemMessageType: messageType,
		};

		try {
			await addDoc(messageRef, {
				...systemMessage,
				timestamp: serverTimestamp(),
			});
		} catch (error) {
			console.error('Error adding system message:', error);
		}
	}, []);

	// Check if the current user is blocked by another user
	const isBlockedUser: boolean = useMemo(() => {
		if (!activeChat || !user?.firebaseUserId) return false;

		// Check if any participant has blocked the current user using blockedByUsers from userBlocks collection
		return (
			activeChat.participants?.some((participant) => {
				if (participant.firebaseUserId === user.firebaseUserId) return false;
				return blockedByUsers.includes(participant.firebaseUserId);
			}) || false
		);
	}, [user?.firebaseUserId, activeChat, blockedByUsers]);

	// Check if the current user has blocked someone else
	const isBlockingUser: boolean = useMemo(() => {
		if (!activeChat || !user?.firebaseUserId) return false;

		// Check if current user has blocked any participant
		return (
			activeChat.participants?.some((participant) => {
				if (participant.firebaseUserId === user.firebaseUserId) return false;
				return globalBlockedUsers.includes(participant.firebaseUserId);
			}) || false
		);
	}, [activeChat?.participants, user?.firebaseUserId, globalBlockedUsers]);

	// Update blockedUsers state whenever globalBlockedUsers changes
	useEffect(() => {
		setBlockedUsers(globalBlockedUsers);
	}, [globalBlockedUsers]);

	const { imageUpload, imagePreview, handleImageChange, handleImageUpload, resetImageUpload, isUploading, isImgSizeLarge } = useImageUpload({
		maxSizeInMB: 1,
	});

	// Upload limit management
	const { uploadInfo, checkCanUploadImage, checkCanUploadAudio, getRemainingImageUploads, getFormattedResetTime, refreshUploadStats } =
		useUploadLimit();

	const handleEmojiSelect = useCallback((emoji: any) => {
		setCurrentMessage((prevMessage) => prevMessage + emoji.native);
		setShowPicker(false);
	}, []);

	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, []);

	const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

	const scrollToOriginalMessage = useCallback((messageId: string) => {
		const originalMessageElement = messageRefs.current[messageId]; // Get the ref for the original message

		if (originalMessageElement) {
			originalMessageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

			originalMessageElement.classList.add('highlighted-message');

			setTimeout(() => {
				originalMessageElement.classList.remove('highlighted-message');
			}, 2500);
		}
	}, []);

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
	const participantCache = useMemo(() => JSON.parse(localStorage.getItem('participantCache') || '{}'), []);

	// Function to fetch and cache only ParticipantData
	const fetchParticipantData = useCallback(
		async (firebaseUserId: string): Promise<ParticipantData | null> => {
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
					role: userData.role || '',
				};

				// Cache participant data in localStorage
				participantCache[firebaseUserId] = participantData;
				localStorage.setItem('participantCache', JSON.stringify(participantCache));

				return participantData;
			} catch (error) {
				console.error('Error fetching participant data:', error);
				return null;
			}
		},
		[participantCache, base_url]
	);

	useEffect(() => {
		if (!user?.firebaseUserId) return;

		// Real-time listeners will handle blocking status automatically

		const chatsRef = collection(db, 'chats');
		const q = query(chatsRef, where('participants', 'array-contains', user?.firebaseUserId), orderBy('lastMessage.timestamp', 'desc'));

		const unsubscribe = onSnapshot(q, async (querySnapshot) => {
			const chatsArray: Chat[] = [];
			let totalUnreadMessages = 0;

			for (const doc of querySnapshot.docs) {
				const data = doc.data();
				const lastMessage = data.lastMessage || { text: 'No messages yet', timestamp: null };

				// Check if the chat is deleted by the current user
				if (data.isDeletedBy?.includes(user.firebaseUserId)) {
					continue; // Skip deleted chats
				}

				// Check if the current user has permanently left the chat
				if (data.removedParticipants?.includes(user.firebaseUserId)) {
					continue; // Skip chats where user has permanently left
				}

				// Fetch unread messages for the current user
				const messagesRef = collection(db, 'chats', doc.id, 'messages');
				let unreadMessagesQuery;

				// Check if this is a group chat
				const isGroup = data.chatType === 'group' || data.participants?.length > 2;

				if (isGroup) {
					// For group chats, count all unread messages
					unreadMessagesQuery = query(
						messagesRef,
						where('isRead', '==', false) // All unread messages
					);
				} else {
					// For 1-1 chats, only count messages sent to the current user
					unreadMessagesQuery = query(
						messagesRef,
						where('receiverId', '==', user?.firebaseUserId), // Only messages sent to the current user
						where('isRead', '==', false) // Unread messages
					);
				}

				const unreadMessagesSnapshot = await getDocs(unreadMessagesQuery);
				const unreadMessagesCount = unreadMessagesSnapshot.size; // Calculate the unread count

				totalUnreadMessages += unreadMessagesCount;

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
							role: p.role,
						})),
					lastMessage,
					isDeletedBy: data.isDeletedBy,
					removedParticipants: data.removedParticipants,
					blockedUsers: data.blockedUsers,
					hasUnreadMessages: unreadMessagesCount > 0, // Flag chats with unread messages
					unreadMessagesCount, // Store unread message count for the current user
					// Group chat fields
					chatType: data.chatType || '1-1',
					groupName: data.groupName,
					groupImageUrl: data.groupImageUrl,
					createdBy: data.createdBy,
					groupSettings: data.groupSettings,
				});
			}

			// Store the chat list in localStorage and update state
			localStorage.setItem('chatList', JSON.stringify(chatsArray));
			localStorage.setItem('totalUnreadMessages', JSON.stringify(totalUnreadMessages)); // Save total unread count
			setChatList(chatsArray);
			setFilteredChatList(chatsArray);
		});

		return () => unsubscribe();
	}, [user?.firebaseUserId, fetchAllBlockedUsers, fetchParticipantData]);

	const filterBlockedMessages = useCallback(
		(messagesArray: Message[]) => {
			return messagesArray.filter((msg) => {
				// Check if the message sender is in the current user's blocked list
				if (globalBlockedUsers.includes(msg.senderId)) {
					return false; // Don't show messages from blocked users
				}
				return true;
			});
		},
		[globalBlockedUsers]
	);

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
				// For group chats, mark all messages as read for the current user
				// For 1-1 chats, only mark messages sent to the current user
				const isGroup = isGroupChat(activeChat);
				if ((isGroup || data.receiverId === user.firebaseUserId) && !data.isRead) {
					const messageDocRef = doc.ref;
					batch.update(messageDocRef, { isRead: true }); // Mark the message as read
				}
			});

			// Commit the batch update for all unread messages
			await batch.commit();

			// Apply the filter to block messages from blocked users
			const filteredMessages = filterBlockedMessages(messagesArray);

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

	// Helper function to check if a user is blocked by another user
	const checkIfUserIsBlocked = useCallback(async (blockedUserId: string, blockerUserId: string): Promise<boolean> => {
		try {
			// Check userBlocks collection for blocking status
			const userBlocksRef = doc(db, 'userBlocks', blockerUserId);
			const userBlocksDoc = await getDoc(userBlocksRef);

			if (userBlocksDoc.exists()) {
				const userBlocksData = userBlocksDoc.data();
				const blockedUsers = userBlocksData.blockedUsers || {};
				const blockInfo = blockedUsers[blockedUserId];

				if (blockInfo && blockInfo.blockedSince) {
					const blockedSince = new Date(blockInfo.blockedSince);
					const blockedUntil = blockInfo.blockedUntil ? new Date(blockInfo.blockedUntil) : null;

					// Check if the block is currently active
					return blockedSince && (!blockedUntil || new Date(blockedUntil) > new Date());
				}
			}

			return false; // No block found
		} catch (error) {
			console.error('Error checking if user is blocked:', error);
			return false;
		}
	}, []);

	const startChatIfNotExists = useCallback(
		async (selectedUser: User): Promise<'success' | 'blocked'> => {
			const chatId = [user?.firebaseUserId, selectedUser.firebaseUserId].sort().join('&');
			const chatRef = doc(db, 'chats', chatId);

			const chatDoc = await getDoc(chatRef);

			// If chat exists, restore it regardless of blocking status
			if (chatDoc.exists()) {
				const chatData = chatDoc.data();

				// Check if the chat is hidden and restore it
				if (chatData.isDeletedBy?.includes(user?.firebaseUserId)) {
					// Restore the chat by removing the current user from `isDeletedBy`
					await updateDoc(chatRef, {
						isDeletedBy: arrayRemove(user?.firebaseUserId),
					});

					// For hidden chats, skip blocking check and restore the chat
					// This allows users to restore hidden chats even if they're blocked
					// Continue to the restoration logic below
				} else {
					// Only check blocking for existing chats that are not hidden
					// Check if the current user is blocked by the selected user
					const currentUserBlocked = await checkIfUserIsBlocked(user?.firebaseUserId!, selectedUser.firebaseUserId);
					if (currentUserBlocked) {
						setErrorMsg('Cannot start chat: You are blocked by this user');
						return 'blocked';
					}

					// Check if the selected user is blocked by the current user
					const selectedUserBlocked = await checkIfUserIsBlocked(selectedUser.firebaseUserId, user?.firebaseUserId!);
					if (selectedUserBlocked) {
						setErrorMsg('Cannot start chat: This user is blocked');
						return 'blocked';
					}
				}
			} else {
				// For completely new chats, check blocking
				// But first, check if there might be a hidden chat that we can restore
				const existingChatInList = findExistingChatWithParticipants([user?.firebaseUserId!, selectedUser.firebaseUserId]);

				if (existingChatInList) {
					// If we found an existing chat in the list, activate it instead of creating a new one
					// This handles the case where a chat exists but is hidden/deleted
					setActiveChat(existingChatInList);
					setActiveChatId(existingChatInList.chatId);
					localStorage.setItem('activeChatId', existingChatInList.chatId);
					return 'success';
				}

				// Also check if there's a hidden chat in the database that we can restore
				// This handles cases where the chat exists but is not in the current chat list
				const hiddenChatRef = doc(db, 'chats', chatId);
				const hiddenChatDoc = await getDoc(hiddenChatRef);

				if (hiddenChatDoc.exists()) {
					const hiddenChatData = hiddenChatDoc.data();
					// If the chat exists but is hidden, restore it
					if (hiddenChatData.isDeletedBy?.includes(user?.firebaseUserId)) {
						await updateDoc(hiddenChatRef, {
							isDeletedBy: arrayRemove(user?.firebaseUserId),
						});
						// The chat will be restored in the next chat list update
						return 'success';
					}
				}

				// For new chats, don't check blocking - let the chat be created
				// The blocking will be handled in the chat interface itself
			}

			if (chatDoc.exists()) {
				const chatData = chatDoc.data();

				// Check if any participant has permanently left this chat
				const hasLeftParticipants = !!(chatData.removedParticipants && chatData.removedParticipants?.length > 0);
				const currentUserLeft = chatData.removedParticipants?.includes(user?.firebaseUserId);
				const selectedUserLeft = chatData.removedParticipants?.includes(selectedUser.firebaseUserId);

				// Only create a new chat if the current user has also left the chat permanently
				// If only the other user has left but the current user hasn't, restore the existing chat
				if (hasLeftParticipants && currentUserLeft) {
					// If the current user has also left this chat, create a completely new chat with a unique ID
					const timestamp = Date.now();
					const newChatId = `${chatId}_${timestamp}`;
					const newChatRef = doc(db, 'chats', newChatId);

					// Create the new chat document in Firestore
					await setDoc(newChatRef, {
						participants: [user?.firebaseUserId, selectedUser.firebaseUserId],
						lastMessage: { text: 'No messages yet', timestamp: new Date() },
						isDeletedBy: [],
						removedParticipants: [],
						blockedUsers: {}, // No longer used - blocking is handled by userBlocks collection
						hasUnreadMessages: false,
						chatType: '1-1',
						createdAt: new Date(),
					});

					const newChat: Chat = {
						chatId: newChatId,
						participants: [
							{ firebaseUserId: user?.firebaseUserId!, imageUrl: user?.imageUrl!, username: user?.username!, role: user?.role! },
							{
								firebaseUserId: selectedUser.firebaseUserId,
								imageUrl: selectedUser.imageUrl,
								username: selectedUser.username,
								role: selectedUser.role,
							},
						],
						lastMessage: { text: 'No messages yet', timestamp: new Date() },
						isDeletedBy: [],
						removedParticipants: [],
						blockedUsers: {}, // No longer used - blocking is handled by userBlocks collection
						hasUnreadMessages: false,
						chatType: '1-1',
					};

					// Add the new chat to the UI lists, replacing any existing chats with the same participants
					setChatList((prev) => {
						// Remove any existing chats with the same participants (to avoid duplicates)
						const filteredList = prev.filter((chat) => !hasSameParticipants(chat, newChat));

						// Sort the list to maintain proper order (newest first)
						const updatedChatList = [newChat, ...filteredList].sort((a, b) => {
							const timeA = a.lastMessage.timestamp ? new Date(a.lastMessage.timestamp).getTime() : Date.now();
							const timeB = b.lastMessage.timestamp ? new Date(b.lastMessage.timestamp).getTime() : Date.now();
							return timeB - timeA; // Descending order (newest first)
						});

						setFilteredChatList(updatedChatList);
						return updatedChatList;
					});

					// Set this as the active chat in the UI
					setActiveChat(newChat);
					setActiveChatId(newChatId);
					localStorage.setItem('activeChatId', newChatId);
					return 'success';
				}

				// If only the other user has left but the current user hasn't, restore the existing chat
				if (hasLeftParticipants && selectedUserLeft && !currentUserLeft) {
					// Remove the current user from isDeletedBy to restore the chat
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
						{ firebaseUserId: user?.firebaseUserId!, imageUrl: user?.imageUrl!, username: user?.username!, role: user?.role! },
						{
							firebaseUserId: selectedUser.firebaseUserId,
							imageUrl: selectedUser.imageUrl,
							username: selectedUser.username,
							role: selectedUser.role,
						},
					],
					lastMessage: chatData.lastMessage || { text: 'No messages yet', timestamp: null },
					blockedUsers: {}, // No longer used - blocking is handled by userBlocks collection
					isDeletedBy: chatData.isDeletedBy || [],
					removedParticipants: chatData.removedParticipants || [],
					hasUnreadMessages: chatData.hasUnreadMessages,
					chatType: chatData.chatType || '1-1',
					groupName: chatData.groupName,
					groupImageUrl: chatData.groupImageUrl,
					createdBy: chatData.createdBy,
					groupSettings: chatData.groupSettings,
				};

				setChatList((prev) => {
					// Check if this exact chat already exists in the list
					const existingChatIndex = prev.findIndex((chat) => chat.chatId === chatId);

					if (existingChatIndex !== -1) {
						// Update the existing chat with the restored data
						const updatedChatList = [...prev];
						updatedChatList[existingChatIndex] = restoredChat;

						// Sort the list to maintain proper order (newest first)
						const sortedList = updatedChatList.sort((a, b) => {
							const timeA = a.lastMessage.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
							const timeB = b.lastMessage.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
							return timeB - timeA; // Descending order (newest first)
						});

						setFilteredChatList(sortedList);
						return sortedList;
					} else {
						// Remove any existing chats with the same participants (to avoid duplicates)
						const filteredList = prev.filter((chat) => !hasSameParticipants(chat, restoredChat));

						// Add the restored chat to the list and sort
						const updatedChatList = [restoredChat, ...filteredList].sort((a, b) => {
							const timeA = a.lastMessage.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
							const timeB = b.lastMessage.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
							return timeB - timeA; // Descending order (newest first)
						});

						setFilteredChatList(updatedChatList);
						return updatedChatList;
					}
				});

				// Force a refresh of the chat list to ensure the restored chat appears
				setTimeout(() => {
					setChatList((prev) => [...prev]);
				}, 100);

				// Also update localStorage to reflect the restored chat
				setTimeout(() => {
					const updatedChatList = chatList.map((chat) => (chat.chatId === chatId ? restoredChat : chat));
					localStorage.setItem('chatList', JSON.stringify(updatedChatList));
				}, 200);

				setActiveChat(restoredChat);
				setActiveChatId(chatId);
				localStorage.setItem('activeChatId', chatId);
				return 'success';
			} else {
				// Before creating a new chat, check if there's an existing chat with the same participants
				// that might be deleted or in a different state
				const existingChatInList = findExistingChatWithParticipants([user?.firebaseUserId!, selectedUser.firebaseUserId]);

				if (existingChatInList) {
					setActiveChat(existingChatInList);
					setActiveChatId(existingChatInList.chatId);
					localStorage.setItem('activeChatId', existingChatInList.chatId);
					return 'success';
				}

				// If the chat does not exist, add it to the chatList/UI but don't create it in Firestore yet
				const newChat: Chat = {
					chatId: chatId,
					participants: [
						{ firebaseUserId: user?.firebaseUserId!, imageUrl: user?.imageUrl!, username: user?.username!, role: user?.role! },
						{
							firebaseUserId: selectedUser.firebaseUserId,
							imageUrl: selectedUser.imageUrl,
							username: selectedUser.username,
							role: selectedUser.role,
						},
					],
					lastMessage: { text: 'No messages yet', timestamp: new Date() }, // No message yet
					isDeletedBy: [],
					removedParticipants: [],
					blockedUsers: {}, // No longer used - blocking is handled by userBlocks collection
					hasUnreadMessages: false,
					chatType: '1-1',
				};

				// Add the new chat to the UI lists, replacing any existing chats with the same participants
				setChatList((prev) => {
					// Remove any existing chats with the same participants (to avoid duplicates)
					const filteredList = prev.filter((chat) => !hasSameParticipants(chat, newChat));

					// Sort the list to maintain proper order (newest first)
					const updatedChatList = [newChat, ...filteredList].sort((a, b) => {
						const timeA = a.lastMessage.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
						const timeB = b.lastMessage.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
						return timeB - timeA; // Descending order (newest first)
					});

					setFilteredChatList(updatedChatList);
					return updatedChatList;
				});

				// Set this as the active chat in the UI
				setActiveChat(newChat);
				setActiveChatId(chatId);
				localStorage.setItem('activeChatId', chatId);
				return 'success';
			}
		},
		[user?.firebaseUserId, chatList, findExistingChatWithParticipants, checkIfUserIsBlocked]
	);

	const handleSetActiveChat = useCallback(
		async (chat: Chat) => {
			setActiveChat(chat);
			localStorage.setItem('activeChatId', chat.chatId);
			setActiveChatId(chat.chatId);

			// Hide chat list on small screens when a chat is selected
			if (isVerySmallScreen) {
				setIsChatsListVisible(false);
			}

			// Real-time listeners will automatically update blocking status

			const userRef = doc(db, 'users', user?.firebaseUserId!);
			await updateDoc(userRef, {
				activeChatId: chat.chatId, // Set the active chat ID in Firestore
			});

			// Mark unread messages as read when user opens chat
			const messagesRef = collection(db, 'chats', chat.chatId, 'messages');

			if (isGroupChat(chat)) {
				// For group chats, mark all messages as read for the current user
				const unreadMessagesQuery = query(messagesRef, where('isRead', '==', false));
				const unreadMessagesSnapshot = await getDocs(unreadMessagesQuery);

				unreadMessagesSnapshot.forEach(async (doc) => {
					await updateDoc(doc.ref, {
						isRead: true, // Mark each message as read
					});
				});
			} else {
				// For 1-1 chats, mark messages sent to current user as read
				const unreadMessagesQuery = query(messagesRef, where('receiverId', '==', user?.firebaseUserId), where('isRead', '==', false));
				const unreadMessagesSnapshot = await getDocs(unreadMessagesQuery);

				unreadMessagesSnapshot.forEach(async (doc) => {
					await updateDoc(doc.ref, {
						isRead: true, // Mark each message as read
					});
				});
			}

			// Update Firestore to reflect no unread messages for this chat
			const chatDocRef = doc(db, 'chats', chat.chatId);
			await updateDoc(chatDocRef, {
				hasUnreadMessages: false, // Set unread to false after the chat is opened
				unreadBy: arrayRemove(user?.firebaseUserId),
			});
		},
		[user?.firebaseUserId, isVerySmallScreen]
	);

	const handleReplyMessage = useCallback((message: Message) => {
		setReplyToMessage(message);
	}, []);

	const handleSendMessage = async () => {
		if ((!currentMessage.trim() && !imageUpload) || !activeChat) return;

		// Check if any participants have left the chat permanently
		if (hasLeftParticipants(activeChat)) {
			console.error('Cannot send message: Some participants have left the chat');
			return;
		}

		const chatId = activeChat.chatId;
		const chatRef = doc(db, 'chats', chatId);
		const messageRef = collection(db, 'chats', chatId, 'messages');

		try {
			// Ensure the chat document is created if it doesn't exist
			const chatDoc = await getDoc(chatRef);
			if (!chatDoc.exists()) {
				await setDoc(chatRef, {
					participants: activeChat.participants?.map((p) => p.firebaseUserId),
					lastMessage: {
						text: currentMessage.trim() || 'Image sent',
						timestamp: serverTimestamp(),
					},
					isDeletedBy: [],
					blockedUsers: {}, // No longer used - blocking is handled by userBlocks collection
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

			// For group chats, we'll handle multiple receivers differently
			const isGroup = isGroupChat(activeChat);
			const receiverIds = isGroup
				? activeChat.participants.filter((p) => p.firebaseUserId !== user?.firebaseUserId).map((p) => p.firebaseUserId)
				: [activeChat.participants.find((p) => p.firebaseUserId !== user?.firebaseUserId)?.firebaseUserId].filter(Boolean);

			const newMessage: Message = {
				id: generateUniqueId(''),
				senderId: user?.firebaseUserId!,
				receiverId: isGroup ? '' : receiverIds[0] || '', // For group chats, receiverId is empty
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

			// Handle notifications for group chats and 1-1 chats
			if (isGroup) {
				// For group chats, send notifications to all participants except sender
				for (const receiverId of receiverIds) {
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
								title: 'New Group Message',
								message: `${user?.username} sent a message to ${activeChat.groupName || 'the group'}.`,
								isRead: false,
								timestamp: serverTimestamp(),
								type: 'MessageReceived',
								userImageUrl: user?.imageUrl,
							};

							const notificationRef = collection(db, 'notifications', receiverId, 'userNotifications');
							await addDoc(notificationRef, notificationData);
						}
					}
				}
			} else {
				// For 1-1 chats, use the first receiver
				const receiverId = receiverIds[0];
				if (receiverId) {
					const recipientRef = doc(db, 'users', receiverId);
					const recipientDoc = await getDoc(recipientRef);
					const recipientData = recipientDoc.data();

					const isRecipientChatting = recipientData?.activeChatId === activeChat.chatId;

					// Send a notification only if the recipient is not currently viewing the chat
					if (!isRecipientChatting) {
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
			}

			// Update the lastMessage field and set hasUnreadMessages to true for the receivers
			await updateDoc(chatRef, {
				lastMessage: {
					text: newMessage.text.trim() || 'Image sent',
					timestamp: serverTimestamp(),
				},
				hasUnreadMessages: true,
				unreadBy: arrayUnion(...receiverIds),
			});

			// Clear the reply context and reset state after sending the message
			setReplyToMessage(null);
			setCurrentMessage('');
			resetImageUpload();

			// Refresh upload limits after successful message send (if image was uploaded)
			if (imageUpload) {
				refreshUploadStats().catch((error) => {
					console.warn('Failed to refresh upload stats:', error);
					// Don't block UI, just log the error
				});
			}
		} catch (error) {
			console.error('Error sending message: ', error);
			// Clear the message field even if there's an error
			setCurrentMessage('');
			setReplyToMessage(null);
			resetImageUpload();
		}
	};

	const handleSearchUserSelection = async (selectedUser: SearchUser) => {
		// Convert SearchUser to User format for startChatIfNotExists
		const userForChat: User = {
			_id: selectedUser.firebaseUserId, // Use firebaseUserId as _id
			firebaseUserId: selectedUser.firebaseUserId,
			username: selectedUser.username,
			email: selectedUser.email || '',
			imageUrl: selectedUser.imageUrl,
			role: selectedUser.role,
			firstName: selectedUser.username.split(' ')[0] || '',
			lastName: selectedUser.username.split(' ').slice(1).join(' ') || '',
			phone: '',
			hasRegisteredCourse: false,
			isActive: true,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			orgId: '',
			countryCode: '',
			isEmailVerified: false,
		};

		// Clear any previous error messages
		setErrorMsg('');

		// Try to start the chat and get the result
		const result = await startChatIfNotExists(userForChat);

		// Only close the modal if the chat was successfully created
		if (result !== 'blocked') {
			setAddUserModalOpen(false);
			setSearchValue('');
		}
	};

	// Group chat helper functions
	const isGroupChat = useCallback((chat: Chat): boolean => {
		return chat?.chatType === 'group' || chat?.participants?.length > 2;
	}, []);

	const getChatDisplayName = useMemo(
		() =>
			(chat: Chat): string => {
				if (isGroupChat(chat) && chat.groupName) {
					return chat.groupName;
				}
				const otherParticipant = chat.participants.find((p) => p.firebaseUserId !== user?.firebaseUserId);
				return otherParticipant?.username || 'Unknown User';
			},
		[isGroupChat, user?.firebaseUserId]
	);

	const getChatDisplayImage = useMemo(
		() =>
			(chat: Chat): string => {
				if (isGroupChat(chat)) {
					// For group chats, return group image if available, otherwise use placeholder
					if (chat.groupImageUrl) {
						return chat.groupImageUrl;
					}
					// Use placeholder image for group chats without custom image
					return 'https://t4.ftcdn.net/jpg/02/53/91/57/360_F_253915708_G8elkrM3HdQPi3txjwTirLDXVfPuqnww.jpg';
				}
				const otherParticipant = chat.participants.find((p) => p.firebaseUserId !== user?.firebaseUserId);
				return otherParticipant?.imageUrl || '';
			},
		[isGroupChat, user?.firebaseUserId]
	);

	const handleGroupUserSelection = useCallback(
		(selectedUser: User) => {
			// Check if user is blocked by current user
			const isBlocked = globalBlockedUsers.includes(selectedUser.firebaseUserId);
			if (isBlocked) {
				// Don't add blocked users to group
				return;
			}

			// Check if user is already selected in new members
			const isAlreadySelected = selectedGroupUsers.some((u) => u.firebaseUserId === selectedUser.firebaseUserId);

			// Check if user is already in current members (not removed) - only for group editing
			const isCurrentMember =
				activeChat?.participants?.some((p) => p.firebaseUserId === selectedUser.firebaseUserId && !removedMembers.includes(p.firebaseUserId)) ||
				false;

			// Only add if not already selected and not a current member
			if (!isAlreadySelected && !isCurrentMember) {
				setSelectedGroupUsers((prev) => [...prev, selectedUser]);
			}
			// Don't clear search value for group chat - keep it for continued searching
		},
		[selectedGroupUsers, activeChat?.participants, removedMembers, globalBlockedUsers]
	);

	const removeGroupUser = useCallback((userId: string) => {
		setSelectedGroupUsers((prev) => prev.filter((u) => u.firebaseUserId !== userId));
	}, []);

	const removeExistingGroupMember = useCallback(
		(userId: string) => {
			if (!activeChat) return;

			// Add to removed members list (pending removal)
			setRemovedMembers((prev) => [...prev, userId]);
		},
		[activeChat]
	);

	const restoreExistingGroupMember = useCallback(
		(userId: string) => {
			if (!activeChat) return;

			// Remove from removed members list (cancel removal)
			setRemovedMembers((prev) => prev.filter((id) => id !== userId));
		},
		[activeChat]
	);

	const createGroupChat = async () => {
		if (!groupName.trim() || selectedGroupUsers.length === 0) return;

		try {
			// Create unique group chat ID
			const groupChatId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			// Prepare participants including the current user
			const allParticipants = [
				{ firebaseUserId: user?.firebaseUserId!, username: user?.username!, imageUrl: user?.imageUrl!, role: user?.role! },
				...selectedGroupUsers.map((u) => ({
					firebaseUserId: u.firebaseUserId,
					username: u.username,
					imageUrl: u.imageUrl,
					role: u.role,
				})),
			];

			// Create chat document
			const chatRef = doc(db, 'chats', groupChatId);
			await setDoc(chatRef, {
				participants: allParticipants.map((p) => p.firebaseUserId),
				chatType: 'group',
				groupName: groupName.trim(),
				groupImageUrl: groupImageUrl.trim() || '',
				createdBy: user?.firebaseUserId,
				groupSettings: {
					onlyAdminsCanAddUsers: false,
					onlyAdminsCanSendMessages: false,
				},
				lastMessage: {
					text: 'Group chat created',
					timestamp: serverTimestamp(),
				},
				isDeletedBy: [],
				blockedUsers: {},
				hasUnreadMessages: false,
			});

			// Create the new chat object
			const newGroupChat: Chat = {
				chatId: groupChatId,
				participants: allParticipants,
				chatType: 'group',
				groupName: groupName.trim(),
				groupImageUrl: groupImageUrl.trim() || '',
				createdBy: user?.firebaseUserId,
				groupSettings: {
					onlyAdminsCanAddUsers: false,
					onlyAdminsCanSendMessages: false,
				},
				lastMessage: {
					text: 'Group chat created',
					timestamp: new Date(),
				},
				isDeletedBy: [],
				blockedUsers: {},
				hasUnreadMessages: false,
			};

			// Add to chat list and set as active
			setChatList((prev) => [newGroupChat, ...prev]);
			setFilteredChatList((prev) => [newGroupChat, ...prev]);
			setActiveChat(newGroupChat);
			setActiveChatId(groupChatId);
			localStorage.setItem('activeChatId', groupChatId);

			// Reset form
			setGroupName('');
			setSelectedGroupUsers([]);
			setGroupSearchValue('');
			setGroupImageUrl('');
			setEnterGroupImageUrl(false);
			setCreateGroupModalOpen(false);
		} catch (error) {
			console.error('Error creating group chat:', error);
		}
	};

	const updateGroupChat = async () => {
		if (!groupName.trim() || !activeChat || !isGroupChat(activeChat)) return;

		try {
			// Get current participants (excluding removed members)
			const currentParticipants = activeChat.participants.filter((p) => !removedMembers.includes(p.firebaseUserId)).map((p) => p.firebaseUserId);

			// Add new participants
			const newParticipants = selectedGroupUsers.map((u) => u.firebaseUserId);
			const allParticipants = [...currentParticipants, ...newParticipants];

			// Remove duplicates from participants array
			const uniqueParticipantIds = [...new Set(allParticipants)];

			// Get current removed participants from the chat
			const chatRef = doc(db, 'chats', activeChat.chatId);
			const chatDoc = await getDoc(chatRef);
			const currentRemovedParticipants = chatDoc.data()?.removedParticipants || [];

			// Remove newly added users from removedParticipants array
			const updatedRemovedParticipants = currentRemovedParticipants.filter((removedUserId: string) => !newParticipants.includes(removedUserId));

			// Update chat document
			await updateDoc(chatRef, {
				participants: uniqueParticipantIds,
				removedParticipants: updatedRemovedParticipants,
				groupName: groupName.trim(),
				groupImageUrl: groupImageUrl.trim() || '',
			});

			// Update local state - eliminate duplicates by using Set
			const finalParticipants = [
				...activeChat.participants.filter((p) => !removedMembers.includes(p.firebaseUserId)),
				...selectedGroupUsers.map((u) => ({
					firebaseUserId: u.firebaseUserId,
					username: u.username,
					imageUrl: u.imageUrl,
					role: u.role,
				})),
			];

			// Remove duplicates based on firebaseUserId
			const uniqueParticipantObjects = finalParticipants.filter(
				(participant, index, self) => index === self.findIndex((p) => p.firebaseUserId === participant.firebaseUserId)
			);

			// Add system messages for newly added users (including those being added back)
			for (const newUser of selectedGroupUsers) {
				await addSystemMessage(activeChat.chatId, 'user_joined', newUser.username);
			}

			const updatedChat: Chat = {
				...activeChat,
				groupName: groupName.trim(),
				groupImageUrl: groupImageUrl.trim() || '',
				participants: uniqueParticipantObjects,
				removedParticipants: updatedRemovedParticipants,
			};

			setActiveChat(updatedChat);
			setChatList((prev) => prev.map((chat) => (chat.chatId === activeChat.chatId ? updatedChat : chat)));
			setFilteredChatList((prev) => prev.map((chat) => (chat.chatId === activeChat.chatId ? updatedChat : chat)));

			// Reset form
			setGroupName('');
			setSelectedGroupUsers([]);
			setGroupSearchValue('');
			setGroupImageUrl('');
			setEnterGroupImageUrl(false);
			setRemovedMembers([]);
			setEditGroupModalOpen(false);
		} catch (error) {
			console.error('Error updating group chat:', error);
		}
	};

	const deleteGroupChat = () => {
		if (!activeChat || user?.role !== 'admin') return;
		setIsDeleteGroupDialogOpen(true);
	};

	const confirmDeleteGroupChat = async () => {
		if (!activeChat || user?.role !== 'admin') return;

		try {
			// Delete the chat document and all its subcollections
			const chatRef = doc(db, 'chats', activeChat.chatId);

			// Delete all messages in the chat
			const messagesRef = collection(db, 'chats', activeChat.chatId, 'messages');
			const messagesSnapshot = await getDocs(messagesRef);
			const deletePromises = messagesSnapshot.docs.map((doc) => deleteDoc(doc.ref));
			await Promise.all(deletePromises);

			// Delete the chat document itself
			await deleteDoc(chatRef);

			// Remove from local state
			setChatList((prev) => prev.filter((chat) => chat.chatId !== activeChat.chatId));
			setFilteredChatList((prev) => prev.filter((chat) => chat.chatId !== activeChat.chatId));

			// Clear active chat if it was the deleted one
			if (activeChatId === activeChat.chatId) {
				setActiveChat(null);
				setActiveChatId('');
				localStorage.removeItem('activeChatId');
			}

			// Close modal and reset state
			setEditGroupModalOpen(false);
			setGroupName('');
			setSelectedGroupUsers([]);
			setGroupSearchValue('');
			setGroupImageUrl('');
			setEnterGroupImageUrl(false);
			setRemovedMembers([]);
		} catch (error) {
			console.error('Error deleting group chat:', error);
		}

		// Close the confirmation dialog
		setIsDeleteGroupDialogOpen(false);
	};

	const handleDeleteChat = (chatId: string) => {
		setChatIdToDelete(chatId);
		setIsDeleteChatDialogOpen(true);
	};

	const handleHideChat = async (chatId: string) => {
		try {
			// Hide chat by adding user to isDeletedBy array (current implementation)
			const chatRef = doc(db, 'chats', chatId);
			await updateDoc(chatRef, {
				isDeletedBy: arrayUnion(user?.firebaseUserId),
			});
		} catch (error) {
			console.error('Error hiding chat:', error);
		}

		// Update local state
		setFilteredChatList((prevChatList) => {
			const filteredChatListAfterHide = prevChatList?.filter((chat) => chat.chatId !== chatId);
			localStorage.setItem('chatList', JSON.stringify(filteredChatListAfterHide));
			return filteredChatListAfterHide;
		});

		setChatList((prevChatList) => {
			const filteredChatListAfterHide = prevChatList?.filter((chat) => chat.chatId !== chatId);
			localStorage.setItem('chatList', JSON.stringify(filteredChatListAfterHide));
			return filteredChatListAfterHide;
		});

		// Reset messages and active chat if necessary
		setMessages([]);
		setReplyToMessage(null);

		if (activeChatId === chatId) {
			setActiveChat(null);
			setActiveChatId('');
			localStorage.setItem('activeChatId', '');
		}

		// Close dialog
		setIsDeleteChatDialogOpen(false);
		setChatIdToDelete('');
	};

	// Function to completely delete a chat and all its messages
	const deleteChatCompletely = async (chatId: string) => {
		try {
			// Delete all messages in the chat
			const messagesRef = collection(db, 'chats', chatId, 'messages');
			const messagesSnapshot = await getDocs(messagesRef);
			const batch = writeBatch(db);

			messagesSnapshot.docs.forEach((doc) => {
				batch.delete(doc.ref);
			});

			// Delete the chat document itself
			batch.delete(doc(db, 'chats', chatId));

			await batch.commit();
			console.log('Chat completely deleted:', chatId);
		} catch (error) {
			console.error('Error deleting chat completely:', error);
		}
	};

	const handleLeaveChat = async (chatId: string) => {
		try {
			// Get chat data to check if it's a group chat
			const chatRef = doc(db, 'chats', chatId);
			const chatDoc = await getDoc(chatRef);

			if (!chatDoc.exists()) {
				console.error('Chat not found');
				return;
			}

			const chatData = chatDoc.data();
			const isGroupChat = chatData.chatType === 'group' || chatData.participants?.length > 2;

			if (isGroupChat) {
				// For group chats, remove user from participants
				await updateDoc(chatRef, {
					participants: arrayRemove(user?.firebaseUserId),
					removedParticipants: arrayUnion(user?.firebaseUserId),
				});

				// Add system message that user left
				await addSystemMessage(chatId, 'user_left', user?.username);
			} else {
				// For 1-1 chats, remove user from participants and delete their messages
				await updateDoc(chatRef, {
					participants: arrayRemove(user?.firebaseUserId),
					removedParticipants: arrayUnion(user?.firebaseUserId),
				});

				// Check if both parties have left the chat
				const updatedChatDoc = await getDoc(chatRef);
				const updatedChatData = updatedChatDoc.data();

				if (updatedChatData && updatedChatData.participants?.length === 0) {
					// Both parties have left, delete the entire chat completely
					await deleteChatCompletely(chatId);
				} else {
					// Only one party has left, delete user's messages and add system message
					const messagesRef = collection(db, 'chats', chatId, 'messages');
					const userMessagesQuery = query(messagesRef, where('senderId', '==', user?.firebaseUserId));
					const userMessagesSnapshot = await getDocs(userMessagesQuery);

					const batch = writeBatch(db);
					userMessagesSnapshot.docs.forEach((doc) => {
						batch.delete(doc.ref);
					});
					await batch.commit();

					// Add system message that user left (for 1-1 chats, this will be visible to the other user)
					await addSystemMessage(chatId, 'user_left', user?.username);
				}
			}

			// Update local state
			setFilteredChatList((prevChatList) => {
				const filteredChatListAfterLeave = prevChatList?.filter((chat) => chat.chatId !== chatId);
				localStorage.setItem('chatList', JSON.stringify(filteredChatListAfterLeave));
				return filteredChatListAfterLeave;
			});

			setChatList((prevChatList) => {
				const filteredChatListAfterLeave = prevChatList?.filter((chat) => chat.chatId !== chatId);
				localStorage.setItem('chatList', JSON.stringify(filteredChatListAfterLeave));
				return filteredChatListAfterLeave;
			});

			// Reset messages and active chat if necessary
			setMessages([]);
			setReplyToMessage(null);

			if (activeChatId === chatId) {
				setActiveChat(null);
				setActiveChatId('');
				localStorage.setItem('activeChatId', '');
			}
		} catch (error) {
			console.error('Error leaving chat:', error);
		}

		// Close dialog
		setIsDeleteChatDialogOpen(false);
		setChatIdToDelete('');
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
		if (!user?.firebaseUserId) return;

		try {
			// Get or create userBlocks document
			const userBlocksRef = doc(db, 'userBlocks', user.firebaseUserId);
			const userBlocksDoc = await getDoc(userBlocksRef);

			let isBlocked = false;
			if (userBlocksDoc.exists()) {
				const userBlocksData = userBlocksDoc.data();
				isBlocked = !!userBlocksData.blockedUsers?.[firebaseUserId];
			}

			if (isBlocked) {
				// Unblock user
				setBlockedUsers((prevList) => prevList?.filter((userId) => userId !== firebaseUserId));
				setGlobalBlockedUsers((prevList) => prevList?.filter((userId) => userId !== firebaseUserId));

				// Remove from userBlocks collection
				await updateDoc(userBlocksRef, {
					[`blockedUsers.${firebaseUserId}`]: deleteField(),
				});

				// Real-time listeners will automatically update the UI
			} else {
				// Block user
				setBlockedUsers((prevList) => [...prevList, firebaseUserId]);
				setGlobalBlockedUsers((prevList) => [...prevList, firebaseUserId]);
				setCurrentMessage('');

				const blockData = {
					blockedSince: new Date(),
					blockedUntil: null,
				};

				// Add to userBlocks collection
				if (!userBlocksDoc.exists()) {
					await setDoc(userBlocksRef, {
						blockedUsers: {
							[firebaseUserId]: blockData,
						},
					});
				} else {
					await updateDoc(userBlocksRef, {
						[`blockedUsers.${firebaseUserId}`]: blockData,
					});
				}

				// Real-time listeners will automatically update the UI
			}
		} catch (error) {
			console.error('Error updating block status: ', error);
		}
	};

	const debouncedFilterChats = useMemo(
		() =>
			debounce((searchValue: string) => {
				if (searchValue) {
					const filteredList = chatList?.filter((chat: Chat) =>
						chat.participants.some(
							(participant: ParticipantData) =>
								(participant.username.toLowerCase().includes(searchValue.toLowerCase()) ||
									chat.groupName?.toLowerCase().includes(searchValue.toLowerCase())) &&
								participant.firebaseUserId !== user?.firebaseUserId
						)
					);
					setFilteredChatList(filteredList);
				} else {
					setFilteredChatList(chatList);
				}
			}, 250),
		[chatList, user?.firebaseUserId]
	);

	const handleFilterChats = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const newSearchValue = e.target.value.trim(); // Capture and trim the new search value
			setSearchChatValue(newSearchValue); // Update the search state
			debouncedFilterChats(newSearchValue.toLowerCase()); // Call the debounced function with the new value
		},
		[debouncedFilterChats]
	);

	const downloadChatHistory = async () => {
		if (!activeChat || !messages.length) {
			console.error('No active chat or messages to download');
			return;
		}

		try {
			// Prepare chat information
			const chatInfo = {
				chatId: activeChat.chatId,
				chatType: activeChat.chatType || '1-1',
				groupName: activeChat.groupName || '',
				participants: activeChat.participants.map((p) => ({
					username: p.username,
				})),
				exportDate: new Date().toISOString(),
				exportedBy: user?.username || 'Unknown',
			};

			// Prepare messages data
			const formattedMessages = messages.map((msg) => ({
				sender: activeChat.participants.find((p) => p.firebaseUserId === msg.senderId)?.username || msg.senderId,
				text: msg.text,
				timestamp: msg.timestamp.toISOString(),
				type: msg.imageUrl ? 'image' : msg.videoUrl ? 'video' : 'text',
				imageUrl: msg.imageUrl || '',
				videoUrl: msg.videoUrl || '',
				isSystemMessage: msg.isSystemMessage || false,
				replyTo: msg.replyTo || '',
				quotedText: msg.quotedText || '',
			}));

			// Create export data structure
			const exportData = {
				chatInfo,
				messages: formattedMessages,
				metadata: {
					totalMessages: messages.length,
					dateRange: {
						firstMessage: messages[0]?.timestamp.toISOString(),
						lastMessage: messages[messages.length - 1]?.timestamp.toISOString(),
					},
					exportFormat: 'JSON',
					version: '1.0',
				},
			};

			// Create and download file
			const blob = new Blob([JSON.stringify(exportData, null, 2)], {
				type: 'application/json',
			});

			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;

			// Generate filename
			const chatName = activeChat.groupName || activeChat.participants.find((p) => p.firebaseUserId !== user?.firebaseUserId)?.username || 'chat';
			const timestamp = new Date().toISOString().split('T')[0];
			a.download = `chat-history-${chatName}-${timestamp}.json`;

			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			console.log('Chat history downloaded successfully');
		} catch (error) {
			console.error('Error downloading chat history:', error);
		}
	};

	const downloadChatHistoryAsPDF = async () => {
		if (!activeChat || !messages.length) {
			console.error('No active chat or messages to download');
			return;
		}

		try {
			// Create PDF content
			const chatName = activeChat.groupName || activeChat.participants.find((p) => p.firebaseUserId !== user?.firebaseUserId)?.username || 'chat';

			let pdfContent = `CHAT HISTORY EXPORT\n`;
			pdfContent += `==================\n\n`;
			pdfContent += `Chat: ${chatName}\n`;
			pdfContent += `Type: ${activeChat.chatType || '1-1'}\n`;
			pdfContent += `Participants: ${activeChat.participants.map((p) => p.username).join(', ')}\n`;
			pdfContent += `Export Date: ${new Date().toLocaleString()}\n`;
			pdfContent += `Total Messages: ${messages.length}\n\n`;
			pdfContent += `MESSAGES\n`;
			pdfContent += `========\n\n`;

			// Add messages
			messages.forEach((msg, index) => {
				const sender = activeChat.participants.find((p) => p.firebaseUserId === msg.senderId)?.username || msg.senderId;
				const timestamp = msg.timestamp.toLocaleString();
				const messageType = msg.imageUrl ? '[IMAGE]' : msg.videoUrl ? '[VIDEO]' : '';

				pdfContent += `${index + 1}. ${sender} (${timestamp})\n`;
				if (msg.isSystemMessage) {
					pdfContent += `   [SYSTEM] ${msg.text}\n`;
				} else {
					pdfContent += `   ${msg.text} ${messageType}\n`;
				}

				// Add media URLs
				if (msg.imageUrl) {
					pdfContent += `   Image URL: ${msg.imageUrl}\n`;
				}
				if (msg.videoUrl) {
					pdfContent += `   Video URL: ${msg.videoUrl}\n`;
				}

				if (msg.replyTo) {
					pdfContent += `   [Reply to message: ${msg.quotedText}]\n`;
				}
				pdfContent += `\n`;
			});

			// Create PDF using browser print functionality
			const printWindow = window.open('', '_blank');
			if (printWindow) {
				printWindow.document.write(`
					<!DOCTYPE html>
					<html>
					<head>
						<title>Chat History - ${chatName}</title>
						<style>
							body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
							.header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
							.message { margin-bottom: 15px; padding: 10px; border-left: 3px solid #007bff; background-color: #f8f9fa; }
							.sender { font-weight: bold; color: #007bff; }
							.timestamp { color: #666; font-size: 0.9em; }
							.system { border-left-color: #dc3545; background-color: #f8d7da; }
							.reply { font-style: italic; color: #666; margin-top: 5px; }
							.media-content { margin-top: 10px; padding: 10px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6; }
							.media-image { max-width: 100%; max-height: 300px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
							.media-url { word-break: break-all; color: #007bff; text-decoration: none; font-size: 0.9em; }
							.media-url:hover { text-decoration: underline; }
							@media print { body { margin: 0; } }
						</style>
					</head>
					<body>
						<div class="header">
							<h1>Chat History Export</h1>
							<p><strong>Chat:</strong> ${chatName}</p>
							<p><strong>Type:</strong> ${activeChat.chatType || '1-1'}</p>
							<p><strong>Participants:</strong> ${activeChat.participants.map((p) => p.username).join(', ')}</p>
							<p><strong>Export Date:</strong> ${new Date().toLocaleString()}</p>
							<p><strong>Total Messages:</strong> ${messages.length}</p>
						</div>
						
						<div class="messages">
							${messages
								.map((msg, _) => {
									const sender = activeChat.participants.find((p) => p.firebaseUserId === msg.senderId)?.username || msg.senderId;
									const timestamp = msg.timestamp.toLocaleString();
									const messageType = msg.imageUrl ? '[IMAGE]' : msg.videoUrl ? '[VIDEO]' : '';
									const isSystem = msg.isSystemMessage;
									const replyText = msg.replyTo ? msg.quotedText : '';

									let mediaContent = '';
									if (msg.imageUrl) {
										mediaContent = `
											<div class="media-content">
												<img src="${msg.imageUrl}" alt="Image" class="media-image" />
												<br />
												<a href="${msg.imageUrl}" target="_blank" class="media-url">View Full Image</a>
											</div>
										`;
									} else if (msg.videoUrl) {
										mediaContent = `
											<div class="media-content">
												<a href="${msg.videoUrl}" target="_blank" class="media-url">View Video: ${msg.videoUrl}</a>
											</div>
										`;
									}

									return `
									<div class="message ${isSystem ? 'system' : ''}">
										<div class="sender">${sender}</div>
										<div class="timestamp">${timestamp}</div>
										<div class="text">${isSystem ? '[SYSTEM] ' : ''}${msg.text} ${messageType}</div>
										${mediaContent}
										${replyText ? `<div class="reply">[Reply to: ${replyText}]</div>` : ''}
									</div>
								`;
								})
								.join('')}
						</div>
					</body>
					</html>
				`);
				printWindow.document.close();

				// Wait for content to load then print
				setTimeout(() => {
					printWindow.print();
					printWindow.close();
				}, 500);
			}

			console.log('PDF download initiated');
		} catch (error) {
			console.error('Error downloading PDF:', error);
		}
	};

	const downloadChatHistoryAsHTML = async () => {
		if (!activeChat || !messages.length) {
			console.error('No active chat or messages to download');
			return;
		}

		try {
			// Create HTML content
			const chatName = activeChat.groupName || activeChat.participants.find((p) => p.firebaseUserId !== user?.firebaseUserId)?.username || 'chat';

			const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Chat History - ${chatName}</title>
	<style>
		body { 
			font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
			margin: 0; 
			padding: 20px; 
			background-color: #f5f5f5; 
			line-height: 1.6; 
		}
		.container { 
			max-width: 800px; 
			margin: 0 auto; 
			background-color: white; 
			border-radius: 8px; 
			box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
			overflow: hidden; 
		}
		.header { 
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
			color: white; 
			padding: 30px; 
			text-align: center; 
		}
		.header h1 { 
			margin: 0 0 10px 0; 
			font-size: 2.5em; 
		}
		.header p { 
			margin: 5px 0; 
			opacity: 0.9; 
		}
		.messages-container { 
			padding: 20px; 
		}
		.message { 
			margin-bottom: 20px; 
			padding: 15px; 
			border-radius: 8px; 
			background-color: #f8f9fa; 
			border-left: 4px solid #007bff; 
		}
		.message.system { 
			border-left-color: #dc3545; 
			background-color: #f8d7da; 
		}
		.sender { 
			font-weight: bold; 
			color: #007bff; 
			margin-bottom: 5px; 
			font-size: 1.1em; 
		}
		.message.system .sender { 
			color: #dc3545; 
		}
		.timestamp { 
			color: #666; 
			font-size: 0.85em; 
			margin-bottom: 8px; 
		}
		.text { 
			margin-bottom: 5px; 
		}
		.reply { 
			font-style: italic; 
			color: #666; 
			margin-top: 8px; 
			padding: 8px; 
			background-color: #e9ecef; 
			border-radius: 4px; 
			border-left: 3px solid #6c757d; 
		}
		.media-indicator { 
			display: inline-block; 
			background-color: #28a745; 
			color: white; 
			padding: 2px 8px; 
			border-radius: 12px; 
			font-size: 0.8em; 
			margin-left: 8px; 
		}
		.media-content {
			margin-top: 10px;
			padding: 10px;
			background-color: #f8f9fa;
			border-radius: 8px;
			border: 1px solid #dee2e6;
		}
		.media-image {
			max-width: 100%;
			max-height: 300px;
			border-radius: 8px;
			box-shadow: 0 2px 8px rgba(0,0,0,0.1);
		}
		.media-url {
			word-break: break-all;
			color: #007bff;
			text-decoration: none;
			font-size: 0.9em;
		}
		.media-url:hover {
			text-decoration: underline;
		}
		@media print { 
			body { margin: 0; background-color: white; }
			.container { box-shadow: none; }
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>Chat History Export</h1>
			<p><strong>Chat:</strong> ${chatName}</p>
			<p><strong>Type:</strong> ${activeChat.chatType || '1-1'}</p>
			<p><strong>Participants:</strong> ${activeChat.participants.map((p) => p.username).join(', ')}</p>
			<p><strong>Export Date:</strong> ${new Date().toLocaleString()}</p>
			<p><strong>Total Messages:</strong> ${messages.length}</p>
		</div>
		
		<div class="messages-container">
			${messages
				.map((msg, _) => {
					const sender = activeChat.participants.find((p) => p.firebaseUserId === msg.senderId)?.username || msg.senderId;
					const timestamp = msg.timestamp.toLocaleString();
					const messageType = msg.imageUrl ? 'IMAGE' : msg.videoUrl ? 'VIDEO' : '';
					const isSystem = msg.isSystemMessage;
					const replyText = msg.replyTo ? msg.quotedText : '';

					let mediaContent = '';
					if (msg.imageUrl) {
						mediaContent = `
							<div class="media-content">
								<img src="${msg.imageUrl}" alt="Image" class="media-image" />
								<br />
								<a href="${msg.imageUrl}" target="_blank" class="media-url">View Full Image</a>
							</div>
						`;
					} else if (msg.videoUrl) {
						mediaContent = `
							<div class="media-content">
								<a href="${msg.videoUrl}" target="_blank" class="media-url">View Video: ${msg.videoUrl}</a>
							</div>
						`;
					}

					return `<div class="message ${isSystem ? 'system' : ''}">
						<div class="sender">${sender}</div>
						<div class="timestamp">${timestamp}</div>
						<div class="text">
							${isSystem ? '[SYSTEM] ' : ''}${msg.text}
							${messageType ? `<span class="media-indicator">${messageType}</span>` : ''}
						</div>
						${mediaContent}
						${replyText ? `<div class="reply">[Reply to: ${replyText}]</div>` : ''}
					</div>`;
				})
				.join('')}
		</div>
	</div>
</body>
</html>`;

			// Create and download file
			const blob = new Blob([htmlContent], {
				type: 'text/html',
			});

			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;

			// Generate filename
			const timestamp = new Date().toISOString().split('T')[0];
			a.download = `chat-history-${chatName}-${timestamp}.html`;

			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			console.log('HTML chat history downloaded successfully');
		} catch (error) {
			console.error('Error downloading HTML chat history:', error);
		}
	};

	const downloadChatHistoryAsTXT = async () => {
		if (!activeChat || !messages.length) {
			console.error('No active chat or messages to download');
			return;
		}

		try {
			// Create TXT content
			const chatName = activeChat.groupName || activeChat.participants.find((p) => p.firebaseUserId !== user?.firebaseUserId)?.username || 'chat';

			let txtContent = `CHAT HISTORY EXPORT\n`;
			txtContent += `==================\n\n`;
			txtContent += `Chat: ${chatName}\n`;
			txtContent += `Type: ${activeChat.chatType || '1-1'}\n`;
			txtContent += `Participants: ${activeChat.participants.map((p) => p.username).join(', ')}\n`;
			txtContent += `Export Date: ${new Date().toLocaleString()}\n`;
			txtContent += `Total Messages: ${messages.length}\n\n`;
			txtContent += `MESSAGES\n`;
			txtContent += `========\n\n`;

			// Add messages
			messages.forEach((msg, index) => {
				const sender = activeChat.participants.find((p) => p.firebaseUserId === msg.senderId)?.username || msg.senderId;
				const timestamp = msg.timestamp.toLocaleString();
				const messageType = msg.imageUrl ? '[IMAGE]' : msg.videoUrl ? '[VIDEO]' : '';

				txtContent += `${index + 1}. ${sender} (${timestamp})\n`;
				if (msg.isSystemMessage) {
					txtContent += `   [SYSTEM] ${msg.text}\n`;
				} else {
					txtContent += `   ${msg.text} ${messageType}\n`;
				}

				// Add media URLs
				if (msg.imageUrl) {
					txtContent += `   Image URL: ${msg.imageUrl}\n`;
				}
				if (msg.videoUrl) {
					txtContent += `   Video URL: ${msg.videoUrl}\n`;
				}

				if (msg.replyTo) {
					txtContent += `   [Reply to message: ${msg.quotedText}]\n`;
				}
				txtContent += `\n`;
			});

			// Create and download file
			const blob = new Blob([txtContent], {
				type: 'text/plain',
			});

			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;

			// Generate filename
			const timestamp = new Date().toISOString().split('T')[0];
			a.download = `chat-history-${chatName}-${timestamp}.txt`;

			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			console.log('TXT chat history downloaded successfully');
		} catch (error) {
			console.error('Error downloading TXT chat history:', error);
		}
	};

	return (
		<DashboardPagesLayout pageName='Messages' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ display: 'flex', width: '100%', height: 'calc(100vh - 4rem)' }}>
				<ChatList
					filteredChatList={filteredChatList}
					activeChatId={activeChatId}
					searchChatValue={searchChatValue}
					isChatsListVisible={isChatsListVisible}
					isVerySmallScreen={isVerySmallScreen}
					isMobileSize={isMobileSize}
					user={user}
					onFilterChats={handleFilterChats}
					onSetActiveChat={handleSetActiveChat}
					onDeleteChat={handleDeleteChat}
					onAddUserClick={() => {
						setAddUserModalOpen(true);
						setFilteredUsers([]);
						setSearchValue('');
					}}
					onCreateGroupClick={async () => {
						// Ensure blocked users are fetched before opening modal
						await fetchAllBlockedUsers();
						// Clear active chat when creating a new group to avoid conflicts
						setActiveChat(null);
						setActiveChatId('');
						setCreateGroupModalOpen(true);
						setGroupName('');
						setSelectedGroupUsers([]);
						setGroupSearchValue('');
						setGroupImageUrl('');
						setEnterGroupImageUrl(false);
					}}
					onChatsListToggle={() => {
						setIsChatsListVisible(true);
						window.scrollTo({ top: 0, behavior: 'smooth' });
					}}
					getChatDisplayName={getChatDisplayName}
					getChatDisplayImage={getChatDisplayImage}
					isGroupChat={isGroupChat}
					globalBlockedUsers={globalBlockedUsers}
					blockedByUsers={blockedByUsers}
				/>

				{/* Message Display */}
				{(!isChatsListVisible || !isVerySmallScreen) && (
					<Box sx={{ display: 'flex', flexDirection: 'column', flex: 10, height: 'calc(100vh - 4rem)', marginLeft: '-0.04rem' }}>
						<ChatHeader
							activeChat={activeChat}
							user={user}
							isMobileSize={isMobileSize}
							isVerySmallScreen={isVerySmallScreen}
							isBlockingUser={isBlockingUser || false}
							blockedUsers={blockedUsers}
							getChatDisplayName={getChatDisplayName}
							getChatDisplayImage={getChatDisplayImage}
							isGroupChat={isGroupChat}
							onBlockUnblockUser={handleBlockUnblockUser}
							onDownloadChatHistory={downloadChatHistory}
							onDownloadChatHistoryAsPDF={downloadChatHistoryAsPDF}
							onDownloadChatHistoryAsHTML={downloadChatHistoryAsHTML}
							onDownloadChatHistoryAsTXT={downloadChatHistoryAsTXT}
							onEditGroupChat={() => {
								if (activeChat && isGroupChat(activeChat)) {
									setGroupName(activeChat.groupName || '');
									setGroupImageUrl(activeChat.groupImageUrl || '');
									setSelectedGroupUsers([]);
									setGroupSearchValue('');
									setEnterGroupImageUrl(false);
									setRemovedMembers([]); // Reset removed members when opening edit modal
									setEditGroupModalOpen(true);
								}
							}}
							onViewGroupMembers={() => {
								if (activeChat && isGroupChat(activeChat)) {
									setMembersModalOpen(true);
								}
							}}
						/>

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
								maxHeight: '85vh',
								position: 'relative',
								borderLeft: 'none',
							}}>
							<MessageList
								messages={messages}
								activeChat={activeChat}
								user={user}
								isMobileSize={isMobileSize}
								messageRefs={messageRefs}
								onReplyMessage={handleReplyMessage}
								onDeleteMessage={(messageId) => {
									setIsDeleteMessageOpen(true);
									setMessageIdToDelete(messageId);
								}}
								onZoomImage={setZoomedImage}
								onScrollToOriginalMessage={scrollToOriginalMessage}
								isGroupChat={isGroupChat}
								globalBlockedUsers={globalBlockedUsers}
							/>
							<div ref={messagesEndRef} />
						</Box>

						<CustomDialog
							openModal={isDeleteMessageOpen}
							closeModal={() => {
								setIsDeleteMessageOpen(false);
								setMessageIdToDelete('');
							}}
							maxWidth='xs'
							title='Delete Message'
							content={`Are you sure you want to delete this message?`}>
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
								actionSx={{ mb: '0.5rem' }}
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
									padding: isMobileSize ? '0.5rem' : '0.75rem',
									position: 'relative',
								}}>
								<Typography
									variant='body2'
									sx={{ color: 'gray', mb: isMobileSize ? '0.15rem' : '0.35rem', fontSize: isMobileSize ? '0.7rem' : '0.85rem' }}>
									Replying to:
								</Typography>
								<Typography sx={{ fontSize: isMobileSize ? '0.65rem' : '0.8rem', lineHeight: isMobileSize ? '1.6' : '1.8' }}>
									{replyToMessage.text}
								</Typography>
								<IconButton size='small' sx={{ position: 'absolute', top: '0.2rem', right: '0.2rem' }} onClick={() => setReplyToMessage(null)}>
									<Cancel fontSize='small' sx={{ fontSize: isMobileSize ? '0.9rem' : undefined }} />
								</IconButton>
							</Box>
						)}

						{/* Input Box */}
						<Box
							sx={{
								display: 'flex',
								alignItems: 'center',
								borderTop: '0.04rem solid gray',
								padding: isMobileSize ? '0.25rem' : '1rem',
								flexShrink: 0,
								position: 'relative',
							}}>
							<MessageInput
								currentMessage={currentMessage}
								imageUpload={imageUpload}
								imagePreview={imagePreview || ''}
								showPicker={showPicker}
								isUploading={isUploading}
								isBlockedUser={isBlockedUser}
								isBlockingUser={isBlockingUser || false}
								activeChat={activeChat}
								user={user}
								isMobileSize={isMobileSize}
								isRotatedMedium={isRotatedMedium}
								isVerySmallScreen={isVerySmallScreen}
								isRotated={isRotated}
								isLargeImgMessageOpen={isLargeImgMessageOpen || false}
								uploadInfo={uploadInfo}
								getRemainingImageUploads={getRemainingImageUploads}
								getFormattedResetTime={getFormattedResetTime}
								hasLeftParticipants={hasLeftParticipants}
								onMessageChange={(e) => {
									if (imageUpload) {
										setCurrentMessage('');
									} else {
										setCurrentMessage(e.target.value);
									}
									resetImageUpload();
								}}
								onImageChange={(e) => {
									handleImageChange(e);
									setCurrentMessage('');
								}}
								onEmojiSelect={handleEmojiSelect}
								onSendMessage={handleSendMessage}
								onTogglePicker={() => setShowPicker(!showPicker)}
								onResetImageUpload={resetImageUpload}
								onCloseLargeImageAlert={() => {
									setIsLargeImgMessageOpen(false);
									resetImageUpload();
								}}
								checkCanUploadImage={checkCanUploadImage}
								checkCanUploadAudio={checkCanUploadAudio}
							/>
						</Box>
					</Box>
				)}
			</Box>

			{/* Custom Dialog for User Search */}
			<CustomDialog
				openModal={addUserModalOpen}
				closeModal={() => {
					setAddUserModalOpen(false);
					setSearchValue('');
					setErrorMsg('');
				}}
				title='Find User'
				maxWidth='sm'>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
						alignItems: 'center',
						width: '100%',
						mb: filteredUsers.length === 0 ? '1.5rem' : '-1rem',
					}}>
					<UserSearchSelect
						key={`search-${errorMsg ? 'error' : 'normal'}`}
						context='messages'
						userRole={user?.role as 'admin' | 'student'}
						value={searchValue}
						onChange={(value) => {
							setSearchValue(value);
							// Clear error message when user starts typing
							if (errorMsg) {
								setErrorMsg('');
							}
						}}
						onSelect={handleSearchUserSelection}
						currentUserId={user?.firebaseUserId}
						blockedUsers={globalBlockedUsers}
						placeholder={user?.role === 'admin' ? 'Search by username, name, or email' : 'Search users by username or name'}
						sx={{ width: '80%' }}
						listSx={{
							margin: '-0.85rem auto 0 0.5rem',
							width: isMobileSize ? '90%' : '70%',
							paddingTop: isMobileSize ? '0' : filteredUsers.length < 6 ? '0rem' : '2.5rem',
						}}
					/>
					{errorMsg && (
						<Box sx={{ mt: '-1rem', width: '90%' }}>
							<CustomErrorMessage sx={{ fontSize: '0.75rem' }}>{errorMsg}</CustomErrorMessage>
						</Box>
					)}
				</Box>
			</CustomDialog>

			<GroupChatModal
				createGroupModalOpen={createGroupModalOpen}
				groupName={groupName}
				groupImageUrl={groupImageUrl}
				enterGroupImageUrl={enterGroupImageUrl}
				selectedGroupUsers={selectedGroupUsers}
				groupSearchValue={groupSearchValue}
				user={user}
				blockedUsers={globalBlockedUsers}
				onCloseModal={() => {
					setCreateGroupModalOpen(false);
					setGroupName('');
					setSelectedGroupUsers([]);
					setGroupSearchValue('');
					setGroupImageUrl('');
					setEnterGroupImageUrl(false);
				}}
				onGroupNameChange={(e) => setGroupName(e.target.value)}
				onGroupImageUpload={(url) => setGroupImageUrl(url)}
				onGroupImageUrlChange={(e) => setGroupImageUrl(e.target.value)}
				onEnterGroupImageUrlChange={setEnterGroupImageUrl}
				onGroupUserSelection={handleGroupUserSelection}
				onRemoveGroupUser={removeGroupUser}
				onGroupSearchChange={setGroupSearchValue}
				onCreateGroupChat={createGroupChat}
			/>

			<GroupChatEditModal
				editGroupModalOpen={editGroupModalOpen}
				activeChat={activeChat}
				groupName={groupName}
				groupImageUrl={groupImageUrl}
				selectedGroupUsers={selectedGroupUsers}
				groupSearchValue={groupSearchValue}
				removedMembers={removedMembers}
				user={user}
				blockedUsers={globalBlockedUsers}
				onCloseModal={() => {
					setEditGroupModalOpen(false);
					setGroupName('');
					setSelectedGroupUsers([]);
					setGroupSearchValue('');
					setGroupImageUrl('');
					setEnterGroupImageUrl(false);
					setRemovedMembers([]); // Reset removed members on cancel/close
				}}
				onGroupNameChange={(e) => setGroupName(e.target.value)}
				onGroupImageUpload={(url) => setGroupImageUrl(url)}
				onGroupImageUrlChange={(e) => setGroupImageUrl(e.target.value)}
				onGroupUserSelection={handleGroupUserSelection}
				onRemoveGroupUser={removeGroupUser}
				onRemoveExistingMember={removeExistingGroupMember}
				onRestoreExistingMember={restoreExistingGroupMember}
				onGroupSearchChange={setGroupSearchValue}
				onUpdateGroupChat={updateGroupChat}
				onDeleteGroupChat={deleteGroupChat}
			/>

			<GroupMembersModal membersModalOpen={membersModalOpen} activeChat={activeChat} onCloseModal={() => setMembersModalOpen(false)} />

			{/* Delete Chat Dialog */}
			<CustomDialog
				openModal={isDeleteChatDialogOpen}
				closeModal={() => {
					setIsDeleteChatDialogOpen(false);
					setChatIdToDelete('');
				}}
				title='Remove Chat'
				maxWidth='sm'>
				<Box sx={{ p: 2, mt: '-1rem' }}>
					<Typography variant='body2' sx={{ mb: 2, textAlign: 'center', fontSize: isMobileSize ? '0.75rem' : undefined }}>
						Choose how to remove this chat:
					</Typography>

					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						{/* Hide Chat Option - Available for all users */}
						<Box
							sx={{
								'p': 2,
								'border': '1px solid #e0e0e0',
								'borderRadius': 1,
								'cursor': 'pointer',
								'transition': 'background-color 0.3s ease',
								'&:hover': {
									backgroundColor: 'lightblue',
								},
							}}
							onClick={() => handleHideChat(chatIdToDelete)}>
							<Typography variant='h6' sx={{ mb: 1, color: 'primary.main', fontSize: isMobileSize ? '0.8rem' : undefined }}>
								Hide Chat
							</Typography>
							<Typography variant='body2' sx={{ color: 'text.secondary', lineHeight: '1.7', fontSize: isMobileSize ? '0.7rem' : undefined }}>
								Chat will be hidden from your list but can be restored later. You can still receive messages from this chat.
							</Typography>
							{activeChat?.chatType !== 'group' && (
								<Typography
									variant='body2'
									sx={{ color: 'text.secondary', lineHeight: '1.7', mt: '0.5rem', fontSize: isMobileSize ? '0.7rem' : undefined }}>
									You can also resume chatting after using "Find User" dialog.
								</Typography>
							)}
						</Box>

						{/* Leave Chat Option - Available for learners, not for admins in group chats */}
						{(() => {
							const chatToDelete = chatList.find((chat) => chat.chatId === chatIdToDelete);
							const isGroupChat = chatToDelete?.chatType === 'group';
							const isAdmin = user?.role === 'admin';

							// Show leave option for learners, or for admins in 1-1 chats
							if (!isAdmin || !isGroupChat) {
								return (
									<Box
										sx={{
											'p': 2,
											'border': '1px solid #ff6b6b',
											'borderRadius': 1,
											'cursor': 'pointer',
											'transition': 'background-color 0.3s ease',
											'&:hover': {
												backgroundColor: '#FFB6C1',
											},
										}}
										onClick={() => handleLeaveChat(chatIdToDelete)}>
										<Typography variant='h6' sx={{ mb: 1, color: 'error.main', fontSize: isMobileSize ? '0.8rem' : undefined }}>
											Leave Chat Permanently
										</Typography>
										<Typography variant='body2' sx={{ color: 'text.secondary', lineHeight: '1.7', fontSize: isMobileSize ? '0.7rem' : undefined }}>
											You will be removed from this conversation. Your messages will be deleted and you won't receive future messages from this chat.
										</Typography>
										{!isGroupChat && (
											<Typography
												variant='caption'
												sx={{
													mt: 2,
													color: 'text.secondary',
													textAlign: 'center',
													display: 'block',
													lineHeight: '1.7',
													fontSize: isMobileSize ? '0.65rem' : undefined,
												}}>
												Note: You can start a new conversation with this person later if neither of you has blocked the other.
											</Typography>
										)}
									</Box>
								);
							}
							return null;
						})()}
					</Box>
				</Box>
			</CustomDialog>

			{/* Delete Group Chat Confirmation Dialog */}
			<CustomDialog openModal={isDeleteGroupDialogOpen} closeModal={() => setIsDeleteGroupDialogOpen(false)} title='Delete Group Chat' maxWidth='xs'>
				<DialogContent>
					<Box sx={{ mt: '-0rem', p: 1 }}>
						<Typography variant='body2' sx={{ mb: 2 }}>
							Are you sure you want to delete the group "{activeChat?.groupName}"?
						</Typography>
						<Typography variant='body2' sx={{ textAlign: 'center', color: 'error.main', fontSize: '0.75rem' }}>
							This action cannot be undone and will permanently delete all messages and data for all participants.
						</Typography>
					</Box>
				</DialogContent>
				<CustomDialogActions
					deleteBtn
					deleteBtnText='Delete Group'
					onCancel={() => setIsDeleteGroupDialogOpen(false)}
					onDelete={confirmDeleteGroupChat}
					actionSx={{ mb: '0.5rem' }}
				/>
			</CustomDialog>
		</DashboardPagesLayout>
	);
};

export default Messages;
