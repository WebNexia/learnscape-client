type GroupAdminChat = {
	chatType?: '1-1' | 'group' | string;
	adminIds?: string[];
	createdBy?: string;
	participants?: { firebaseUserId: string }[];
	removedParticipants?: string[];
};

export const getGroupAdminIds = (chat: GroupAdminChat | null | undefined): string[] => {
	if (!chat || chat.chatType !== 'group') return [];

	const stored = (chat.adminIds || []).map((id) => (typeof id === 'string' ? id.trim() : '')).filter(Boolean);
	if (stored.length > 0) return [...new Set(stored)];
	return chat.createdBy ? [chat.createdBy] : [];
};

export const activeGroupAdminIds = (chat: GroupAdminChat | null | undefined): string[] => {
	if (!chat) return [];
	const removed = new Set(chat.removedParticipants || []);
	const participantIds = new Set((chat.participants || []).map((participant) => participant.firebaseUserId));
	return getGroupAdminIds(chat).filter((id) => participantIds.has(id) && !removed.has(id));
};

export const isSoleGroupAdmin = (chat: GroupAdminChat | null | undefined, firebaseUserId?: string) => {
	if (!firebaseUserId) return false;
	const admins = activeGroupAdminIds(chat);
	return admins.length === 1 && admins[0] === firebaseUserId;
};

export const canManageGroupChat = (chat: GroupAdminChat | null | undefined, firebaseUserId: string | undefined, hasAdminAccess: boolean) =>
	hasAdminAccess || (!!firebaseUserId && getGroupAdminIds(chat).includes(firebaseUserId));
