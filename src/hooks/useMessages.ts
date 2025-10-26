import { useState, useCallback, useEffect, useRef } from 'react';
import { Message } from '../pages/Messages';
import { collection, query, orderBy, onSnapshot, getDocs, limit, startAfter } from 'firebase/firestore';
import { db } from '../firebase';

interface UseMessagesProps {
	activeChatId?: string;
	userFirebaseId?: string;
	refreshChatList: () => Promise<void>;
	isMobileSize?: boolean;
}

interface UseMessagesReturn {
	messages: Message[];
	setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
	hasMoreMessages: boolean;
	setHasMoreMessages: React.Dispatch<React.SetStateAction<boolean>>;
	lastMessageDoc: any;
	setLastMessageDoc: React.Dispatch<React.SetStateAction<any>>;
	isLoadingMore: boolean;
	setIsLoadingMore: React.Dispatch<React.SetStateAction<boolean>>;
	loadMoreMessages: () => Promise<void>;
	scrollToBottom: () => void;
	messagesEndRef: React.RefObject<HTMLDivElement>;
	messagesContainerRef: React.RefObject<HTMLDivElement>;
	isUserScrolledUp: boolean;
	setIsUserScrolledUp: React.Dispatch<React.SetStateAction<boolean>>;
	showNewMessageIndicator: boolean;
	setShowNewMessageIndicator: React.Dispatch<React.SetStateAction<boolean>>;
	showScrollToBottom: boolean;
	setShowScrollToBottom: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useMessages = ({ activeChatId, userFirebaseId, refreshChatList, isMobileSize = false }: UseMessagesProps): UseMessagesReturn => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(false);
	const [lastMessageDoc, setLastMessageDoc] = useState<any>(null);
	const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
	const [isUserScrolledUp, setIsUserScrolledUp] = useState<boolean>(false);
	const [showNewMessageIndicator, setShowNewMessageIndicator] = useState<boolean>(false);
	const [showScrollToBottom, setShowScrollToBottom] = useState<boolean>(false);

	const messagesEndRef = useRef<HTMLDivElement | null>(null);
	const messagesContainerRef = useRef<HTMLDivElement | null>(null);

	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
	}, []);

	// Reset scroll state when chat changes
	useEffect(() => {
		setIsUserScrolledUp(false);
		setShowNewMessageIndicator(false);
		setShowScrollToBottom(false);
	}, [activeChatId]);

	useEffect(() => {
		// Only auto-scroll if user is already AT bottom (not scrolled up)
		if (!isUserScrolledUp) {
			scrollToBottom();
		}
	}, [messages, isUserScrolledUp, scrollToBottom]);

	const loadMoreMessages = useCallback(async () => {
		if (!activeChatId || !lastMessageDoc || isLoadingMore) return;

		setIsLoadingMore(true);

		const messagesRef = collection(db, 'chats', activeChatId, 'messages');
		const q = query(messagesRef, orderBy('timestamp', 'desc'), startAfter(lastMessageDoc), limit(50));

		const snapshot = await getDocs(q);

		if (snapshot.empty) {
			setHasMoreMessages(false);
			setIsLoadingMore(false);
			return;
		}

		const newBatch: Message[] = [];
		snapshot.forEach((doc) => {
			const data = doc.data();
			newBatch.push({
				id: doc.id,
				senderId: data.senderId || '',
				receiverId: data.receiverId || '',
				text: data.text || '',
				timestamp: data.timestamp?.toDate() || new Date(),
				isRead: data.isRead || false,
				imageUrl: data.imageUrl || '',
				videoUrl: data.videoUrl || '',
				replyTo: data.replyTo || '',
				quotedText: data.quotedText || '',
			});
		});

		setLastMessageDoc(snapshot.docs[snapshot.docs.length - 1]);

		const scrollEl = messagesContainerRef.current;
		if (scrollEl) {
			const oldScrollHeight = scrollEl.scrollHeight;

			setMessages((prev) => {
				const combined = [...newBatch.reverse(), ...prev];
				const MAX_MESSAGES = isMobileSize ? 200 : 500;
				return combined.slice(-MAX_MESSAGES);
			});

			requestAnimationFrame(() => {
				scrollEl.scrollTop = scrollEl.scrollHeight - oldScrollHeight;
			});
		}

		if (snapshot.docs.length < 50) setHasMoreMessages(false);
		setIsLoadingMore(false);
	}, [activeChatId, lastMessageDoc, isLoadingMore]);

	// Reset pagination state when switching chats
	useEffect(() => {
		if (!activeChatId || !userFirebaseId) return;

		setHasMoreMessages(false);
		setLastMessageDoc(null);
		setIsLoadingMore(false);
		setMessages([]);

		const loadInitialMessages = async () => {
			try {
				const messagesRef = collection(db, 'chats', activeChatId, 'messages');
				const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(50));
				const snapshot = await getDocs(q);

				if (snapshot.docs.length < 50) {
					setHasMoreMessages(false);
				} else {
					setHasMoreMessages(true);
					setLastMessageDoc(snapshot.docs[snapshot.docs.length - 1]);
				}

				const batch: Message[] = [];
				snapshot.forEach((doc) => {
					const data = doc.data();
					batch.push({
						id: doc.id,
						senderId: data.senderId || '',
						receiverId: data.receiverId || '',
						text: data.text || '',
						timestamp: data.timestamp?.toDate() || new Date(),
						isRead: data.isRead || false,
						imageUrl: data.imageUrl || '',
						videoUrl: data.videoUrl || '',
						replyTo: data.replyTo || '',
						quotedText: data.quotedText || '',
					});
				});

				setMessages(batch.reverse());
			} catch (err) {
				console.error('Error loading initial messages:', err);
			}
		};

		loadInitialMessages();
	}, [activeChatId, userFirebaseId]);

	// Real-time message listener
	useEffect(() => {
		if (!activeChatId || !userFirebaseId) return;

		const messagesRef = collection(db, 'chats', activeChatId, 'messages');
		const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));

		const unsubscribe = onSnapshot(q, (snapshot) => {
			if (snapshot.empty) return;

			const doc = snapshot.docs[0];
			const data = doc.data();

			const incomingMessage: Message = {
				id: doc.id,
				senderId: data.senderId || '',
				receiverId: data.receiverId || '',
				text: data.text || '',
				timestamp: data.timestamp?.toDate() || new Date(),
				isRead: data.isRead || false,
				imageUrl: data.imageUrl || '',
				videoUrl: data.videoUrl || '',
				replyTo: data.replyTo || '',
				quotedText: data.quotedText || '',
			};

			const isFromCurrentUser = incomingMessage.senderId === userFirebaseId;

			setMessages((prev) => {
				// Check if message already exists by ID
				const exists = prev.some((m) => m.id === incomingMessage.id);
				if (exists) return prev;

				// Check if it's the same as the last message (additional safety)
				const isSameAsLast = prev.length > 0 && prev[prev.length - 1].id === incomingMessage.id;
				if (isSameAsLast) return prev;
				const updated = [...prev, incomingMessage];

				// ✅ Use the state variable instead of checking DOM directly
				// This is more reliable since it's updated by the scroll event handler
				if (!isUserScrolledUp || isFromCurrentUser) {
					// ✅ Auto-scroll if user is at bottom OR if it's their own message
					requestAnimationFrame(() => {
						messagesContainerRef.current?.scrollTo({
							top: messagesContainerRef.current?.scrollHeight,
							behavior: isFromCurrentUser ? 'smooth' : 'instant',
						});
					});
					setShowNewMessageIndicator(false); // Hide indicator when auto-scrolling
				} else {
					// ✅ Show indicator only for messages from others when user is scrolled up
					setShowNewMessageIndicator(true);
				}

				return updated;
			});

			if (incomingMessage.senderId !== userFirebaseId && document.hasFocus()) {
				refreshChatList();
			}
		});

		return () => unsubscribe();
	}, [activeChatId, userFirebaseId]);

	return {
		messages,
		setMessages,
		hasMoreMessages,
		setHasMoreMessages,
		lastMessageDoc,
		setLastMessageDoc,
		isLoadingMore,
		setIsLoadingMore,
		loadMoreMessages,
		scrollToBottom,
		messagesEndRef,
		messagesContainerRef,
		isUserScrolledUp,
		setIsUserScrolledUp,
		showNewMessageIndicator,
		setShowNewMessageIndicator,
		showScrollToBottom,
		setShowScrollToBottom,
	};
};
