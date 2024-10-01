export interface CommunityTopic {
	_id: string;
	orgId: string;
	userId: UserInfo;
	title: string;
	text: string;
	imageUrl: string;
	audioUrl: string;
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
	text: string;
}
