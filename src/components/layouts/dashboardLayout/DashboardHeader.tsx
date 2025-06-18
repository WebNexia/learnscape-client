import { AppBar, Badge, Box, Button, IconButton, Switch, Toolbar, Tooltip, Typography } from '@mui/material';
import theme from '../../../themes';
import { useNavigate } from 'react-router-dom';
import { useContext, useEffect, useRef, useState } from 'react';
import { Mode, Roles } from '../../../interfaces/enums';
import { Cancel, DarkMode, DoneAll, LightMode, Menu, Notifications } from '@mui/icons-material';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { useUserCourseLessonData } from '../../../hooks/useUserCourseLessonData';
import NotificationsBox from '../notifications/Notifications';
import { collection, doc, getDocs, onSnapshot, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../../../firebase';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import CustomDrawer from './CustomDrawer';

interface DashboardHeaderProps {
	pageName: string;
}

const DashboardHeader = ({ pageName }: DashboardHeaderProps) => {
	const { signOut, user } = useContext(UserAuthContext);
	const { isRotated, isVerySmallScreen, isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const [mode, setMode] = useState<Mode>((localStorage.getItem('mode') as Mode) || Mode.LIGHT_MODE);
	const navigate = useNavigate();
	const { updateInProgressLessons } = useUserCourseLessonData();

	const isMobileSize: boolean = isSmallScreen || isRotatedMedium;

	const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

	const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
	const [numberOfUnreadNotifications, setNumberOfUnreadNotifications] = useState<number>(0);

	const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(false);

	const notificationsRef = useRef<HTMLDivElement>(null); // Create a ref for the notifications box

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			// Close notifications if click is outside the notifications box
			if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
				setNotificationsOpen(false);
			}
		};

		// Attach the event listener to detect outside clicks
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside); // Cleanup on unmount
	}, [notificationsRef]);

	const clearAllQuizData = () => {
		Object.keys(localStorage).forEach((key) => {
			if (key.startsWith('UserQuizAnswers-')) {
				localStorage.removeItem(key);
			}
		});
	};

	useEffect(() => {
		if (!localStorage.getItem('mode')) {
			localStorage.setItem('mode', Mode.LIGHT_MODE);
		}
	}, []);

	useEffect(() => {
		if (!user) return;

		// Real-time listener for notifications, metadata-only query
		const notificationsRef = collection(db, 'notifications', user.firebaseUserId, 'userNotifications');
		const q = query(notificationsRef, where('isRead', '==', false));

		const unsubscribe = onSnapshot(
			q,
			{ includeMetadataChanges: true }, // Fetch metadata only
			(snapshot) => {
				const unreadCount = snapshot.size; // Snapshot size gives the count of unread notifications
				setNumberOfUnreadNotifications(unreadCount);
			}
		);

		return () => unsubscribe();
	}, [user]);

	const markAllAsRead = async (userFirebaseId: string) => {
		if (!userFirebaseId) return;

		try {
			// Create a reference to the notifications collection for the user
			const notificationsRef = collection(db, 'notifications', userFirebaseId, 'userNotifications');

			// Query to fetch all unread notifications (isRead: false)
			const q = query(notificationsRef, where('isRead', '==', false));
			const querySnapshot = await getDocs(q);

			if (querySnapshot.empty) {
				return;
			}

			// Use a batch to update multiple documents at once
			const batch = writeBatch(db);

			querySnapshot.forEach((docSnapshot) => {
				const notificationDocRef = doc(db, 'notifications', userFirebaseId, 'userNotifications', docSnapshot.id);
				batch.update(notificationDocRef, { isRead: true });
			});

			// Commit the batch
			await batch.commit();
		} catch (error) {
			console.error('Error marking notifications as read:', error);
		}
	};

	return (
		<AppBar position='sticky'>
			<Toolbar
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					height: '3.5rem',
					width: '100%',
					backgroundColor: user?.role === Roles.ADMIN ? theme.bgColor?.adminHeader : theme.bgColor?.lessonInProgress,
					padding: isVerySmallScreen || isRotated ? '0 0.5rem 0 0.25rem' : '0 0rem',
					position: 'relative',
				}}>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					{(isSmallScreen || isRotatedMedium) && (
						<IconButton onClick={() => setIsDrawerOpen(true)}>
							<Menu sx={{ color: '#fff', padding: 0 }} fontSize='small' />
						</IconButton>
					)}

					<Typography
						variant={isMobileSize ? 'body2' : 'body1'}
						sx={{ color: theme.textColor?.common.main, fontSize: isMobileSize ? '0.8rem' : undefined }}>
						{pageName}
					</Typography>
				</Box>

				<CustomDrawer isDrawerOpen={isDrawerOpen} setIsDrawerOpen={setIsDrawerOpen}></CustomDrawer>

				<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
					<Badge
						badgeContent={numberOfUnreadNotifications}
						color='error'
						max={9}
						anchorOrigin={{
							vertical: 'top',
							horizontal: 'right',
						}}
						sx={{
							'& .MuiBadge-badge': {
								fontSize: isMobileSize ? '0.5rem' : '0.65rem',
								height: isMobileSize ? '0.75rem' : '0.9rem',
								minWidth: isMobileSize ? '0.75rem' : '1rem',
								right: 8,
								top: 8,
							},
						}}>
						<IconButton
							onClick={() => setNotificationsOpen(!notificationsOpen)}
							sx={{
								':hover': {
									backgroundColor: 'transparent',
								},
							}}>
							<Notifications color='secondary' fontSize={isMobileSize ? 'small' : 'medium'} sx={{ fontSize: isMobileSize ? '1rem' : undefined }} />
						</IconButton>
					</Badge>

					{notificationsOpen && (
						<Box
							ref={notificationsRef}
							sx={{
								position: 'absolute',
								right: 0,
								top: isMobileSize ? '3.5rem' : '4rem',
								height: 'calc(100vh - 4rem)',
								width: isMobileSize ? '100vw' : '27.5rem',
								overflow: 'auto',
								backgroundColor: '#F5F5F5',
								zIndex: 10001,
								border: 'solid 0.1rem lightgray',
								borderRadius: '0.35rem',
							}}>
							<Box
								sx={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									padding: '0.15rem 0.5rem',
									borderBottom: 'solid 0.12rem lightgray',
									zIndex: 10001,
								}}>
								<Box sx={{ zIndex: 10001 }}>
									<Typography variant={isMobileSize ? 'body2' : 'h6'}>Notifications</Typography>
								</Box>
								<Box sx={{ display: 'flex', alignItems: 'center', zIndex: 10001 }}>
									<Typography sx={{ marginRight: '0.5rem', fontSize: '0.75rem' }}>{showUnreadOnly ? 'Unread' : 'All'}</Typography>
									<Switch
										checked={showUnreadOnly}
										onChange={() => setShowUnreadOnly((prev) => !prev)}
										inputProps={{ 'aria-label': 'toggle between unread and all notifications' }}
									/>
								</Box>
								<Box sx={{ zIndex: 10001 }}>
									<Tooltip title='Mark All as Read' placement='top'>
										<IconButton
											onClick={() => {
												if (user && user.firebaseUserId) {
													markAllAsRead(user.firebaseUserId);
												}
											}}
											sx={{
												':hover': {
													backgroundColor: 'transparent',
												},
											}}>
											<DoneAll fontSize={isMobileSize ? 'small' : 'medium'} />
										</IconButton>
									</Tooltip>
									<IconButton
										onClick={() => setNotificationsOpen(false)}
										sx={{
											':hover': {
												backgroundColor: 'transparent',
											},
										}}>
										<Cancel fontSize={isMobileSize ? 'small' : 'medium'} />
									</IconButton>
								</Box>
							</Box>

							<NotificationsBox showUnreadOnly={showUnreadOnly} />
						</Box>
					)}
					{
						{
							[Mode.DARK_MODE]: (
								<Tooltip title='Light Mode' placement='top'>
									<IconButton
										sx={{
											'color': theme.textColor?.common.main,
											'margin': '0 0.75rem',
											':hover': {
												backgroundColor: 'transparent',
											},
										}}
										onClick={() => {
											setMode(Mode.LIGHT_MODE);
											localStorage.setItem('mode', Mode.LIGHT_MODE);
										}}>
										<DarkMode fontSize={isMobileSize ? 'small' : 'medium'} sx={{ fontSize: isMobileSize ? '1rem' : undefined }} />
									</IconButton>
								</Tooltip>
							),
							[Mode.LIGHT_MODE]: (
								<Tooltip title='Dark Mode' placement='top'>
									<IconButton
										sx={{
											'color': theme.textColor?.common.main,
											'margin': '0 0.75rem',
											':hover': {
												backgroundColor: 'transparent',
											},
										}}
										onClick={() => {
											setMode(Mode.DARK_MODE);
											localStorage.setItem('mode', Mode.DARK_MODE);
										}}>
										<LightMode fontSize={isMobileSize ? 'small' : 'medium'} sx={{ fontSize: isMobileSize ? '1rem' : undefined }} />
									</IconButton>
								</Tooltip>
							),
						}[mode]
					}
					<Button
						sx={{
							textTransform: 'capitalize',
							color: theme.textColor?.common.main,
							fontFamily: theme.fontFamily?.main,
							fontSize: isMobileSize ? '0.75rem' : '0.9rem',
						}}
						onClick={async () => {
							await signOut();
							await updateInProgressLessons();
							clearAllQuizData();
							navigate('/');
						}}>
						Log Out
					</Button>
				</Box>
			</Toolbar>
		</AppBar>
	);
};

export default DashboardHeader;
