import { User } from '../interfaces/user'; // Adjust the import path if needed

export function filterUsers(users: User[], searchValue: string): User[] {
	const lowerSearch = searchValue.trim().toLowerCase();
	if (!lowerSearch) return users;
	return users?.filter((user) => user.username?.toLowerCase()?.includes(lowerSearch) || user.email?.toLowerCase()?.includes(lowerSearch)) || [];
}
