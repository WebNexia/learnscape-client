import { collection, query, onSnapshot, orderBy, doc, updateDoc, where } from 'firebase/firestore';
import { useContext, useEffect, useState } from 'react';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { db } from '../../../firebase';
import { Box, Typography } from '@mui/material';
import { formatMessageTime } from '../../../utils/formatTime';
import { Circle } from '@mui/icons-material';
import { NotificationType, Roles } from '../../../interfaces/enums';
import { useNavigate } from 'react-router-dom';

interface Notification {
	id: string;
	title: string;
	message: string;
	isRead: boolean;
	type: string;
	userImageUrl: string;
	lessonId?: string;
	submissionId?: string;
	userLessonId?: string;
	timestamp: any;
}

interface NotificationsBoxProps {
	showUnreadOnly: boolean;
}

const NotificationsBox = ({ showUnreadOnly }: NotificationsBoxProps) => {
	const { user } = useContext(UserAuthContext);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const navigate = useNavigate();

	useEffect(() => {
		if (!user) return;

		// Real-time listener for notifications
		const notificationsRef = collection(db, 'notifications', user.firebaseUserId, 'userNotifications');
		let q = query(notificationsRef, orderBy('timestamp', 'desc'));

		if (showUnreadOnly) {
			q = query(notificationsRef, where('isRead', '==', false), orderBy('timestamp', 'desc'));
		}

		const unsubscribe = onSnapshot(q, (snapshot) => {
			const fetchedNotifications = snapshot.docs.map((doc) => {
				const data = doc.data();

				return {
					id: doc.id,
					title: data.title || 'No title',
					message: data.message || 'No message',
					isRead: data.isRead || false,
					type: data.type || 'general',
					timestamp: data.timestamp || null,
					userImageUrl: data.userImageUrl || '',
					lessonId: data.lessonId || '',
					submissionId: data.submissionId || '',
					userLessonId: data.userLessonId || '',
				};
			}) as Notification[];

			setNotifications(fetchedNotifications);
		});

		// Clean up the listener on component unmount
		return () => unsubscribe();
	}, [user, showUnreadOnly]);

	const handleNotificationClick = async (note: Notification) => {
		if (!user || !user.firebaseUserId) return;

		const notificationRef = doc(db, 'notifications', user?.firebaseUserId, 'userNotifications', note.id);
		try {
			await updateDoc(notificationRef, { isRead: true });

			// Navigate if the notification requires it
			if (note.type === NotificationType.QUIZ_SUBMISSION && user?.role === Roles.ADMIN) {
				navigate(`/admin/check-submission/user/${user?._id}/submission/${note.submissionId}/lesson/${note.lessonId}/userlesson/${note.userLessonId}`);
			} else if (note.type === NotificationType.QUIZ_SUBMISSION && user?.role === Roles.USER) {
				navigate(`/submission-feedback/user/${user?._id}/submission/${note.submissionId}/lesson/${note.lessonId}/userlesson/${note.userLessonId}`);
			} else if (note.type === NotificationType.MESSAGE_RECEIVED) {
				navigate(`${user?.role !== Roles.ADMIN ? '' : '/admin'}/messages/user/${user?._id}`);
			}
			// Update local state to mark as read immediately
			setNotifications((prevNotifications) => prevNotifications.map((n) => (n.id === note.id ? { ...n, isRead: true } : n)));
		} catch (error) {
			console.error('Error marking notification as read:', error);
		}
	};

	return (
		<Box>
			{notifications.length > 0 ? (
				<Box>
					{notifications.map((note) => {
						return (
							<Box
								key={note.id}
								sx={{
									display: 'flex',
									width: '100%',
									justifyContent: 'space-between',
									alignItems: 'center',
									mt: '0.25rem',
									padding: '0.5rem 0.75rem 0.25rem 0.75rem',
									borderBottom: 'solid lightgray 0.05rem',
								}}>
								<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
									<Box sx={{ display: 'flex', alignItems: 'center' }}>
										<img
											src={note.userImageUrl || 'https://img.sportsbookreview.com/images/avatars/default-avatar.jpg'}
											alt='img'
											style={{ height: '2.5rem', width: '2.5rem', borderRadius: '50%', marginRight: '0.5rem', border: 'solid 0.05rem lightgray' }}
										/>
										<Box>
											<Typography
												onClick={() => {
													handleNotificationClick(note);
												}}
												sx={{
													cursor: 'pointer',
													':hover': {
														textDecoration: 'underline',
													},
													fontSize: '0.75rem',
												}}>
												{note.message}
											</Typography>

											<Typography variant='caption' sx={{ fontSize: '0.55rem', color: 'gray' }}>
												{formatMessageTime(note.timestamp)}
											</Typography>
										</Box>
									</Box>
								</Box>
								<Box sx={{ margin: '0 0.5rem 0 2rem' }}>
									<Circle sx={{ color: note.isRead ? '#9E9E9E' : '#1976D2', fontSize: '0.85rem' }} />
								</Box>
							</Box>
						);
					})}
				</Box>
			) : (
				<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '15vh' }}>
					<Typography variant='body2'>You don't have any/unread notifications right now</Typography>
				</Box>
			)}
		</Box>
	);
};

export default NotificationsBox;
