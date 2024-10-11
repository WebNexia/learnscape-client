import { Link } from 'react-router-dom';
import { TopicSuggestion } from '../pages/CommunityTopicPage';
import { processTitle } from './processTitle';
import { User } from '../interfaces/user';
import { Roles } from '../interfaces/enums';

export const renderMessageWithMentions = (text: string, processedTopics: TopicSuggestion[], user: User) => {
	const mentionPattern = /(@[a-zA-Z0-9._]+|#[a-zA-Z0-9._]+)/g;
	const parts = text.split(mentionPattern);

	return parts?.map((part, index) => {
		if (part.startsWith('@')) {
			// Special handling for @everyone, only for admin users
			if (part === '@everyone') {
				if (user.role === Roles.ADMIN) {
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
		} else if (part.startsWith('#')) {
			// Process the topic title to match with processed topics
			const typedTitle = processTitle(part.substring(1));

			// Find the corresponding topic based on the processed title
			const topic = processedTopics.find((t) => t.title === typedTitle);

			if (topic) {
				// Determine base path based on user role
				const basePath = user?.role === Roles.ADMIN ? '/admin' : '';
				return (
					<Link key={index} to={`${basePath}/community/user/${user._id}/topic/${topic.topicId}`} style={{ textDecoration: 'none', color: 'blue' }}>
						{part}
					</Link>
				);
			} else {
				// Render unmatched topics as gray text
				return (
					<span key={index} style={{ color: 'gray' }}>
						{part}
					</span>
				);
			}
		} else {
			// Render regular text parts as-is
			return part;
		}
	});
};
