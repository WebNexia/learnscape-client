import { Link } from 'react-router-dom';
import { TopicSuggestion } from '../pages/CommunityTopicPage';
import { processTitle } from './processTitle';
import { User } from '../interfaces/user';
import { Roles } from '../interfaces/enums';

export const renderMessageWithMentions = (text: string, processedTopics: TopicSuggestion[], user: User) => {
	const mentionPattern = /(@[a-zA-Z0-9._]+|#[a-zA-Z0-9._]+)/g;
	const parts = text.split(mentionPattern);

	return parts.map((part, index) => {
		if (part.startsWith('@')) {
			return (
				<Link key={index} to={`#`} style={{ textDecoration: 'none', color: 'blue' }}>
					{part}
				</Link>
			);
		} else if (part.startsWith('#')) {
			const typedTitle = processTitle(part.substring(1)); // Apply the same processing for matching

			// Find the topic by comparing with processed topics
			const topic = processedTopics.find((t) => t.title === typedTitle);

			if (topic) {
				const basePath = user?.role === Roles.ADMIN ? '/admin' : '';
				return (
					<Link key={index} to={`${basePath}/community/user/${user._id}/topic/${topic.topicId}`} style={{ textDecoration: 'none', color: 'blue' }}>
						{part}
					</Link>
				);
			} else {
				return (
					<span key={index} style={{ color: 'gray' }}>
						{part}
					</span>
				);
			}
		} else {
			return part;
		}
	});
};
