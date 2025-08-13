import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState } from 'react';
import { OrganisationContext } from './OrganisationContextProvider';
import { CommunityMessage } from '../interfaces/communityMessage';

interface CommunityMessagesContextTypes {
	messages: CommunityMessage[];
	sortMessages: (property: keyof CommunityMessage, order: 'asc' | 'desc') => void;
	addNewMessage: (newMessage: CommunityMessage) => void;
	removeMessage: (id: string) => void;
	updateMessage: (messageId: string, updates: Partial<CommunityMessage>) => void;
	numberOfPages: number;
	pageNumber: number;
	setPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchMessages: (topicId: string, page: number) => void;
	fetchMoreMessages: (topicId: string, startPage: number, endPage: number) => void;
	totalItems: number;
	loadedPages: number[];
	currentTopicId: string;
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
});

const CommunityMessagesContextProvider = (props: CommunityMessagesContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

	const [messages, setMessages] = useState<CommunityMessage[]>([]);
	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [pageNumber, setPageNumber] = useState<number>(1);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);
	const [isLoaded, setIsLoaded] = useState<boolean>(false);
	const [currentTopicId, setCurrentTopicId] = useState<string>('');

		const fetchMessages = async (topicId: string, page: number) => {
		if (!orgId || !topicId) return;

		try {
			// Fetch first batch of messages with traditional pagination
			const response = await axios.get(`${base_url}/communityMessages/topic/${topicId}?page=1&limit=200`);
			console.log('Backend response:', {
				messagesCount: response.data.messages.length,
				totalMessages: response.data.totalMessages,
				pagination: response.data.pagination,
				messageIds: response.data.messages.map((m: CommunityMessage) => m._id),
			});

			// Store messages in state
			setMessages(response.data.messages);
			
			// Calculate frontend pages based on total messages and frontend pageSize (25)
			const frontendPageSize = 25;
			setNumberOfPages(Math.ceil(response.data.totalMessages / frontendPageSize));
			setTotalItems(response.data.totalMessages);
			setLoadedPages([1]); // First batch loaded
			setCurrentTopicId(topicId);
			setIsLoaded(true);
			return response.data.messages;
		} catch (error: any) {
			setIsLoaded(true);
			throw error;
		}
	};

	const fetchMoreMessages = async (topicId: string, startPage: number, endPage: number) => {
		console.log('fetchMoreMessages called:', { topicId, startPage, endPage, currentTopicId, orgId });
		if (!orgId || !topicId || topicId !== currentTopicId) {
			console.log('fetchMoreMessages blocked:', { orgId: !!orgId, topicId: !!topicId, topicIdMatch: topicId === currentTopicId });
			return;
		}

		try {
			// Calculate which pages we need to fetch
			const pagesToFetch = [];
			for (let page = startPage; page <= endPage; page++) {
				if (!loadedPages.includes(page)) {
					pagesToFetch.push(page);
				}
			}

			if (pagesToFetch.length === 0) return; // Already loaded

			// Fetch missing pages
			let newMessages: CommunityMessage[] = [];
			for (const page of pagesToFetch) {
				const url = `${base_url}/communityMessages/topic/${topicId}?page=${page}&limit=200`;
				const response: any = await axios.get(url);
				console.log(`Backend response for page ${page}:`, {
					messagesCount: response.data.messages.length,
					messageIds: response.data.messages.map((m: CommunityMessage) => m._id),
					pagination: response.data.pagination,
				});
				
				newMessages = [...newMessages, ...response.data.messages];
			}

			// Combine with existing data, remove duplicates, and sort
			const combinedData = [...messages, ...newMessages];
			const uniqueData = combinedData.filter((message, index, self) => index === self.findIndex((m) => m._id === message._id));
			const sortedData = uniqueData.sort((a: CommunityMessage, b: CommunityMessage) => a.createdAt.localeCompare(b.createdAt));
			
			setMessages(sortedData);
			setLoadedPages([...loadedPages, ...pagesToFetch]);
			
			console.log('fetchMoreMessages result:', {
				originalMessages: messages.length,
				newMessages: newMessages.length,
				totalAfterAppend: sortedData.length,
				pagesFetched: pagesToFetch,
				originalMessageIds: messages.map((m) => m._id),
				newMessageIds: newMessages.map((m) => m._id),
			});
		} catch (error) {
			console.error('Error fetching more messages:', error);
		}
	};

	// Remove the useQuery since we'll handle fetching manually in the component

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
		setMessages((prevMessages) => [newMessage, ...prevMessages]);
		setTotalItems((prev) => prev + 1);
	};

	// Function to remove message
	const removeMessage = (id: string) => {
		setMessages((prevMessages) => prevMessages.filter((message) => message._id !== id));
		setTotalItems((prev) => Math.max(0, prev - 1));
	};

	// Function to update message
	const updateMessage = (messageId: string, updates: Partial<CommunityMessage>) => {
		setMessages((prevMessages) => prevMessages.map((message) => (message._id === messageId ? { ...message, ...updates } : message)));
	};

	// Remove loading states since we handle them in the component

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
			}}>
			{props.children}
		</CommunityMessagesContext.Provider>
	);
};

export default CommunityMessagesContextProvider;
