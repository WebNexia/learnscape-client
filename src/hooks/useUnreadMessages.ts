import { useState, useEffect, useContext } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';

// Global state to prevent multiple listeners
let globalUnreadMessages = false;
let globalListener: (() => void) | null = null;
let globalUserId: string | null = null;
let isListening = false;

/**
 * Custom hook to listen for unread messages in Firebase chats
 * Returns true/false indicating if there are any unread messages
 * Uses an idle listener that only activates when messages are sent
 */
export const useUnreadMessages = (): boolean => {
	const { user } = useContext(UserAuthContext);
	const [hasUnreadMessages, setHasUnreadMessages] = useState<boolean>(globalUnreadMessages);

	useEffect(() => {
		// If no user is authenticated, return early
		if (!user?.firebaseUserId) {
			setHasUnreadMessages(false);
			return;
		}

		// If we already have a listener for this user, just return the current state
		if (globalListener && globalUserId === user.firebaseUserId) {
			setHasUnreadMessages(globalUnreadMessages);
			return;
		}

		// Clean up existing listener if user changed
		if (globalListener && globalUserId !== user.firebaseUserId) {
			globalListener();
			globalListener = null;
			isListening = false;
		}

		// Create a single global listener for this user
		globalUserId = user.firebaseUserId;
		const chatsRef = collection(db, 'chats');
		const q = query(chatsRef, where('participants', 'array-contains', user.firebaseUserId));

		globalListener = onSnapshot(
			q,
			(querySnapshot) => {
				let hasUnread = false;

				// Check each chat for unread messages - stop as soon as we find one
				for (const doc of querySnapshot.docs) {
					const data = doc.data();

					// Skip deleted chats
					if (data.isDeletedBy?.includes(user.firebaseUserId)) {
						continue;
					}

					// Skip chats where user has permanently left
					if (data.removedParticipants?.includes(user.firebaseUserId)) {
						continue;
					}

					// Check if current user has unread messages (not the sender)
					if (data.hasUnreadMessages === true && data.unreadBy?.includes(user.firebaseUserId)) {
						hasUnread = true;
						break; // Stop checking as soon as we find one unread message
					}
				}

				globalUnreadMessages = hasUnread;
				setHasUnreadMessages(hasUnread);
			},
			(error) => {
				console.error('Error listening to unread messages:', error);
				globalUnreadMessages = false;
				setHasUnreadMessages(false);
			}
		);

		isListening = true;

		// Cleanup on unmount (only if this is the last component using the hook)
		return () => {
			// Note: We don't clean up the global listener here to prevent
			// multiple components from creating multiple listeners
		};
	}, [user?.firebaseUserId]);

	return hasUnreadMessages;
};
