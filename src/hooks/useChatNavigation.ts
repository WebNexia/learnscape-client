import { useCallback, useMemo, useRef } from 'react';
import { updateDoc, collection, query, doc, getDoc, where, arrayRemove, writeBatch, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../interfaces/user';
import { SearchUser } from '../interfaces/search';
import { Chat, Message } from '../pages/Messages';

export interface UseChatNavigationProps {
	user: User | null | undefined;
	activeChatId: string | null;
	globalBlockedUsers: string[];
	isVerySmallScreen: boolean;
	createNewChat: (selectedUser: User) => Promise<'success' | 'blocked'>;
	setActiveChat: React.Dispatch<React.SetStateAction<Chat | null>>;
	setActiveChatId: React.Dispatch<React.SetStateAction<string | null>>;
	setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
	setReplyToMessage: React.Dispatch<React.SetStateAction<Message | null>>;
	setHasMoreMessages: React.Dispatch<React.SetStateAction<boolean>>;
	setIsLoadingMore: React.Dispatch<React.SetStateAction<boolean>>;
	setChatList: React.Dispatch<React.SetStateAction<Chat[]>>;
	setFilteredChatList: React.Dispatch<React.SetStateAction<Chat[]>>;
	setIsChatsListVisible: React.Dispatch<React.SetStateAction<boolean>>;
	setErrorMsg: React.Dispatch<React.SetStateAction<string>>;
	setAddUserModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setSearchValue: React.Dispatch<React.SetStateAction<string>>;
	isGroupChat: (chat: Chat) => boolean;
	refreshChatList: () => Promise<void>;
}

export interface UseChatNavigationReturn {
	messageRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
	scrollToOriginalMessage: (messageId: string) => void;
	startChatIfNotExists: (selectedUser: User) => Promise<'success' | 'blocked'>;
	handleSetActiveChat: (chat: Chat) => Promise<void>;
	handleReplyMessage: (message: Message) => void;
	handleSearchUserSelection: (selectedUser: SearchUser) => Promise<void>;
	getChatDisplayName: (chat: Chat) => string;
	getChatDisplayImage: (chat: Chat) => string;
}

export const useChatNavigation = ({
	user,
	activeChatId,
	globalBlockedUsers,
	isVerySmallScreen,
	createNewChat,
	setActiveChat,
	setActiveChatId,
	setMessages,
	setReplyToMessage,
	setHasMoreMessages,
	setIsLoadingMore,
	setChatList,
	setFilteredChatList,
	setIsChatsListVisible,
	setErrorMsg,
	setAddUserModalOpen,
	setSearchValue,
	isGroupChat,
	refreshChatList,
}: UseChatNavigationProps): UseChatNavigationReturn => {
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

	const startChatIfNotExists = useCallback(
		async (selectedUser: User): Promise<'success' | 'blocked'> => {
			if (!user?.firebaseUserId) return 'blocked';

			const chatId = [user.firebaseUserId, selectedUser.firebaseUserId].sort().join('&');
			const chatRef = doc(db, 'chats', chatId);

			try {
				const chatSnap = await getDoc(chatRef);

				if (chatSnap.exists()) {
					const chatData = chatSnap.data();

					const participants: string[] = chatData.participants || [];
					const removed: string[] = chatData.removedParticipants || [];

					const activeUsers = participants.filter((uid) => !removed.includes(uid));

					// ✅ ORPHAN DETECTED: Nobody is active → DELETE and start fresh
					if (activeUsers.length === 0) {
						try {
							await deleteDoc(chatRef); // Clean up ghost chat
						} catch (deleteError) {
							// ✅ If deletion fails (document doesn't exist), just log and continue
							console.error('Orphaned chat already deleted or permission denied, proceeding to create new chat');
						}
						return await createNewChat(selectedUser);
					}

					const wasPermanentlyLeft = removed.includes(user.firebaseUserId);
					const wasHidden = chatData.isDeletedBy?.includes(user.firebaseUserId);

					if (wasPermanentlyLeft) {
						return await createNewChat(selectedUser); // DO NOT revive
					}

					if (wasHidden) {
						await updateDoc(chatRef, {
							isDeletedBy: arrayRemove(user.firebaseUserId),
						});

						// ✅ FIX: Refresh chat list to show the resumed chat with full participant data
						await refreshChatList();

						// ✅ FIX: Set session storage so useChatList can restore the active chat
						sessionStorage.setItem('activeChatId', chatId);
						return 'success';
					}

					setActiveChat(chatData as Chat);
					setActiveChatId(chatId);
					sessionStorage.setItem('activeChatId', chatId);
					return 'success';
				}

				// ✅ If no chat existed, create a fresh one
				return await createNewChat(selectedUser);
			} catch (error) {
				console.error('❌ Error in startChatIfNotExists:', error);

				// Try to delete the orphaned chat document
				try {
					await deleteDoc(chatRef);
				} catch (deleteError) {
					console.error('Error deleting orphaned chat:', deleteError);
				}

				return await createNewChat(selectedUser);
			}
		},
		[user?.firebaseUserId, createNewChat, refreshChatList]
	);

	const handleSetActiveChat = useCallback(
		async (chat: Chat) => {
			// ✅ Only clear messages if switching to a different chat
			if (activeChatId !== chat.chatId) {
				setMessages([]);
				setReplyToMessage(null);
				// ✅ IMMEDIATE: Reset Load More button state to prevent flickering
				setHasMoreMessages(false);
				setIsLoadingMore(false);
			}

			// ✅ Single atomic visual update
			setActiveChat(chat);
			setActiveChatId(chat.chatId);
			sessionStorage.setItem('activeChatId', chat.chatId);

			// ✅ Clear unread status in UI state immediately
			const clearUnread = (c: Chat) => (c.chatId === chat.chatId ? { ...c, hasUnreadMessages: false, unreadMessagesCount: 0, unreadBy: [] } : c);

			setChatList((prev) => prev.map(clearUnread));
			setFilteredChatList((prev) => prev.map(clearUnread));

			if (isVerySmallScreen) setIsChatsListVisible(false);

			// ✅ FIXED: Mark messages as read and update chat document
			try {
				const chatDocRef = doc(db, 'chats', chat.chatId);
				const chatDoc = await getDoc(chatDocRef);

				if (!chatDoc.exists()) {
					console.error('Chat document does not exist:', chat.chatId);
					return;
				}

				const chatData = chatDoc.data();
				const currentUnreadBy = chatData?.unreadBy || [];

				// Check if user is in unreadBy array
				if (!currentUnreadBy.includes(user?.firebaseUserId)) {
					// User already marked as read, nothing to do
					return;
				}

				const batch = writeBatch(db);

				// For 1-1 chats: mark unread messages as read
				if (!isGroupChat(chat)) {
					const messagesRef = collection(db, 'chats', chat.chatId, 'messages');
					const unreadMessagesQuery = query(messagesRef, where('receiverId', '==', user?.firebaseUserId), where('isRead', '==', false));

					const snap = await getDocs(unreadMessagesQuery);
					snap.docs.forEach((messageDoc) => {
						batch.update(messageDoc.ref, { isRead: true });
					});
				}

				// Remove user from unreadBy array
				const updatedUnreadBy = currentUnreadBy.filter((uid: string) => uid !== user?.firebaseUserId);

				// Update chat document: remove user from unreadBy
				// Set hasUnreadMessages to true only if other users still have unread messages
				batch.update(chatDocRef, {
					unreadBy: arrayRemove(user?.firebaseUserId),
					hasUnreadMessages: updatedUnreadBy.length > 0, // true if others still have unread
				});

				// ✅ FIXED: Await batch commit to ensure update completes
				await batch.commit();
			} catch (error) {
				console.error('❌ Error marking messages as read:', error);
			}
		},
		[user?.firebaseUserId, isVerySmallScreen, globalBlockedUsers, activeChatId, isGroupChat, refreshChatList]
	);

	const handleReplyMessage = useCallback((message: Message) => {
		setReplyToMessage(message);
	}, []);

	const handleSearchUserSelection = useCallback(
		async (selectedUser: SearchUser) => {
			// Convert SearchUser → User
			const userForChat: User = {
				_id: selectedUser.firebaseUserId,
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
				isSubscribed: false,
				subscriptionType: null,
				subscriptionExpiry: '',
				subscriptionStatus: 'none',
				subscriptionValidUntil: '',
				accessLevel: 'limited',
			};

			setErrorMsg('');

			try {
				const result = await startChatIfNotExists(userForChat);

				if (result === 'blocked') {
					setErrorMsg('You cannot start a chat with this user.');
					return;
				}

				setAddUserModalOpen(false);
				setSearchValue('');
			} catch (error) {
				console.error('❌ Error in handleSearchUserSelection:', error);
			}
		},
		[startChatIfNotExists]
	);

	const getChatDisplayName = useMemo(
		() =>
			(chat: Chat): string => {
				if (isGroupChat(chat) && chat.groupName) {
					return chat.groupName;
				}
				const otherParticipant = chat.participants?.find((p) => p.firebaseUserId !== user?.firebaseUserId);
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
				const otherParticipant = chat.participants?.find((p) => p.firebaseUserId !== user?.firebaseUserId);
				return otherParticipant?.imageUrl || '';
			},
		[isGroupChat, user?.firebaseUserId]
	);

	return {
		messageRefs,
		scrollToOriginalMessage,
		startChatIfNotExists,
		handleSetActiveChat,
		handleReplyMessage,
		handleSearchUserSelection,
		getChatDisplayName,
		getChatDisplayImage,
	};
};
