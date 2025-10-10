import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useCallback, useContext, useState } from 'react';
import { useQueryClient } from 'react-query';
import DataFetchErrorBoundary from '../components/error/DataFetchErrorBoundary';
import { OrganisationContext } from './OrganisationContextProvider';
import { CommunityMessage } from '../interfaces/communityMessage';
import { CommunityContext } from './CommunityContextProvider';

interface CommunityMessagesContextTypes {
	messages: CommunityMessage[];
	sortMessages: (property: keyof CommunityMessage, order: 'asc' | 'desc') => CommunityMessage[];
	addNewMessage: (newMessage: CommunityMessage) => void;
	removeMessage: (id: string) => void;
	updateMessage: (messageId: string, updates: Partial<CommunityMessage>, topicId?: string) => void;
	numberOfPages: number;
	pageNumber: number;
	setPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchMessages: (topicId: string) => Promise<CommunityMessage[]>;
	fetchMoreMessages: (topicId: string, startPage: number, endPage: number) => Promise<void>;
	fetchSpecificPage: (topicId: string, pageNumber: number) => Promise<CommunityMessage[]>;
	totalItems: number;
	loadedPages: number[];
	currentTopicId: string;
	loading: boolean;
	error: string | null;
	refreshData: () => void;
	enableCommunityMessagesFetch: () => void;
	disableCommunityMessagesFetch: () => void;
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
	fetchSpecificPage: async () => [],
	totalItems: 0,
	loadedPages: [],
	currentTopicId: '',
	loading: false,
	error: null,
	refreshData: () => {},
	enableCommunityMessagesFetch: () => {},
	disableCommunityMessagesFetch: () => {},
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
	const [isEnabled, setIsEnabled] = useState<boolean>(false);
	const [forceUpdate, setForceUpdate] = useState<number>(0);

	const fetchMessages = useCallback(
		async (topicId: string) => {
			if (!isEnabled || !orgId || !topicId) return [];

			setLoading(true);
			setError(null);

			try {
				// Fetch first batch of messages with traditional pagination
				const response = await axios.get(`${base_url}/communityMessages/topic/${topicId}?page=1&limit=200`);

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
		[isEnabled, orgId, base_url, queryClient] // ✅ dependencies → now stable
	);

	// Helper function to process fetched messages and update cache
	const processFetchedMessages = async (response: any, topicId: string, backendPage: number) => {
		// Update totalItems if not already set
		if (response.data.totalMessages && totalItems === 0) {
			setTotalItems(response.data.totalMessages);
		}

		// Get current cached data
		const currentData = (queryClient.getQueryData(['communityMessages', topicId]) as CommunityMessage[]) || [];

		// For smart pagination, we need to maintain chronological order
		// Merge new messages with existing data and sort by createdAt
		const existingIds = new Set(currentData.map((msg) => msg._id));
		const newMessages = response.data.messages.filter((msg: any) => !existingIds.has(msg._id));

		if (newMessages.length > 0) {
			const mergedData = [...currentData, ...newMessages];
			// Sort by createdAt to maintain chronological order (oldest first)
			const sortedData = mergedData.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
			queryClient.setQueryData(['communityMessages', topicId], sortedData);
		}

		// Update loadedPages to track the corresponding backend page
		if (!loadedPages?.includes(backendPage)) {
			setLoadedPages((prev) => [...prev, backendPage]);
		}
	};

	const fetchMoreMessages = async (topicId: string, startPage: number, endPage: number) => {
		if (!orgId || !topicId || topicId !== currentTopicId) {
			return;
		}

		try {
			// Fetch all batches from startPage to endPage
			const promises = [];
			for (let page = startPage; page <= endPage; page++) {
				if (!loadedPages?.includes(page)) {
					promises.push(axios.get(`${base_url}/communityMessages/topic/${topicId}?page=${page}&limit=200`));
				}
			}

			if (promises && promises.length === 0) {
				return; // Already loaded
			}

			const responses = await Promise.all(promises);

			// Process each response to update cache and loadedPages
			for (let i = 0; i < responses.length; i++) {
				const response = responses[i];
				const pageNumber = startPage + i;
				await processFetchedMessages(response, topicId, pageNumber);
			}
		} catch (error: any) {
			console.error('❌ Error fetching more messages:', error);
			setError('Failed to fetch more messages');
		}
	};

	const fetchSpecificPage = async (topicId: string, pageNumber: number): Promise<CommunityMessage[]> => {
		if (!orgId || !topicId) {
			return [];
		}

		try {
			setLoading(true);
			setError(null);

			// Convert frontend page to backend page and fetch directly
			const backendPage = Math.ceil((pageNumber * 20) / 200); // pageSize=20, limit=200

			// Find the highest loaded backend page
			const maxLoadedPage = loadedPages && loadedPages.length > 0 ? Math.max(...loadedPages) : 0;

			// If we need to fill gaps, fetch all missing backend pages
			if (backendPage > maxLoadedPage) {
				await fetchMoreMessages(topicId, maxLoadedPage + 1, backendPage);
			} else {
				// If the page is already loaded, just fetch it directly
				const response = await axios.get(`${base_url}/communityMessages/topic/${topicId}?page=${backendPage}&limit=200`);
				await processFetchedMessages(response, topicId, backendPage);
			}

			return [];
		} catch (error: any) {
			console.error('❌ Error fetching specific page:', error);
			setError('Failed to fetch page');
			return [];
		} finally {
			setLoading(false);
		}
	};

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

			// Update the topic's message count, updatedAt, and lastMessage in the community context
			if (currentTopicId) {
				updateTopics({
					_id: currentTopicId,
					messageCount: newTotalItems,
					updatedAt: new Date().toISOString(),
					lastMessage: {
						text: newMessage.text,
						createdAt: newMessage.createdAt,
						sender: {
							_id: newMessage.userId?._id,
							username: newMessage.userId?.username,
							imageUrl: newMessage.userId?.imageUrl,
						},
					},
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
	const updateMessage = (messageId: string, updates: Partial<CommunityMessage>, topicId?: string) => {
		const targetTopicId = topicId || currentTopicId;

		queryClient.setQueryData(['communityMessages', targetTopicId], (oldData: CommunityMessage[] | undefined) => {
			if (!oldData) return [];
			return oldData.map((message) => {
				if (message._id === messageId) {
					return { ...message, ...updates };
				}
				return message;
			});
		});

		setForceUpdate((prev) => prev + 1);
	};

	// Calculate numberOfPages based on totalItems, with minimum of 1 page
	const numberOfPages = Math.max(1, Math.ceil(totalItems / 20));

	// Get messages data from React Query cache
	const messages = (queryClient.getQueryData(['communityMessages', currentTopicId]) as CommunityMessage[]) || [];

	// Use forceUpdate to ensure re-renders
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const _ = forceUpdate;

	const enableCommunityMessagesFetch = () => setIsEnabled(true);
	const disableCommunityMessagesFetch = () => setIsEnabled(false);

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
				fetchSpecificPage,
				totalItems,
				loadedPages,
				currentTopicId,
				loading,
				error,
				refreshData,
				enableCommunityMessagesFetch,
				disableCommunityMessagesFetch,
			}}>
			<DataFetchErrorBoundary context='CommunityMessages'>{props.children}</DataFetchErrorBoundary>
		</CommunityMessagesContext.Provider>
	);
};

export default CommunityMessagesContextProvider;
