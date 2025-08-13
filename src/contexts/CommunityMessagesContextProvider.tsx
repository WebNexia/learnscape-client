import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState, useCallback } from 'react';
import { OrganisationContext } from './OrganisationContextProvider';
import { CommunityMessage } from '../interfaces/communityMessage';
import { CommunityContext } from './CommunityContextProvider';

interface CommunityMessagesContextTypes {
	messages: CommunityMessage[];
	sortMessages: (property: keyof CommunityMessage, order: 'asc' | 'desc') => void;
	addNewMessage: (newMessage: CommunityMessage) => void;
	removeMessage: (id: string) => void;
	updateMessage: (messageId: string, updates: Partial<CommunityMessage>) => void;
	numberOfPages: number;
	pageNumber: number;
	setPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchMessages: (topicId: string) => void;
	fetchMoreMessages: (topicId: string, startPage: number, endPage: number) => void;
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
	sortMessages: () => {},
	addNewMessage: () => {},
	removeMessage: () => {},
	updateMessage: () => {},
	numberOfPages: 1,
	pageNumber: 1,
	setPageNumber: () => {},
	fetchMessages: () => {},
	fetchMoreMessages: () => {},
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

	const [messages, setMessages] = useState<CommunityMessage[]>([]);
	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [pageNumber, setPageNumber] = useState<number>(1);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);
	const [isLoaded, setIsLoaded] = useState<boolean>(false);
	const [currentTopicId, setCurrentTopicId] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const fetchMessages = useCallback(
		async (topicId: string) => {
			if (!orgId || !topicId) return;

			setLoading(true);
			setError(null);

			try {
				// Fetch first batch of messages with traditional pagination
				const response = await axios.get(`${base_url}/communityMessages/topic/${topicId}?page=1&limit=4`);

				// Store only the first batch of messages in state
				setMessages(response.data.messages);

				// Calculate frontend pages based on total messages from backend and frontend pageSize (2)
				const frontendPageSize = 2;
				const totalPages = Math.ceil(response.data.totalMessages / frontendPageSize);
				setNumberOfPages(totalPages);
				setTotalItems(response.data.totalMessages);
				setLoadedPages([1]); // First batch loaded
				setCurrentTopicId(topicId);
				setIsLoaded(true);
				return response.data.messages;
			} catch (error: any) {
				const errorMessage = error.response?.data?.message || 'Failed to fetch messages';
				setError(errorMessage);
				setIsLoaded(true);
				throw error;
			} finally {
				setLoading(false);
			}
		},
		[orgId, base_url]
	);

	const fetchMoreMessages = async (topicId: string, startPage: number, endPage: number) => {
		if (!orgId || !topicId || topicId !== currentTopicId) {
			return;
		}

		try {
			// Calculate which pages we need to fetch
			const pagesToFetch: number[] = [];
			for (let page = startPage; page <= endPage; page++) {
				if (!loadedPages.includes(page)) {
					pagesToFetch.push(page);
				}
			}

			if (pagesToFetch.length === 0) {
				return; // Already loaded
			}

			// Fetch missing pages
			let newMessages: CommunityMessage[] = [];
			for (const page of pagesToFetch) {
				const url = `${base_url}/communityMessages/topic/${topicId}?page=${page}&limit=4`;

				const response: any = await axios.get(url);

				newMessages = [...newMessages, ...response.data.messages];
			}

			// Use functional state update to avoid stale closure
			setMessages((prevMessages) => {
				const combinedData = [...prevMessages, ...newMessages];
				const uniqueData = combinedData.filter((message, index, self) => index === self.findIndex((m) => m._id === message._id));
				const sortedData = uniqueData.sort((a: CommunityMessage, b: CommunityMessage) => a.createdAt.localeCompare(b.createdAt));

				return sortedData;
			});
			setLoadedPages([...loadedPages, ...pagesToFetch]);
		} catch (error: any) {
			console.error('❌ Error fetching more messages:', error);
			setError('Failed to fetch more messages');
		}
	};

	// Function to refresh data
	const refreshData = () => {
		setIsLoaded(false);
		setError(null);
		setMessages([]);
		setLoadedPages([]);
		if (currentTopicId) {
			fetchMessages(currentTopicId);
		}
	};

	// Function to handle sorting
	const sortMessages = (property: keyof CommunityMessage, order: 'asc' | 'desc') => {
		const sortedMessagesCopy = [...messages].sort((a: CommunityMessage, b: CommunityMessage) => {
			const aValue = a[property];
			const bValue = b[property];

			if (aValue === undefined || bValue === undefined) return 0;

			if (order === 'asc') {
				return (aValue ?? '') > (bValue ?? '') ? 1 : -1;
			} else {
				return (aValue ?? '') < (bValue ?? '') ? 1 : -1;
			}
		});
		setMessages(sortedMessagesCopy);
	};

	// Function to add new message
	const addNewMessage = (newMessage: CommunityMessage) => {
		setMessages((prevMessages) => [...prevMessages, newMessage]); // Add to end (newest)
		setTotalItems((prevTotalItems) => {
			const newTotalItems = prevTotalItems + 1;
			// Update number of pages based on new total
			const frontendPageSize = 2;
			const newTotalPages = Math.ceil(newTotalItems / frontendPageSize);
			setNumberOfPages(newTotalPages);
			// Navigate to the last page to show the new message
			setPageNumber(newTotalPages);

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
		setMessages((prevMessages) => prevMessages.filter((message) => message._id !== id));
		setTotalItems((prevTotalItems) => {
			const newTotalItems = Math.max(0, prevTotalItems - 1);
			// Update number of pages based on new total
			const frontendPageSize = 2;
			setNumberOfPages(Math.ceil(newTotalItems / frontendPageSize));

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
		setMessages((prevMessages) => prevMessages.map((message) => (message._id === messageId ? { ...message, ...updates } : message)));
	};

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
