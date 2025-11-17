import { collection, query, onSnapshot, orderBy, doc, updateDoc, where, Timestamp, limit } from 'firebase/firestore';
import { useContext, useEffect, useState } from 'react';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { EventsContext } from '../../../contexts/EventsContextProvider';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import { db } from '../../../firebase';
import { Box, Typography } from '@mui/material';
import { formatMessageTime } from '../../../utils/formatTime';
import { Circle } from '@mui/icons-material';
import { NotificationType, Roles } from '../../../interfaces/enums';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from 'react-query';
import axios from '@utils/axiosInstance';

import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import EventsContextProvider from '../../../contexts/EventsContextProvider';

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
	communityTopicId?: string;
	communityMessageId?: string;
	timestamp: any;
}

interface NotificationsBoxProps {
	showUnreadOnly: boolean;
}

const NotificationsBox = ({ showUnreadOnly }: NotificationsBoxProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { user } = useContext(UserAuthContext);
	const { refreshCalendarData } = useContext(EventsContext);
	const { orgId } = useContext(OrganisationContext);
	const queryClient = useQueryClient();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [showAll, setShowAll] = useState<boolean>(false);
	const [hasOlderNotifications, setHasOlderNotifications] = useState<boolean>(false);

	const navigate = useNavigate();

	const { isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize: boolean = isVerySmallScreen || isRotated;

	useEffect(() => {
		if (!user?.firebaseUserId) return;

		const notificationsRef = collection(db, 'notifications', user.firebaseUserId, 'userNotifications');

		const sevenDaysAgo = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

		// 1) Listen only to check if older notifications exist
		const olderNotificationsQuery = query(notificationsRef, where('timestamp', '<', sevenDaysAgo), limit(1));
		const unsubscribeOld = onSnapshot(olderNotificationsQuery, (snapshot) => {
			setHasOlderNotifications(snapshot.size > 0);
		});

		// 2) Main notifications query
		let q = query(notificationsRef, orderBy('timestamp', 'desc'));

		if (!showAll) {
			q = query(q, where('timestamp', '>=', sevenDaysAgo));
		}
		if (showUnreadOnly) {
			q = query(q, where('isRead', '==', false));
		}

		const unsubscribeMain = onSnapshot(q, (snapshot) => {
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
					communityTopicId: data.communityTopicId || '',
					communityMessageId: data.communityMessageId || '',
				};
			}) as Notification[];

			setNotifications(fetchedNotifications);
		});

		// ✅ clean up BOTH listeners
		return () => {
			unsubscribeOld();
			unsubscribeMain();
		};
	}, [user?.firebaseUserId, showUnreadOnly, showAll]);

	const handleNotificationClick = async (note: Notification) => {
		if (!user || !user.firebaseUserId) return;

		const notificationRef = doc(db, 'notifications', user?.firebaseUserId, 'userNotifications', note.id);
		try {
			// Only mark as read if it's not already read
			if (!note.isRead) {
				await updateDoc(notificationRef, { isRead: true });
			}

			if (note.type === NotificationType.QUIZ_SUBMISSION) {
				const path =
					user?.role === Roles.ADMIN || user?.role === Roles.OWNER || user?.role === Roles.SUPER_ADMIN
						? `/admin/check-submission/submission/${note.submissionId}/lesson/${note.lessonId}/userlesson/${note.userLessonId}`
						: user?.role === Roles.INSTRUCTOR
							? `/instructor/check-submission/submission/${note.submissionId}/lesson/${note.lessonId}/userlesson/${note.userLessonId}`
							: `/submission-feedback/submission/${note.submissionId}/lesson/${note.lessonId}/userlesson/${note.userLessonId}`;
				navigate(path);
			} else if (note.type === NotificationType.MESSAGE_RECEIVED) {
				navigate(
					`${user?.role === Roles.ADMIN || user?.role === Roles.OWNER || user?.role === Roles.SUPER_ADMIN ? '/admin' : user?.role === Roles.INSTRUCTOR ? '/instructor' : ''}/messages`
				);
			} else if (
				note.type === NotificationType.REPORT_TOPIC &&
				(user?.role === Roles.ADMIN || user?.role === Roles.OWNER || user?.role === Roles.SUPER_ADMIN)
			) {
				navigate(`/admin/community/topic/${note.communityTopicId}`);
			} else if (
				note.type === NotificationType.REPLY_TO_COMMUNITY_MESSAGE ||
				note.type === NotificationType.REPLY_TO_COMMUNITY_TOPIC ||
				note.type === NotificationType.MENTION_USER ||
				note.type === NotificationType.REPORT_MESSAGE ||
				note.type === NotificationType.COMMUNITY_NOTIFICATION
			) {
				try {
					const response = await axios.get(`${base_url}/communityMessages/message/${note.communityMessageId}?limit=250`);
					const { page } = response.data;
					const basePath =
						user?.role === Roles.ADMIN || user?.role === Roles.OWNER || user?.role === Roles.SUPER_ADMIN
							? '/admin'
							: user?.role === Roles.INSTRUCTOR
								? '/instructor'
								: '';
					navigate(`${basePath}/community/topic/${note.communityTopicId}?page=${page}&messageId=${note.communityMessageId}`);
				} catch (error) {
					console.error('Error fetching message page:', error);
					// Fallback: navigate to topic without specific page/message
					const basePath =
						user?.role === Roles.ADMIN || user?.role === Roles.OWNER || user?.role === Roles.SUPER_ADMIN
							? '/admin'
							: user?.role === Roles.INSTRUCTOR
								? '/instructor'
								: '';
					navigate(`${basePath}/community/topic/${note.communityTopicId}`);
				}
			} else if (note.type === NotificationType.NEW_COMMUNITY_TOPIC) {
				navigate(
					`${user?.role === Roles.ADMIN || user?.role === Roles.OWNER || user?.role === Roles.SUPER_ADMIN ? '/admin' : user?.role === Roles.INSTRUCTOR ? '/instructor' : ''}/community/topic/${note.communityTopicId}`
				);
			} else if (note.type === NotificationType.ADD_TO_EVENT || note.type === NotificationType.PUBLIC_EVENT) {
				// Only refresh calendar data if notification is unread
				if (!note.isRead) {
					await refreshCalendarData();
				}
				// Navigate to calendar
				if (user?.role === Roles.ADMIN || user?.role === Roles.OWNER || user?.role === Roles.SUPER_ADMIN) {
					navigate(`/admin/calendar`);
				} else if (user?.role === Roles.INSTRUCTOR) {
					navigate(`/instructor/calendar`);
				} else {
					navigate(`/calendar`);
				}
			} else if (note.type === NotificationType.COURSE_INSTRUCTOR_ASSIGNMENT) {
				// Invalidate courses cache to refresh data
				if (!note.isRead && orgId) {
					try {
						// Determine the correct entity key based on user role
						const entityKey = user?.role === Roles.INSTRUCTOR ? 'instructorCourses' : 'allCourses';

						// Invalidate all pages for this entity
						queryClient.invalidateQueries([entityKey, orgId]);
					} catch (error) {
						console.error('Error invalidating courses cache:', error);
					}
				}
				// Navigate to courses page based on user role
				if (user?.role === Roles.ADMIN || user?.role === Roles.OWNER || user?.role === Roles.SUPER_ADMIN) {
					navigate(`/admin/courses`);
				} else if (user?.role === Roles.INSTRUCTOR) {
					navigate(`/instructor/courses`);
				} else {
					navigate(`/courses`);
				}
			}

			// Update local state only if notification was unread
			if (!note.isRead) {
				setNotifications((prev) => prev?.map((n) => (n.id === note.id ? { ...n, isRead: true } : n)) || []);
			}
		} catch (error) {
			console.error('Error marking notification as read:', error);
		}
	};

	return (
		<Box>
			{notifications && notifications.length > 0 ? (
				<Box>
					{notifications?.map((note) => {
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
													'cursor': 'pointer',
													':hover': {
														textDecoration: 'underline',
													},
													'fontSize': '0.75rem',
												}}>
												{note.message}
											</Typography>

											<Typography variant='caption' sx={{ fontSize: '0.55rem', color: 'gray' }}>
												{formatMessageTime(note.timestamp)}
											</Typography>
										</Box>
									</Box>
								</Box>
								<Box sx={{ margin: '0 0.5rem 0 2rem' }}>{!note.isRead && <Circle sx={{ color: '#1976D2', fontSize: '0.85rem' }} />}</Box>
							</Box>
						);
					})}
					<Box sx={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
						{hasOlderNotifications && (
							<Typography
								onClick={() => setShowAll(!showAll)}
								variant='body2'
								sx={{
									'margin': '1rem 0',
									'textTransform': 'capitalize',
									'cursor': 'pointer',
									':hover': {
										backgroundColor: 'transparent',
										textDecoration: 'underline',
									},
								}}>
								{showAll ? 'Show Last 7 Days' : 'See All Notifications'}
							</Typography>
						)}
					</Box>
				</Box>
			) : (
				<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '15vh' }}>
					<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>You don't have any/unread notifications right now</Typography>
				</Box>
			)}
		</Box>
	);
};

// Wrapper component to provide EventsContext
const NotificationsBoxWithContext = (props: NotificationsBoxProps) => {
	return (
		<EventsContextProvider>
			<NotificationsBox {...props} />
		</EventsContextProvider>
	);
};

export default NotificationsBoxWithContext;
