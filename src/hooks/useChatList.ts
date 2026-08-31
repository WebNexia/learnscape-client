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
	fetchChatListFromBackend: (background?: boolean) => Promise<void>;
	refreshChatList: (retries?: number, bypassCache?: boolean) => Promise<void>;
	restoredChat: Chat | null;
}

// Survives Messages unmount so revisits can show stale data while revalidating.
let chatListCache: Chat[] | null = null;
let chatListCacheUserId: string | undefined;

const sortChatList = (chatListData: Chat[]) =>
	[...chatListData].sort((a, b) => {
		const aTime = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
		const bTime = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
		return bTime - aTime;
	});

const getCachedChatList = (userFirebaseId?: string) => {
	if (!userFirebaseId || chatListCacheUserId !== userFirebaseId || chatListCache === null) {
		return null;
	}

	return chatListCache;
};

const persistChatListCache = (userFirebaseId: string | undefined, chatList: Chat[]) => {
	if (!userFirebaseId) return;

	chatListCache = chatList;
	chatListCacheUserId = userFirebaseId;
};

export const useChatList = ({ userFirebaseId, activeChat }: UseChatListProps): UseChatListReturn => {
	const cachedChatList = getCachedChatList(userFirebaseId);
	const [chatList, setChatListState] = useState<Chat[]>(() => cachedChatList ?? []);
	const [filteredChatList, setFilteredChatList] = useState<Chat[]>(() => cachedChatList ?? []);
	const [isLoadingChatList, setIsLoadingChatList] = useState(() => cachedChatList === null);
	const [restoredChat, setRestoredChat] = useState<Chat | null>(null);

	const setChatList = useCallback<React.Dispatch<React.SetStateAction<Chat[]>>>(
		(updater) => {
			setChatListState((prev) => {
				const next = typeof updater === 'function' ? updater(prev) : updater;
				persistChatListCache(userFirebaseId, next);
				return next;
			});
		},
		[userFirebaseId]
	);

	// Function to fetch chat list from backend with retry mechanism
	const fetchChatListFromBackend = useCallback(
		async (background = false) => {
			if (!userFirebaseId) return;

			const hasCachedData = getCachedChatList(userFirebaseId) !== null;
			if (!background && !hasCachedData) {
				setIsLoadingChatList(true);
			}

			try {
				const response = await axios.get('/chats');
				const sortedChatList = sortChatList(response.data);

				persistChatListCache(userFirebaseId, sortedChatList);
				setChatListState(sortedChatList);
				setFilteredChatList(sortedChatList);
			} catch (error) {
				console.error('❌ Error fetching chat list from backend:', error);
				if (!hasCachedData) {
					setChatListState([]);
					setFilteredChatList([]);
				}
			} finally {
				setIsLoadingChatList(false);
			}
		},
		[userFirebaseId]
	);

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
				const sortedChatList = sortChatList(response.data);

				persistChatListCache(userFirebaseId, sortedChatList);
				setChatListState(sortedChatList);
				setFilteredChatList(sortedChatList);
			} catch (error) {
				console.error('❌ Error refreshing chat list:', error);
				if (retries > 0) {
					setTimeout(() => refreshChatList(retries - 1, bypassCache), 1000);
				} else {
					console.error('❌ Failed to refresh chat list after 3 attempts');
				}
			}
		},
		[userFirebaseId, activeChat]
	);

	// Always revalidate on mount/user change; show cached list while fetching when available.
	useEffect(() => {
		if (!userFirebaseId) return;

		const cachedData = getCachedChatList(userFirebaseId);
		if (cachedData) {
			setChatListState(cachedData);
			setFilteredChatList(cachedData);
			setIsLoadingChatList(false);
			fetchChatListFromBackend(true);
			return;
		}

		setChatListState([]);
		setFilteredChatList([]);
		fetchChatListFromBackend(false);
	}, [userFirebaseId, fetchChatListFromBackend]);

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
