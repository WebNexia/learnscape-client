import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useQueryClient } from 'react-query';
import { OrganisationContext } from './OrganisationContextProvider';
import { CommunityMessage } from '../interfaces/communityMessage';
import { CommunityContext } from './CommunityContextProvider';

interface CommunityMessagesContextTypes {
	messages: CommunityMessage[];
	sortMessages: (property: keyof CommunityMessage, order: 'asc' | 'desc') => CommunityMessage[];
	addNewMessage: (newMessage: CommunityMessage) => void;
	removeMessage: (id: string) => void;
	updateMessage: (messageId: string, updates: Partial<CommunityMessage>) => void;
	numberOfPages: number;
	pageNumber: number;
	setPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchMessages: (topicId: string) => Promise<CommunityMessage[]>;
	fetchMoreMessages: (topicId: string, startPage: number, endPage: number) => Promise<void>;
	totalItems: number;
	loadedPages: number[];
	currentTopicId: string;
	loading: boolean;
	error: string | null;
	refreshData: () => void;
}

interface CommunityMessagesContextProviderProps {
	children: ReactNode;
}

export const CommunityMessagesContext = createContext<CommunityMessagesContextTypes>({
	messages: [],
	sortMessages: () => [],
	addNewMessage: () => {},
	removeMessage: () => {},
	updateMessage: () => {},
	numberOfPages: 1,
	pageNumber: 1,
	setPageNumber: () => {},
	fetchMessages: async () => [],
	fetchMoreMessages: async () => {},
	totalItems: 0,
	loadedPages: [],
	currentTopicId: '',
	loading: false,
	error: null,
	refreshData: () => {},
});

const CommunityMessagesContextProvider = (props: CommunityMessagesContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { updateTopics } = useContext(CommunityContext);
	const queryClient = useQueryClient();

	const [pageNumber, setPageNumber] = useState<number>(1);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);
	const [currentTopicId, setCurrentTopicId] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const fetchMessages = useCallback(
		async (topicId: string) => {
			if (!orgId || !topicId) return [];

			setLoading(true);
			setError(null);

			try {
				// Fetch first batch of messages with traditional pagination
				const response = await axios.get(`${base_url}/communityMessages/topic/${topicId}?page=1&limit=250`);

				// Update totalItems from server response
				setTotalItems(response.data.totalMessages || response.data.messages.length);

				// Update loadedPages to track which pages we've fetched
				setLoadedPages([1]);
				setCurrentTopicId(topicId);

				// Store messages in React Query cache for this topic
				queryClient.setQueryData(['communityMessages', topicId], response.data.messages);

				return response.data.messages;
			} catch (error: any) {
				const errorMessage = error.response?.data?.message || 'Failed to fetch messages';
				setError(errorMessage);
				throw error;
			} finally {
				setLoading(false);
			}
		},
		[orgId, base_url, queryClient] // ✅ dependencies → now stable
	);

	const fetchMoreMessages = async (topicId: string, startPage: number, endPage: number) => {
		if (!orgId || !topicId || topicId !== currentTopicId) {
			return;
		}

		try {
			// Fetch all batches from startPage to endPage
			const promises = [];
			for (let page = startPage; page <= endPage; page++) {
				if (!loadedPages?.includes(page)) {
					promises.push(axios.get(`${base_url}/communityMessages/topic/${topicId}?page=${page}&limit=250`));
				}
			}

			if (promises.length === 0) {
				return; // Already loaded
			}

			const responses = await Promise.all(promises);
			const allData = responses.flatMap((response) => response.data.messages);

			// Update React Query cache with new data
			const currentData = (queryClient.getQueryData(['communityMessages', topicId]) as CommunityMessage[]) || [];
			queryClient.setQueryData(['communityMessages', topicId], [...currentData, ...allData]);

			// Update loadedPages to track which pages we've fetched
			const newLoadedPages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
			setLoadedPages((prev) => [...prev, ...newLoadedPages]);
		} catch (error: any) {
			console.error('❌ Error fetching more messages:', error);
			setError('Failed to fetch more messages');
		}
	};

	// Progressive pagination gap-filling (batched)
	useEffect(() => {
		if (loadedPages.length > 0 && currentTopicId) {
			const sortedPages = [...(loadedPages || [])]?.sort((a, b) => a - b) || [];
			const maxPage = Math.max(...sortedPages);

			let missingStart: number | null = null;

			for (let page = 1; page <= maxPage; page++) {
				if (!loadedPages?.includes(page)) {
					if (missingStart === null) {
						missingStart = page; // start of a gap
					}
				} else if (missingStart !== null) {
					// end of a gap -> fetch missing range
					fetchMoreMessages(currentTopicId, missingStart, page - 1);
					missingStart = null;
				}
			}

			// If gap continues till the end
			if (missingStart !== null) {
				fetchMoreMessages(currentTopicId, missingStart, maxPage);
			}
		}
	}, [loadedPages, currentTopicId]);

	// Function to refresh data
	const refreshData = () => {
		setError(null);
		setLoadedPages([]);
		if (currentTopicId) {
			fetchMessages(currentTopicId);
		}
	};

	// Function to handle sorting
	const sortMessages = (property: keyof CommunityMessage, order: 'asc' | 'desc') => {
		// React Query data'yı sort et, local state'e set etme
		const sortedMessagesCopy = [...(messages || [])]?.sort((a: CommunityMessage, b: CommunityMessage) => {
			const aValue = a[property];
			const bValue = b[property];

			if (aValue === undefined || bValue === undefined) return 0;

			if (order === 'asc') {
				return (aValue ?? '') > (bValue ?? '') ? 1 : -1;
			} else {
				return (aValue ?? '') < (bValue ?? '') ? 1 : -1;
			}
		});
		// Local state'e set etme, sadece sort edilmiş data'yı return et
		return sortedMessagesCopy;
	};

	// Function to add new message
	const addNewMessage = (newMessage: CommunityMessage) => {
		queryClient.setQueryData(['communityMessages', currentTopicId], (oldData: CommunityMessage[] | undefined) => {
			return oldData ? [...oldData, newMessage] : [newMessage];
		});

		setTotalItems((prevTotalItems) => {
			const newTotalItems = prevTotalItems + 1;

			// Update the topic's message count in the community context
			if (currentTopicId) {
				updateTopics({
					_id: currentTopicId,
					messageCount: newTotalItems,
				});
			}

			return newTotalItems;
		});
	};

	// Function to remove message
	const removeMessage = (id: string) => {
		queryClient.setQueryData(['communityMessages', currentTopicId], (oldData: CommunityMessage[] | undefined) => {
			return oldData?.filter((message) => message._id !== id) || [];
		});

		setTotalItems((prevTotalItems) => {
			const newTotalItems = Math.max(0, prevTotalItems - 1);

			// Update the topic's message count in the community context
			if (currentTopicId) {
				updateTopics({
					_id: currentTopicId,
					messageCount: newTotalItems,
				});
			}

			return newTotalItems;
		});
	};

	// Function to update message
	const updateMessage = (messageId: string, updates: Partial<CommunityMessage>) => {
		queryClient.setQueryData(['communityMessages', currentTopicId], (oldData: CommunityMessage[] | undefined) => {
			return oldData?.map((message) => (message._id === messageId ? { ...message, ...updates } : message)) || [];
		});
	};

	// Calculate numberOfPages based on totalItems
	const numberOfPages = Math.ceil(totalItems / 25);

	// Get messages data from React Query cache
	const messages = (queryClient.getQueryData(['communityMessages', currentTopicId]) as CommunityMessage[]) || [];

	return (
		<CommunityMessagesContext.Provider
			value={{
				messages,
				sortMessages,
				addNewMessage,
				removeMessage,
				updateMessage,
				numberOfPages,
				pageNumber,
				setPageNumber,
				fetchMessages,
				fetchMoreMessages,
				totalItems,
				loadedPages,
				currentTopicId,
				loading,
				error,
				refreshData,
			}}>
			{props.children}
		</CommunityMessagesContext.Provider>
	);
};

export default CommunityMessagesContextProvider;
