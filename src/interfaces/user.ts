export interface User {
	_id: string;
	firstName: string;
	lastName: string;
	username: string;
	email: string;
	firebaseUserId: string;
	role: string;
	orgId: string;
	imageUrl: string;
	isActive: boolean;
	hasRegisteredCourse: boolean;
	createdAt: string;
	updatedAt: string;
	countryCode: string;
}

export interface AdminUser {
	_id: string;
	username: string;
	firebaseUserId: string;
	role: string;
}
