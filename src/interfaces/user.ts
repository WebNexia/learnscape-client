export interface User {
	_id: string;
	username: string;
	email: string;
	firebaseUserId: string;
	role: string;
	orgId: string;
	imageUrl: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface AdminUser {
	_id: string;
	username: string;
	firebaseUserId: string;
	role: string;
}
