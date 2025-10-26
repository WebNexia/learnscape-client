import { useState, useCallback } from 'react';
import { doc, collection, writeBatch, arrayUnion, arrayRemove, getDocs, getDoc, deleteField } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../interfaces/user';
import { Chat, Message } from '../pages/Messages';

interface UseChatActionsProps {
	user: User | null;
	activeChat: Chat | null;
	activeChatId: string | null;
	chatList: Chat[];
	setChatList: React.Dispatch<React.SetStateAction<Chat[]>>;
	setFilteredChatList: React.Dispatch<React.SetStateAction<Chat[]>>;
	setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
	setReplyToMessage: React.Dispatch<React.SetStateAction<Message | null>>;
	setActiveChat: React.Dispatch<React.SetStateAction<Chat | null>>;
	setActiveChatId: React.Dispatch<React.SetStateAction<string | null>>;
	refreshChatList: () => Promise<void>;
	globalBlockedUsers: string[];
	setGlobalBlockedUsers: React.Dispatch<React.SetStateAction<string[]>>;
	setBlockedUsers: React.Dispatch<React.SetStateAction<string[]>>;

	setIsDeleteChatDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setChatIdToDelete: React.Dispatch<React.SetStateAction<string>>;
	setHasMoreMessages: React.Dispatch<React.SetStateAction<boolean>>;
	setIsLoadingMore: React.Dispatch<React.SetStateAction<boolean>>;
}

interface UseChatActionsReturn {
	// Chat creation
	createNewChat: (selectedUser: User) => Promise<'success' | 'blocked'>;
	createGroupChat: (groupName: string, groupImageUrl: string, selectedUsers: User[]) => Promise<void>;

	// Chat management
	handleHideChat: (chatId: string) => Promise<void>;
	handleLeaveChat: (chatId: string) => Promise<void>;

	// User blocking
	handleBlockUser: (firebaseUserId: string) => Promise<void>;
	handleUnblockUser: (firebaseUserId: string) => Promise<void>;
	handleBlockUnblockUser: (firebaseUserId: string) => Promise<void>;

	// Group management
	updateGroupChat: (chatId: string, groupName: string, groupImageUrl: string, selectedUsers: User[], removedMembers: string[]) => Promise<void>;
	deleteGroupChat: (chatId: string) => Promise<void>;

	// Modal states
	isDeleteGroupDialogOpen: boolean;
	setIsDeleteGroupDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useChatActions = ({
	user,
	activeChat,
	activeChatId,
	chatList,
	setChatList,
	setFilteredChatList,
	setMessages,
	setReplyToMessage,
	setActiveChat,
	setActiveChatId,
	refreshChatList,
	globalBlockedUsers,
	setGlobalBlockedUsers,
	setBlockedUsers,
	setIsDeleteChatDialogOpen,
	setChatIdToDelete,
	setHasMoreMessages,
	setIsLoadingMore,
}: UseChatActionsProps): UseChatActionsReturn => {
	// Modal states
	const [isDeleteGroupDialogOpen, setIsDeleteGroupDialogOpen] = useState<boolean>(false);

	// Create new 1-1 chat
	const createNewChat = useCallback(
		async (selectedUser: User): Promise<'success' | 'blocked'> => {
			if (!user?.firebaseUserId) return 'blocked';

			if (globalBlockedUsers?.includes(selectedUser.firebaseUserId)) return 'blocked';

			// ✅ FIXED: Use sorted chatId strategy like original
			const chatId = [user.firebaseUserId, selectedUser.firebaseUserId].sort().join('&');

			const existingChat = chatList?.find((chat) => chat.chatId === chatId);
			if (existingChat) {
				setActiveChat(existingChat);
				setActiveChatId(chatId);
				sessionStorage.setItem('activeChatId', chatId);
				return 'success';
			}

			const chatRef = doc(db, 'chats', chatId);

			const batch = writeBatch(db);
			const newChatData = {
				participants: [user.firebaseUserId, selectedUser.firebaseUserId],
				removedParticipants: [],
				isDeletedBy: [],
				chatType: '1-1',
				hasUnreadMessages: false,
				unreadBy: [],
				lastMessage: { text: 'No messages yet', timestamp: new Date() },
				createdAt: new Date(),
			};

			batch.set(chatRef, newChatData);

			try {
				await batch.commit();
			} catch (error) {
				console.error('❌ Error creating chat:', error);
				return 'blocked';
			}

			// Set as active chat
			const newChat: Chat = {
				chatId,
				participants: [
					{ firebaseUserId: user.firebaseUserId, username: user.username, imageUrl: user.imageUrl, role: user.role },
					{
						firebaseUserId: selectedUser.firebaseUserId,
						username: selectedUser.username,
						imageUrl: selectedUser.imageUrl,
						role: selectedUser.role,
					},
				],
				chatType: '1-1',
				lastMessage: { text: 'No messages yet', timestamp: new Date() },
				hasUnreadMessages: false,
				unreadMessagesCount: 0,
				removedParticipants: [],
				isDeletedBy: [],
				unreadBy: [],
			};

			setChatList((prev) => {
				const existingChat = prev?.find((chat) => chat.chatId === chatId);
				if (existingChat) {
					return prev;
				}
				return [newChat, ...(prev || [])];
			});
			setFilteredChatList((prev) => {
				const existingChat = prev?.find((chat) => chat.chatId === chatId);
				if (existingChat) {
					return prev;
				}
				return [newChat, ...(prev || [])];
			});

			setActiveChat(newChat);
			setActiveChatId(chatId);
			sessionStorage.setItem('activeChatId', chatId);

			refreshChatList();

			setTimeout(() => {
				setMessages([]);
				setMessages([
					{
						id: 'temp',
						senderId: user.firebaseUserId,
						receiverId: selectedUser.firebaseUserId,
						text: 'Chat started',
						timestamp: new Date(),
						isRead: true,
						imageUrl: '',
						videoUrl: '',
						replyTo: '',
						quotedText: '',
					},
				]);
			}, 100);

			return 'success';
		},
		[user?.firebaseUserId, globalBlockedUsers, refreshChatList]
	);

	// Create group chat
	const createGroupChat = useCallback(
		async (groupName: string, groupImageUrl: string, selectedUsers: User[]) => {
			if (!user?.firebaseUserId) return;

			const allParticipants = [user, ...selectedUsers];
			const participantIds = allParticipants.map((p) => p.firebaseUserId);
			const chatId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			const chatRef = doc(db, 'chats', chatId);

			try {
				const batch = writeBatch(db);

				// ✅ FIXED: Use batch.set() instead of updateDoc for new group chats
				batch.set(chatRef, {
					participants: participantIds,
					chatType: 'group',
					groupName: groupName.trim(),
					groupImageUrl: groupImageUrl.trim() || '',
					createdBy: user.firebaseUserId,
					lastMessage: {
						text: 'Group chat created',
						timestamp: new Date(),
					},
					isDeletedBy: [],
					blockedUsers: {},
					hasUnreadMessages: false,
				});

				await batch.commit();

				// Set as active chat
				const newChat: Chat = {
					chatId,
					participants: allParticipants.map((p) => ({
						firebaseUserId: p.firebaseUserId,
						username: p.username,
						imageUrl: p.imageUrl,
						role: p.role,
					})),
					groupName: groupName.trim(),
					groupImageUrl: groupImageUrl.trim() || '',
					chatType: 'group',
					createdBy: user.firebaseUserId,
					lastMessage: {
						text: 'Group chat created',
						timestamp: new Date(),
					},
					hasUnreadMessages: false,
					unreadMessagesCount: 0,
					removedParticipants: [],
					isDeletedBy: [],
					unreadBy: [],
				};

				// ✅ ADDED: Optimistic UI updates
				setChatList((prev) => [newChat, ...prev]);
				setFilteredChatList((prev) => [newChat, ...prev]);
				setActiveChat(newChat);
				setActiveChatId(chatId);
				sessionStorage.setItem('activeChatId', chatId);

				refreshChatList();
			} catch (error) {
				console.error('Error creating group chat:', error);
			}
		},
		[user?.firebaseUserId, setChatList, setFilteredChatList, setActiveChat, setActiveChatId, refreshChatList]
	);

	// Update group chat
	const updateGroupChat = useCallback(
		async (chatId: string, groupName: string, groupImageUrl: string, selectedUsers: User[], removedMembers: string[]) => {
			if (!user?.firebaseUserId || !activeChat) return;

			try {
				const chatRef = doc(db, 'chats', chatId);
				const batch = writeBatch(db);

				const currentParticipants = activeChat.participants?.filter((p) => !removedMembers.includes(p.firebaseUserId))?.map((p) => p.firebaseUserId);

				const newParticipants = selectedUsers.map((u) => u.firebaseUserId);
				const allParticipants = [...new Set([...currentParticipants, ...newParticipants])];

				const updatedRemovedParticipants = activeChat.removedParticipants?.filter((id) => !newParticipants.includes(id)) || [];

				// ✅ Update main chat data in batch
				batch.update(chatRef, {
					participants: allParticipants,
					removedParticipants: updatedRemovedParticipants,
					groupName: groupName.trim(),
					groupImageUrl: groupImageUrl.trim() || '',
				});

				// ✅ Add system messages for NEW members — but still in the same batch (1 write total!)
				selectedUsers.forEach((newUser) => {
					const messageRef = doc(collection(db, 'chats', chatId, 'messages'));
					batch.set(messageRef, {
						id: newUser.firebaseUserId + '_joined',
						senderId: 'system',
						text: `${newUser.username} joined the chat`,
						timestamp: new Date(),
						isRead: false,
						isSystemMessage: true,
						systemMessageType: 'user_joined',
					});
				});

				await batch.commit(); // ✅ ONE WRITE ONLY

				// ✅ Local UI update — same logic as before
				const finalParticipants = [
					...activeChat.participants.filter((p) => !removedMembers.includes(p.firebaseUserId)),
					...selectedUsers.map((u) => ({
						firebaseUserId: u.firebaseUserId,
						username: u.username,
						imageUrl: u.imageUrl,
						role: u.role,
					})),
				];

				const uniqueParticipantObjects = finalParticipants.filter(
					(participant, index, self) => index === self.findIndex((p) => p.firebaseUserId === participant.firebaseUserId)
				);

				const updatedChat: Chat = {
					...activeChat,
					groupName: groupName.trim(),
					groupImageUrl: groupImageUrl.trim() || '',
					participants: uniqueParticipantObjects,
					removedParticipants: updatedRemovedParticipants,
				};

				setActiveChat(updatedChat);
				setChatList((prev) => prev?.map((chat) => (chat.chatId === chatId ? updatedChat : chat)));
				setFilteredChatList((prev) => prev?.map((chat) => (chat.chatId === chatId ? updatedChat : chat)));

				refreshChatList();
			} catch (error) {
				console.error('Error updating group chat:', error);
			}
		},
		[user?.firebaseUserId, refreshChatList]
	);

	// Delete group chat
	const deleteGroupChat = useCallback(
		async (chatId: string) => {
			if (!user?.firebaseUserId) return;

			try {
				const chatRef = doc(db, 'chats', chatId);
				const messagesRef = collection(db, 'chats', chatId, 'messages');

				const batch = writeBatch(db);

				// ✅ Delete all messages (get ONLY doc refs — no heavy data read)
				const messagesSnapshot = await getDocs(messagesRef);
				messagesSnapshot.forEach((msgDoc) => {
					batch.delete(msgDoc.ref); // ✅ delete message ref
				});

				// ✅ Delete the chat itself
				batch.delete(chatRef);

				await batch.commit(); // ✅ ONE atomic write — deletes EVERYTHING

				// ✅ Remove from UI instantly
				setChatList((prev) => prev?.filter((chat) => chat.chatId !== chatId));
				setFilteredChatList((prev) => prev?.filter((chat) => chat.chatId !== chatId));

				// Clear active chat if it's the deleted one
				if (activeChat?.chatId === chatId) {
					setActiveChat(null);
					setActiveChatId(null);
					sessionStorage.removeItem('activeChatId');
				}

				refreshChatList();
			} catch (error) {
				console.error('Error deleting group chat:', error);
			}
		},
		[user?.firebaseUserId, refreshChatList]
	);

	// Hide chat
	const handleHideChat = useCallback(
		async (chatId: string) => {
			if (!user?.firebaseUserId) return;

			try {
				const chatRef = doc(db, 'chats', chatId);
				const batch = writeBatch(db);

				batch.update(chatRef, {
					isDeletedBy: arrayUnion(user.firebaseUserId),
				});

				await batch.commit();
			} catch (error) {
				console.error('Error hiding chat:', error);
			}

			// ✅ OPTIMISTIC UI UPDATE: Remove chat from state immediately
			setFilteredChatList((prevChatList) => {
				return prevChatList?.filter((chat) => chat.chatId !== chatId);
			});

			setChatList((prevChatList) => {
				return prevChatList?.filter((chat) => chat.chatId !== chatId);
			});

			setMessages([]);
			setReplyToMessage(null);

			if (activeChatId === chatId) {
				setActiveChat(null);
				setActiveChatId(null);
				sessionStorage.setItem('activeChatId', '');
			}

			// ✅ BACKGROUND REFRESH: Refresh from backend to ensure consistency
			refreshChatList();

			setIsDeleteChatDialogOpen(false);
			setChatIdToDelete('');
		},
		[user?.firebaseUserId, activeChatId, refreshChatList]
	);

	// Leave chat
	const handleLeaveChat = useCallback(
		async (chatId: string) => {
			if (!user?.firebaseUserId) return;

			try {
				const chatRef = doc(db, 'chats', chatId);
				const messagesRef = collection(db, 'chats', chatId, 'messages');
				const chatSnap = await getDoc(chatRef);
				if (!chatSnap.exists()) return;

				const chatData = chatSnap.data();
				const participants: string[] = chatData.participants || [];
				const removedUsers: string[] = chatData.removedParticipants || [];

				const activeUsers = participants.filter((uid) => !removedUsers.includes(uid));
				const activeAfter = activeUsers.filter((uid) => uid !== user.firebaseUserId);

				// ✅ CASE 1: LAST active user → MUST DELETE ALL MESSAGES FIRST (rule-safe)
				if (activeAfter.length === 0) {
					const messagesSnapshot = await getDocs(messagesRef);
					const batch = writeBatch(db);

					messagesSnapshot.forEach((msgDoc) => batch.delete(msgDoc.ref)); // delete ALL messages
					batch.delete(chatRef); // then delete chat itself AFTER messages

					await batch.commit();
				} else {
					// ✅ CASE 2: Other users still active → leave normally
					const batch = writeBatch(db);

					batch.update(chatRef, {
						participants: arrayRemove(user.firebaseUserId),
						removedParticipants: arrayUnion(user.firebaseUserId),
					});

					const sysMsgRef = doc(messagesRef);
					batch.set(sysMsgRef, {
						id: sysMsgRef.id,
						senderId: 'system',
						text: `${user.username} left the chat`,
						isSystemMessage: true,
						systemMessageType: 'user_left',
						timestamp: new Date(),
						isRead: false,
						replyTo: '',
						quotedText: '',
					});

					await batch.commit();
				}

				// ✅ OPTIMISTIC UI UPDATE: Remove chat from state immediately
				setChatList((prev) => prev?.filter((c) => c.chatId !== chatId));
				setFilteredChatList((prev) => prev?.filter((c) => c.chatId !== chatId));
				if (activeChatId === chatId) {
					setActiveChat(null);
					setActiveChatId(null);
					sessionStorage.setItem('activeChatId', '');
					// ✅ Reset Load More button state when leaving active chat
					setHasMoreMessages(false);
					setIsLoadingMore(false);
				}
				setMessages([]);
				setReplyToMessage(null);

				// ✅ BACKGROUND REFRESH: Refresh from backend to ensure consistency
				refreshChatList();
			} catch (err) {
				console.error('Error leaving chat:', err);
				alert('Failed to leave chat. Please try again.');
			}

			setIsDeleteChatDialogOpen(false);
			setChatIdToDelete('');
		},
		[user?.firebaseUserId, activeChatId, refreshChatList]
	);

	// Block user
	const handleBlockUser = useCallback(
		async (firebaseUserId: string) => {
			if (!user?.firebaseUserId || !activeChat) return;

			const chatRef = doc(db, 'chats', activeChat.chatId);
			const userBlocksRef = doc(db, 'userBlocks', user.firebaseUserId);

			try {
				const batch = writeBatch(db);

				// Update chat with blocked user
				batch.update(chatRef, {
					[`blockedUsers.${user.firebaseUserId}`]: arrayUnion(firebaseUserId),
				});

				// Update user blocks document
				const userBlocksData = {
					blockedUsers: {
						[firebaseUserId]: true,
					},
				};
				batch.set(userBlocksRef, userBlocksData, { merge: true });

				await batch.commit();

				// Update local state
				setBlockedUsers((prev) => [...prev, firebaseUserId]);
				setGlobalBlockedUsers((prev) => [...prev, firebaseUserId]);
			} catch (error) {
				console.error('Error blocking user:', error);
			}
		},
		[user, activeChat, setBlockedUsers, setGlobalBlockedUsers]
	);

	// Unblock user
	const handleUnblockUser = useCallback(
		async (firebaseUserId: string) => {
			if (!user?.firebaseUserId || !activeChat) return;

			const chatRef = doc(db, 'chats', activeChat.chatId);
			const userBlocksRef = doc(db, 'userBlocks', user.firebaseUserId);

			try {
				const batch = writeBatch(db);

				// Update chat with unblocked user
				batch.update(chatRef, {
					[`blockedUsers.${user.firebaseUserId}`]: arrayRemove(firebaseUserId),
				});

				// Update user blocks document
				batch.update(userBlocksRef, {
					[`blockedUsers.${firebaseUserId}`]: deleteField(),
				});

				await batch.commit();

				// Update local state
				setBlockedUsers((prev) => prev.filter((id) => id !== firebaseUserId));
				setGlobalBlockedUsers((prev) => prev.filter((id) => id !== firebaseUserId));
			} catch (error) {
				console.error('Error unblocking user:', error);
			}
		},
		[user, activeChat, setBlockedUsers, setGlobalBlockedUsers]
	);

	// Block/Unblock user (combined function like original)
	const handleBlockUnblockUser = useCallback(
		async (firebaseUserId: string) => {
			if (!user?.firebaseUserId) return;

			try {
				const isCurrentlyBlocked = globalBlockedUsers?.includes(firebaseUserId);

				if (isCurrentlyBlocked) {
					await handleUnblockUser(firebaseUserId);
				} else {
					await handleBlockUser(firebaseUserId);
				}
			} catch (error) {
				console.error('Error updating block status:', error);
			}
		},
		[user?.firebaseUserId, globalBlockedUsers, handleBlockUser, handleUnblockUser]
	);

	return {
		// Chat creation
		createNewChat,
		createGroupChat,

		// Chat management
		handleHideChat,
		handleLeaveChat,

		// User blocking
		handleBlockUser,
		handleUnblockUser,
		handleBlockUnblockUser,

		// Group management
		updateGroupChat,
		deleteGroupChat,

		// Modal states
		isDeleteGroupDialogOpen,
		setIsDeleteGroupDialogOpen,
	};
};
