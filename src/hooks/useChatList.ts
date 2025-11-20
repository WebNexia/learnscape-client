import { useState, useCallback, useEffect } from 'react';
import { Chat } from '../pages/Messages';
import axios from '@utils/axiosInstance';

interface UseChatListProps {
	userFirebaseId?: string;
	activeChat?: Chat | null;
}

interface UseChatListReturn {
	chatList: Chat[];
	setChatList: React.Dispatch<React.SetStateAction<Chat[]>>;
	filteredChatList: Chat[];
	setFilteredChatList: React.Dispatch<React.SetStateAction<Chat[]>>;
	isLoadingChatList: boolean;
	fetchChatListFromBackend: () => Promise<void>;
	refreshChatList: (retries?: number) => Promise<void>;
	restoredChat: Chat | null;
}

export const useChatList = ({ userFirebaseId, activeChat }: UseChatListProps): UseChatListReturn => {
	const [chatList, setChatList] = useState<Chat[]>([]);
	const [filteredChatList, setFilteredChatList] = useState<Chat[]>([]);
	const [isLoadingChatList, setIsLoadingChatList] = useState(false);
	const [restoredChat, setRestoredChat] = useState<Chat | null>(null);

	// Function to fetch chat list from backend with retry mechanism
	const fetchChatListFromBackend = useCallback(async () => {
		if (!userFirebaseId) return;

		setIsLoadingChatList(true);
		try {
			const response = await axios.get('/chats');
			const chatListData = response.data;

			// Sort by last message timestamp (most recent first)
			const sortedChatList = chatListData.sort((a: Chat, b: Chat) => {
				// All timestamps are now ISO strings from backend
				const aTime = a.lastMessage.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
				const bTime = b.lastMessage.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
				return bTime - aTime; // Descending order (most recent first)
			});

			// Update state with sorted backend data
			setChatList(sortedChatList);
			setFilteredChatList(sortedChatList);
		} catch (error) {
			console.error('❌ Error fetching chat list from backend:', error);
			// Fallback to empty array
			setChatList([]);
			setFilteredChatList([]);
		} finally {
			setIsLoadingChatList(false);
		}
	}, [userFirebaseId]);

	// Event-driven refresh function with retry mechanism
	const refreshChatList = useCallback(
		async (retries = 3, bypassCache = false) => {
			if (!userFirebaseId) return;

			// PERFORMANCE: Avoid useless backend calls when user switched tab
			if (!document.hasFocus()) return;

			// PERFORMANCE: Only fetch when chat list is visible / user not in active chat
			if (activeChat) return;

			try {
				// Add cache-busting parameter if bypassCache is true
				const url = bypassCache ? `/chats?t=${Date.now()}` : '/chats';
				const response = await axios.get(url);
				const chatListData = response.data;

				// Sort by last message timestamp (most recent first)
				const sortedChatList = chatListData.sort((a: Chat, b: Chat) => {
					const aTime = a.lastMessage.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
					const bTime = b.lastMessage.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
					return bTime - aTime; // Descending order (most recent first)
				});

				setChatList(sortedChatList);
				setFilteredChatList(sortedChatList);
			} catch (error) {
				console.error('❌ Error refreshing chat list:', error);
				if (retries > 0) {
					setTimeout(() => refreshChatList(retries - 1), 1000);
				} else {
					console.error('❌ Failed to refresh chat list after 3 attempts');
				}
			}
		},
		[userFirebaseId, activeChat]
	);

	// Load chat list on mount
	useEffect(() => {
		fetchChatListFromBackend();
	}, [fetchChatListFromBackend]);

	// Restore previously active chat from sessionStorage after chatList loads
	useEffect(() => {
		const savedActiveChatId = sessionStorage.getItem('activeChatId');
		if (savedActiveChatId && chatList.length > 0) {
			const chat = chatList.find((c) => c.chatId === savedActiveChatId);
			if (chat) {
				setRestoredChat(chat);
			}
		}
		setFilteredChatList(chatList);
	}, [chatList]);

	// Window focus listener
	useEffect(() => {
		const handleFocus = () => {
			if (!activeChat) refreshChatList();
		};
		window.addEventListener('focus', handleFocus);
		return () => window.removeEventListener('focus', handleFocus);
	}, [activeChat, refreshChatList]);

	return {
		chatList,
		setChatList,
		filteredChatList,
		setFilteredChatList,
		isLoadingChatList,
		fetchChatListFromBackend,
		refreshChatList,
		restoredChat,
	};
};
