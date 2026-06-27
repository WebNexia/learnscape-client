import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

const FIREBASE_STORAGE_URL_REGEX = /^https:\/\/(firebasestorage\.googleapis\.com|storage\.googleapis\.com)\/v0\/b\/([^/]+)\/o\/(.+?)(\?|$)/;

const PROTECTED_STORAGE_PREFIXES = ['ProfileImages/'];

function extractBucketAndPathFromStorageUrl(url: string): { bucket: string; path: string } | null {
	if (typeof url !== 'string' || !url.trim()) return null;
	const match = url.trim().match(FIREBASE_STORAGE_URL_REGEX);
	if (!match) return null;
	try {
		const bucket = match[2];
		const encodedPath = match[3];
		const path = decodeURIComponent(encodedPath.replace(/\+/g, ' '));
		return path ? { bucket, path } : null;
	} catch {
		return null;
	}
}

async function deleteStorageUrlsFromMessages(
	docs: FirebaseFirestore.QueryDocumentSnapshot[]
): Promise<{ deleted: number; failed: number }> {
	const urls: string[] = [];
	docs.forEach((d) => {
		const data = d.data() || {};
		if (data.imageUrl && typeof data.imageUrl === 'string') urls.push(data.imageUrl);
		if (data.videoUrl && typeof data.videoUrl === 'string') urls.push(data.videoUrl);
	});
	const unique = [...new Set(urls)];
	let deleted = 0;
	let failed = 0;
	for (const url of unique) {
		const parsed = extractBucketAndPathFromStorageUrl(url);
		if (!parsed) continue;
		if (PROTECTED_STORAGE_PREFIXES.some((prefix) => parsed.path.startsWith(prefix))) continue;
		try {
			await storage.bucket(parsed.bucket).file(parsed.path).delete({ ignoreNotFound: true });
			deleted++;
		} catch (err) {
			failed++;
			console.warn('Storage delete failed for URL:', url.slice(0, 80), (err as Error).message);
		}
	}
	return { deleted, failed };
}

/**
 * Firestore trigger to add expireAt field on message creation
 * Used for TTL auto-delete in Firestore
 */
exports.setExpireAtForMessages = functions.firestore
	.document('chats/{chatId}/messages/{messageId}')
	.onCreate(async (snap) => {
		try {
			const data = snap.data() || {};

			const created =
				data.timestamp instanceof admin.firestore.Timestamp
					? data.timestamp
					: admin.firestore.Timestamp.now();

			const expireAt = admin.firestore.Timestamp.fromMillis(
				created.toMillis() + 30 * 24 * 60 * 60 * 1000 // 30 days
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
exports.setExpireAtForNotifications = functions.firestore
	.document('notifications/{userId}/userNotifications/{notifId}')
	.onCreate(async (snap) => {
		try {
			const data = snap.data() || {};

			// Handle different timestamp formats
			let created: admin.firestore.Timestamp;
			if (data.timestamp instanceof admin.firestore.Timestamp) {
				created = data.timestamp;
			} else if (data.timestamp && typeof (data.timestamp as { toDate?: () => Date }).toDate === 'function') {
				created = admin.firestore.Timestamp.fromDate(
					(data.timestamp as { toDate: () => Date }).toDate()
				);
			} else {
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
	.schedule('every monday 01:00')
	.timeZone('Europe/London')
	.onRun(async () => {
		try {
			const now = admin.firestore.Timestamp.now();

			const cleanupCollectionGroup = async (groupName: string, label: string) => {
				let totalDeleted = 0;
				let storageDeleted = 0;
				let storageFailed = 0;
				const groupRef = db.collectionGroup(groupName);

				while (true) {
					const snap = await groupRef
						.where('expireAt', '<=', now)
						.orderBy('expireAt')
						.limit(500)
						.get();

					if (snap.empty) break;

					// For messages: delete uploaded files from Firebase Storage before removing Firestore docs
					if (groupName === 'messages' && snap.size > 0) {
						const result = await deleteStorageUrlsFromMessages(snap.docs);
						storageDeleted += result.deleted;
						storageFailed += result.failed;
					}

					const batch = db.batch();
					snap.docs.forEach((doc) => batch.delete(doc.ref));
					await batch.commit();

					totalDeleted += snap.size;
				}

				if (groupName === 'messages' && (storageDeleted > 0 || storageFailed > 0)) {
					console.log(`✅ Storage: ${storageDeleted} file(s) deleted, ${storageFailed} failed (${label})`);
				}
				return { label, totalDeleted };
			};

			const [msgResult, notifResult] = await Promise.all([
				cleanupCollectionGroup('messages', 'messages'),
				cleanupCollectionGroup('userNotifications', 'notifications'),
			]);

			console.log(
				`✅ Purge complete → ${msgResult.totalDeleted} messages, ${notifResult.totalDeleted} notifications removed.`
			);
			return null;
		} catch (error) {
			console.error('❌ Error purging expired docs:', error);
			return null;
		}
	});
