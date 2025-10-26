import { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../interfaces/user';
import { Chat } from '../pages/Messages';

export interface UseUserBlockingProps {
	user: User | null | undefined;
	activeChat: Chat | null;
	isGroupChat: (chat: Chat) => boolean;
}

export interface UseUserBlockingReturn {
	globalBlockedUsers: string[];
	setGlobalBlockedUsers: React.Dispatch<React.SetStateAction<string[]>>;
	blockedUsers: string[];
	setBlockedUsers: React.Dispatch<React.SetStateAction<string[]>>;

	isBlockingUser: boolean;
	hasLeftParticipants: (chat: Chat | null) => boolean;
}

export const useUserBlocking = ({ user, activeChat, isGroupChat }: UseUserBlockingProps): UseUserBlockingReturn => {
	// Global blocked users state (from Firebase)
	const [globalBlockedUsers, setGlobalBlockedUsers] = useState<string[]>([]);

	// Local blocked users state (synced with global)
	const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

	// Firebase listener for user blocks
	useEffect(() => {
		if (!user?.firebaseUserId) return;

		const userBlocksRef = doc(db, 'userBlocks', user.firebaseUserId);
		const unsubscribe = onSnapshot(userBlocksRef, (docSnapshot) => {
			if (docSnapshot.exists()) {
				const blockedUsers = docSnapshot.data().blockedUsers || {};
				const blockedUserIds = Object.keys(blockedUsers);
				setGlobalBlockedUsers(blockedUserIds); // ✅ Real-time update of who I blocked
			} else {
				setGlobalBlockedUsers([]); // ✅ Clear for safety
			}
		});

		// ✅ Cleanup listener when user changes or component unmounts
		return () => unsubscribe();
	}, [user?.firebaseUserId]);

	// Update blockedUsers state whenever globalBlockedUsers changes
	useEffect(() => {
		setBlockedUsers(globalBlockedUsers);
	}, [globalBlockedUsers]);

	// Check if the current user has blocked someone else (only for 1-1 chats)
	const isBlockingUser: boolean = useMemo(() => {
		if (!activeChat || !user?.firebaseUserId) return false;

		// ✅ Only check blocking for 1-1 chats, not group chats
		if (isGroupChat(activeChat)) return false;

		// Check if current user has blocked any participant
		return (
			activeChat.participants?.some((participant) => {
				if (participant.firebaseUserId === user.firebaseUserId) return false;
				return globalBlockedUsers?.includes(participant.firebaseUserId);
			}) || false
		);
	}, [activeChat, user?.firebaseUserId, globalBlockedUsers, isGroupChat]);

	// Check if participants have left the chat
	const hasLeftParticipants = useCallback(
		(chat: Chat | null): boolean => {
			// For group chats, don't prevent sending messages if some users have left
			// Only prevent if the current user has left
			if (chat?.chatType === 'group') {
				return !!(chat?.removedParticipants && user?.firebaseUserId && chat.removedParticipants?.includes(user.firebaseUserId));
			}
			// For 1-1 chats, prevent if any participant has left
			return !!(chat?.removedParticipants && chat.removedParticipants?.length > 0);
		},
		[user?.firebaseUserId]
	);

	return {
		globalBlockedUsers,
		setGlobalBlockedUsers,
		blockedUsers,
		setBlockedUsers,

		isBlockingUser,
		hasLeftParticipants,
	};
};
