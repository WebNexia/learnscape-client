export interface CommunityTopic {
	_id: string;
	orgId?: string;
	userId: UserInfo;
	title: string;
	/** Present on single-topic fetch; omitted from organisation list payload. */
	text?: string;
	imageUrl?: string;
	audioUrl?: string;
	messageCount?: number;
	isReported?: boolean;
	isActive?: boolean;
	lastMessage?: LastMessage;
	createdAt: string;
	updatedAt: string;
}

interface UserInfo {
	_id: string;
	imageUrl: string;
	username: string;
}

interface LastMessage {
	createdAt: string;
	sender: UserInfo;
	/** Omitted from organisation list payload. */
	text?: string;
}
