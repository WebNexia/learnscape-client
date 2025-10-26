import { useState, useCallback } from 'react';
import { User } from '../interfaces/user';
import { Chat } from '../pages/Messages';

export interface UseGroupChatManagementProps {
	activeChat: Chat | null;
	globalBlockedUsers: string[];
}

export interface UseGroupChatManagementReturn {
	// Group chat creation state
	groupName: string;
	setGroupName: React.Dispatch<React.SetStateAction<string>>;
	selectedGroupUsers: User[];
	setSelectedGroupUsers: React.Dispatch<React.SetStateAction<User[]>>;
	groupSearchValue: string;
	setGroupSearchValue: React.Dispatch<React.SetStateAction<string>>;
	groupImageUrl: string;
	setGroupImageUrl: React.Dispatch<React.SetStateAction<string>>;
	enterGroupImageUrl: boolean;
	setEnterGroupImageUrl: React.Dispatch<React.SetStateAction<boolean>>;
	removedMembers: string[];
	setRemovedMembers: React.Dispatch<React.SetStateAction<string[]>>;

	// Group chat helper functions
	handleGroupUserSelection: (selectedUser: User) => void;
	removeGroupUser: (userId: string) => void;
	removeExistingGroupMember: (userId: string) => void;
	restoreExistingGroupMember: (userId: string) => void;
	resetGroupChatForm: () => void;
	resetGroupChatEditForm: () => void;
}

export const useGroupChatManagement = ({ activeChat }: UseGroupChatManagementProps): UseGroupChatManagementReturn => {
	// Group chat creation state
	const [groupName, setGroupName] = useState<string>('');
	const [selectedGroupUsers, setSelectedGroupUsers] = useState<User[]>([]);
	const [groupSearchValue, setGroupSearchValue] = useState<string>('');
	const [groupImageUrl, setGroupImageUrl] = useState<string>('');
	const [enterGroupImageUrl, setEnterGroupImageUrl] = useState<boolean>(true);
	const [removedMembers, setRemovedMembers] = useState<string[]>([]);

	// Group chat helper functions
	const handleGroupUserSelection = useCallback(
		(selectedUser: User) => {
			// Check if user is already selected in new members
			const isAlreadySelected = selectedGroupUsers?.some((u) => u.firebaseUserId === selectedUser.firebaseUserId);

			// Check if user is already in current members (not removed) - only for group editing
			const isCurrentMember =
				activeChat?.participants?.some((p) => p.firebaseUserId === selectedUser.firebaseUserId && !removedMembers?.includes(p.firebaseUserId)) ||
				false;

			// Only add if not already selected and not a current member
			if (!isAlreadySelected && !isCurrentMember) {
				setSelectedGroupUsers((prev) => [...prev, selectedUser]);
			}
			// Don't clear search value for group chat - keep it for continued searching
		},
		[selectedGroupUsers, activeChat?.participants, removedMembers]
	);

	const removeGroupUser = useCallback((userId: string) => {
		setSelectedGroupUsers((prev) => prev?.filter((u) => u.firebaseUserId !== userId));
	}, []);

	const removeExistingGroupMember = useCallback(
		(userId: string) => {
			if (!activeChat) return;

			// Add to removed members list (pending removal)
			setRemovedMembers((prev) => [...prev, userId]);
		},
		[activeChat]
	);

	const restoreExistingGroupMember = useCallback(
		(userId: string) => {
			if (!activeChat) return;

			// Remove from removed members list (cancel removal)
			setRemovedMembers((prev) => prev?.filter((id) => id !== userId));
		},
		[activeChat]
	);

	const resetGroupChatForm = useCallback(() => {
		setGroupName('');
		setSelectedGroupUsers([]);
		setGroupSearchValue('');
		setGroupImageUrl('');
		setEnterGroupImageUrl(false);
	}, []);

	const resetGroupChatEditForm = useCallback(() => {
		setGroupName('');
		setSelectedGroupUsers([]);
		setGroupSearchValue('');
		setGroupImageUrl('');
		setEnterGroupImageUrl(false);
		setRemovedMembers([]);
	}, []);

	return {
		// Group chat creation state
		groupName,
		setGroupName,
		selectedGroupUsers,
		setSelectedGroupUsers,
		groupSearchValue,
		setGroupSearchValue,
		groupImageUrl,
		setGroupImageUrl,
		enterGroupImageUrl,
		setEnterGroupImageUrl,
		removedMembers,
		setRemovedMembers,

		// Group chat helper functions
		handleGroupUserSelection,
		removeGroupUser,
		removeExistingGroupMember,
		restoreExistingGroupMember,
		resetGroupChatForm,
		resetGroupChatEditForm,
	};
};
