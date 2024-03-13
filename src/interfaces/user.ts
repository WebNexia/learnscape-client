export interface User {
	_id: string;
	username?: string;
	email?: string;
	password?: string;
	role?: string;
	imageUrl?: string;
	isActive?: boolean;
	createdAt?: string;
	updatedAt?: string;
}
