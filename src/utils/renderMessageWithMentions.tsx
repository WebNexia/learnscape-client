import { Link } from 'react-router-dom';
import { User } from '../interfaces/user';
import { Roles } from '../interfaces/enums';

export const renderMessageWithMentions = (text: string, processedTopics: any[], user: User) => {
	// Add defensive programming to handle undefined or null text
	if (!text || typeof text !== 'string') {
		return [];
	}

	const mentionPattern = /(@[a-zA-Z0-9._]+)/g;
	const parts = text.split(mentionPattern);

	return (
		parts?.map((part, index) => {
			if (part.startsWith('@')) {
				// Special handling for @everyone, only for admin users
				if (part === '@everyone') {
					if (user.role === Roles.ADMIN || user.role === Roles.OWNER || user.role === Roles.SUPER_ADMIN) {
						// Render @everyone as a special mention for admins
						return (
							<span key={index} style={{ color: 'green', fontWeight: 'bold' }}>
								{part}
							</span>
						);
					} else {
						// Render as plain text if user is not an admin
						return (
							<span key={index} style={{ color: 'gray' }}>
								{part}
							</span>
						);
					}
				}

				// Regular @mentions (links to user profile placeholder)
				return (
					<Link key={index} to={`#`} style={{ textDecoration: 'none', color: 'blue' }}>
						{part}
					</Link>
				);
			} else {
				// Render regular text parts as-is
				return part;
			}
		}) || []
	);
};
