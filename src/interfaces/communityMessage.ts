export interface CommunityMessage {
	_id: string;
	orgId: string;
	userId: UserInfo;
	topicId: string;
	parentMessageId: ParentMessageInfo | string | null;
	text: string;
	imageUrl: string;
	audioUrl: string;
	isReported: boolean;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

interface UserInfo {
	_id: string;
	imageUrl: string;
	username: string;
	firebaseUserId: string;
}

export interface TopicInfo {
	_id: string;
	userId: UserInfo;
	createdAt: string;
	updatedAt: string;
	title: string;
	text: string;
	imageUrl: string;
	audioUrl: string;
	isReported: boolean;
}

export interface ParentMessageInfo {
	_id: string;
	userId: {
		_id: string;
		username: string;
	};
	text: string;
	imageUrl: string;
	audioUrl: string;
}
