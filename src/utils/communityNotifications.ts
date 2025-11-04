import axios from '@utils/axiosInstance';
import { collection, writeBatch, serverTimestamp, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { truncateText } from './utilText';

export async function sendCommunityNotifications({
	user,
	topic,
	replyToMessage,
	currentMessage,
	newMessageId,
	baseUrl,
	orgId,
}: {
	user: any;
	topic: any;
	replyToMessage: any;
	currentMessage: string;
	newMessageId: string;
	baseUrl: string;
	orgId: string;
}) {
	try {
		// Extract mentioned usernames from the message
		const mentionedUsernames = currentMessage.match(/@(\w+)/g)?.map((mention: string) => mention.substring(1)) || [];

		// Create a single Firestore batch for all notifications
		const batch = writeBatch(db);
		const usersAlreadyNotified = new Set<string>();

		// Send reply notification to the original message author
		if (replyToMessage && replyToMessage.userId?.firebaseUserId) {
			const replyToMsgNotificationData = {
				title: 'Community Message Replied',
				message: `${user?.username} replied to your message "${truncateText(replyToMessage.text, 30)}" in the topic ${truncateText(
					topic.title,
					25
				)} under community topics`,
				isRead: false,
				timestamp: serverTimestamp(),
				type: 'ReplyToCommunityMessage',
				userImageUrl: user?.imageUrl,
				communityTopicId: topic._id,
				communityMessageId: newMessageId,
			};

			const notificationRef = doc(collection(db, 'notifications', replyToMessage.userId?.firebaseUserId, 'userNotifications'));
			batch.set(notificationRef, replyToMsgNotificationData);
			usersAlreadyNotified.add(replyToMessage.userId.firebaseUserId);
		}

		// Send notification to topic owner if it's not a reply to their message AND they're not the current user
		if (
			topic.userId?.firebaseUserId &&
			topic.userId.firebaseUserId !== user?.firebaseUserId &&
			(!replyToMessage || replyToMessage.userId?.firebaseUserId !== topic.userId?.firebaseUserId)
		) {
			const notificationToTopicOwnerData = {
				title: 'Community Topic Replied',
				message: `${user?.username} replied to your topic ${truncateText(topic.title, 25)} in community topics: "${truncateText(
					currentMessage,
					30
				)}"`,
				isRead: false,
				timestamp: serverTimestamp(),
				type: 'ReplyToCommunityTopic',
				userImageUrl: user?.imageUrl,
				communityTopicId: topic._id,
				communityMessageId: newMessageId,
			};

			const notificationRef = doc(collection(db, 'notifications', topic.userId?.firebaseUserId, 'userNotifications'));
			batch.set(notificationRef, notificationToTopicOwnerData);
			usersAlreadyNotified.add(topic.userId.firebaseUserId);
		}

		// Send notifications for mentioned users
		if (mentionedUsernames.length > 0) {
			try {
				// Check if @everyone is mentioned
				const hasEveryoneMention = mentionedUsernames?.includes('everyone');

				if (hasEveryoneMention) {
					try {
						// Get all users who have participated in this topic
						const topicParticipantsResponse = await axios.get(`${baseUrl}/communityMessages/topic-participants/${topic._id}`);
						const topicParticipants = topicParticipantsResponse.data.data || [];

						// Send @everyone notifications to all users who posted messages in this topic
						for (const participant of topicParticipants) {
							if (
								participant.firebaseUserId &&
								participant.firebaseUserId !== user?.firebaseUserId &&
								!usersAlreadyNotified.has(participant.firebaseUserId)
							) {
								const everyoneNotificationData = {
									title: 'Community Announcement',
									message: `${user?.username} made an announcement in the topic "${truncateText(topic.title, 30)}": "${truncateText(currentMessage, 50)}"`,
									isRead: false,
									timestamp: serverTimestamp(),
									type: 'MentionUser',
									userImageUrl: user?.imageUrl,
									communityTopicId: topic._id,
									communityMessageId: newMessageId,
								};

								const notificationRef = doc(collection(db, 'notifications', participant.firebaseUserId, 'userNotifications'));
								batch.set(notificationRef, everyoneNotificationData);
								usersAlreadyNotified.add(participant.firebaseUserId);
							}
						}
					} catch (error) {
						// Continue with other notifications even if @everyone fails
					}
				}

				// Handle regular mentions (excluding @everyone)
				const regularMentions = mentionedUsernames?.filter((username) => username !== 'everyone') || [];

				if (regularMentions.length > 0) {
					// Get user data for mentioned usernames
					const mentionedUsersResponse = await axios.get(
						`${baseUrl}/users/search-by-usernames?usernames=${regularMentions.join(',')}&orgId=${orgId}`
					);
					const mentionedUsers = mentionedUsersResponse.data.data || [];

					// Send notifications to each mentioned user (excluding the current user and users already notified)
					for (const mentionedUser of mentionedUsers) {
						if (
							mentionedUser.firebaseUserId &&
							mentionedUser.firebaseUserId !== user?.firebaseUserId &&
							!usersAlreadyNotified.has(mentionedUser.firebaseUserId)
						) {
							const mentionNotificationData = {
								title: 'You were mentioned',
								message: `${user?.username} mentioned you in a community message: "${truncateText(currentMessage, 50)}"`,
								isRead: false,
								timestamp: serverTimestamp(),
								type: 'MentionUser',
								userImageUrl: user?.imageUrl,
								communityTopicId: topic._id,
								communityMessageId: newMessageId,
							};

							const notificationRef = doc(collection(db, 'notifications', mentionedUser.firebaseUserId, 'userNotifications'));
							batch.set(notificationRef, mentionNotificationData);
							usersAlreadyNotified.add(mentionedUser.firebaseUserId);
						}
					}
				}
			} catch (error) {
				console.error('Failed to send mention notifications:', error);
				// Don't block the message send if notification fails
			}
		}

		// Commit all notifications in a single batch write
		await batch.commit();
	} catch (error) {
		console.error('Failed to send community notifications:', error);
		// Don't throw error - notifications are not critical for message sending
	}
}
