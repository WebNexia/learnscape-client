import { writeBatch, serverTimestamp, doc, collection } from 'firebase/firestore';
import { db } from '../firebase';

export async function sendEventCreatedNotifications({
	user,
	newEventTitle,
	startDate,
	startTime,
	participants,
	eventId,
	baseUrl,
	orgId,
	isPublic,
}: {
	user: any;
	newEventTitle: string;
	startDate: string;
	startTime: string;
	participants: any[];
	eventId: string;
	baseUrl: string;
	orgId: string;
	isPublic: boolean;
}) {
	try {
		// Create a single Firestore batch for all notifications
		const batch = writeBatch(db);
		const usersAlreadyNotified = new Set<string>();

		// Add event creator to avoid self-notification
		if (user?.firebaseUserId) {
			usersAlreadyNotified.add(user.firebaseUserId);
		}

		// Send notifications to all participants
		for (const participant of participants) {
			if (
				participant.firebaseUserId &&
				participant.firebaseUserId !== user?.firebaseUserId &&
				!usersAlreadyNotified.has(participant.firebaseUserId)
			) {
				const notificationData = {
					title: 'New Event Created',
					message: `${user?.username} created a new event "${newEventTitle}" on ${startDate} at ${startTime}`,
					isRead: false,
					timestamp: serverTimestamp(),
					type: 'AddToEvent',
					userImageUrl: user?.imageUrl,
					eventId: eventId,
					orgId: orgId,
				};

				const notificationRef = doc(collection(db, 'notifications', participant.firebaseUserId, 'userNotifications'));
				batch.set(notificationRef, notificationData);
				usersAlreadyNotified.add(participant.firebaseUserId);
			}
		}

		// Send public event announcement if event is public
		if (isPublic) {
			// Get all users in the organization for public events
			try {
				const allUsersResponse = await fetch(`${baseUrl}/users?orgId=${orgId}`);
				const allUsersData = await allUsersResponse.json();
				const allUsers = allUsersData.data || [];

				for (const orgUser of allUsers) {
					if (orgUser.firebaseUserId && orgUser.firebaseUserId !== user?.firebaseUserId && !usersAlreadyNotified.has(orgUser.firebaseUserId)) {
						const publicEventNotificationData = {
							title: 'New Public Event',
							message: `${user?.username} created a public event "${newEventTitle}" on ${startDate} at ${startTime}`,
							isRead: false,
							timestamp: serverTimestamp(),
							type: 'PublicEvent',
							userImageUrl: user?.imageUrl,
							eventId: eventId,
							orgId: orgId,
						};

						const notificationRef = doc(collection(db, 'notifications', orgUser.firebaseUserId, 'userNotifications'));
						batch.set(notificationRef, publicEventNotificationData);
						usersAlreadyNotified.add(orgUser.firebaseUserId);
					}
				}
			} catch (error) {
				console.error('Failed to fetch organization users for public event notification:', error);
			}
		}

		// Commit all notifications in a single batch write
		await batch.commit();
	} catch (error) {
		console.error('Failed to send event created notifications:', error);
		// Don't throw error - notifications are not critical for event creation
	}
}

export async function sendEventUpdatedNotifications({
	user,
	selectedEvent,
	startDate,
	startTime,
	previousAttendeeIds,
	allCoursesParticipantsInfo,
	baseUrl,
	orgId,
	wasPublic,
}: {
	user: any;
	selectedEvent: any;
	startDate: string;
	startTime: string;
	previousAttendeeIds: string[];
	allCoursesParticipantsInfo: any[];
	baseUrl: string;
	orgId: string;
	wasPublic: boolean;
}) {
	try {
		// Create a single Firestore batch for all notifications
		const batch = writeBatch(db);
		const usersAlreadyNotified = new Set<string>();

		// Add event creator to avoid self-notification
		if (user?.firebaseUserId) {
			usersAlreadyNotified.add(user.firebaseUserId);
		}

		// Send notifications to new attendees (those not in previousAttendeeIds)
		for (const participant of allCoursesParticipantsInfo) {
			if (
				participant.firebaseUserId &&
				participant.firebaseUserId !== user?.firebaseUserId &&
				!previousAttendeeIds.includes(participant._id) && // correct matching
				!usersAlreadyNotified.has(participant.firebaseUserId)
			) {
				const notificationData = {
					title: 'Added to Event',
					message: `${user?.username} added you to the event "${selectedEvent.title}" on ${startDate} at ${startTime}`,
					isRead: false,
					timestamp: serverTimestamp(),
					type: 'AddToEvent',
					userImageUrl: user?.imageUrl,
					eventId: selectedEvent._id,
					orgId: orgId,
				};

				const notificationRef = doc(collection(db, 'notifications', participant.firebaseUserId, 'userNotifications'));
				batch.set(notificationRef, notificationData);
				usersAlreadyNotified.add(participant.firebaseUserId);
			}
		}

		// Send public event announcement if event is now public (wasn't public before)
		if (selectedEvent.isPublic && !wasPublic) {
			// Get all users in the organization for public events
			try {
				const allUsersResponse = await fetch(`${baseUrl}/users?orgId=${orgId}`);
				const allUsersData = await allUsersResponse.json();
				const allUsers = allUsersData.data || [];

				for (const orgUser of allUsers) {
					if (orgUser.firebaseUserId && orgUser.firebaseUserId !== user?.firebaseUserId && !usersAlreadyNotified.has(orgUser.firebaseUserId)) {
						const publicEventNotificationData = {
							title: 'Event Now Public',
							message: `${user?.username} made the event "${selectedEvent.title}" public on ${startDate} at ${startTime}`,
							isRead: false,
							timestamp: serverTimestamp(),
							type: 'PublicEvent',
							userImageUrl: user?.imageUrl,
							eventId: selectedEvent._id,
							orgId: orgId,
						};

						const notificationRef = doc(collection(db, 'notifications', orgUser.firebaseUserId, 'userNotifications'));
						batch.set(notificationRef, publicEventNotificationData);
						usersAlreadyNotified.add(orgUser.firebaseUserId);
					}
				}
			} catch (error) {
				console.error('Failed to fetch organization users for public event notification:', error);
			}
		}

		// Commit all notifications in a single batch write
		await batch.commit();
	} catch (error) {
		console.error('Failed to send event updated notifications:', error);
		// Don't throw error - notifications are not critical for event updates
	}
}
