import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

/**
 * Firestore trigger to add expireAt field on message creation
 * Used for TTL auto-delete in Firestore
 */
exports.setExpireAtForMessages = functions.firestore.document('chats/{chatId}/messages/{messageId}').onCreate(async (snap) => {
	try {
		const data = snap.data() || {};

		const created = data.timestamp instanceof admin.firestore.Timestamp ? data.timestamp : admin.firestore.Timestamp.now();

		const expireAt = admin.firestore.Timestamp.fromMillis(
			created.toMillis() + 21 * 24 * 60 * 60 * 1000 // 21 days
		);

		await snap.ref.update({ expireAt });
	} catch (error) {
		console.error('Error in setExpireAtForMessages:', error);
		throw error;
	}
});

/**
 * Firestore trigger to add expireAt field on notification creation
 * Used for TTL auto-delete in Firestore
 */
exports.setExpireAtForNotifications = functions.firestore.document('notifications/{userId}/userNotifications/{notifId}').onCreate(async (snap) => {
	try {
		const data = snap.data() || {};

		// Handle different timestamp formats
		let created;
		if (data.timestamp instanceof admin.firestore.Timestamp) {
			created = data.timestamp;
		} else if (data.timestamp && typeof data.timestamp.toDate === 'function') {
			// Handle Firestore Timestamp from client SDK
			created = admin.firestore.Timestamp.fromDate(data.timestamp.toDate());
		} else {
			// Use current time if no timestamp
			created = admin.firestore.Timestamp.now();
		}

		const expireAt = admin.firestore.Timestamp.fromMillis(
			created.toMillis() + 14 * 24 * 60 * 60 * 1000 // 14 days
		);

		await snap.ref.update({ expireAt });
	} catch (error) {
		console.error('Error in setExpireAtForNotifications:', error);
		throw error;
	}
});

/**
 * Weekly cleanup job (safety net for TTL)
 * Deletes expired messages and notifications if TTL hasn't yet
 */
exports.purgeExpiredDocs = functions.pubsub
	.schedule('every monday 01:00') // once a week, 1 AM London
	.timeZone('Europe/London')
	.onRun(async () => {
		try {
			const now = admin.firestore.Timestamp.now();

			const cleanupCollectionGroup = async (groupName: string, label: string) => {
				let totalDeleted = 0;
				const groupRef = db.collectionGroup(groupName);

				while (true) {
					const snap = await groupRef.where('expireAt', '<=', now).orderBy('expireAt').limit(500).get();

					if (snap.empty) break;

					const batch = db.batch();
					snap.docs.forEach((doc) => batch.delete(doc.ref));
					await batch.commit();

					totalDeleted += snap.size;
				}

				return { label, totalDeleted };
			};

			// ✅ Run both tasks in parallel — efficiency boost
			const [msgResult, notifResult] = await Promise.all([
				cleanupCollectionGroup('messages', 'messages'),
				cleanupCollectionGroup('userNotifications', 'notifications'),
			]);

			console.log(`✅ Purge complete → ${msgResult.totalDeleted} messages, ${notifResult.totalDeleted} notifications removed.`);
			return null;
		} catch (error) {
			console.error('❌ Error purging expired docs:', error);
			return null;
		}
	});
