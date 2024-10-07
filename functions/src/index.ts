// Import required modules from Firebase Functions and Admin SDK
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Scheduled Cloud Function to delete notifications older than 30 days
exports.deleteOldNotifications = functions.pubsub.schedule('every 48 hours').onRun(async (context) => {
	try {
		// Calculate the cutoff date for 30 days ago
		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - 30);
		const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoff);

		// Query notifications older than the cutoff date
		const notificationsRef = db.collection('notifications');
		const oldNotifications = await notificationsRef.where('createdAt', '<=', cutoffTimestamp).get();

		// Batch delete notifications
		const batch = db.batch();
		oldNotifications.forEach((doc) => {
			batch.delete(doc.ref);
		});

		// Commit batch deletion
		await batch.commit();
		console.log(`Deleted ${oldNotifications.size} old notifications.`);

		return null;
	} catch (error) {
		console.error('Error deleting old notifications:', error);
		throw new functions.https.HttpsError('internal', 'Unable to delete old notifications');
	}
});

// Example HTTPS Function (Optional)
// You can uncomment this function to create an HTTP-triggered function as a placeholder
// exports.helloWorld = functions.https.onRequest((request, response) => {
//     functions.logger.info("Hello logs!", {structuredData: true});
//     response.send("Hello from Firebase!");
// });

//firebase deploy --only functions (run this in terminal but the plan must be upgraded to pay-as-you-go)
