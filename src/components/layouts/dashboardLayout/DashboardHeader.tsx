import { AppBar, Badge, Box, Button, IconButton, Switch, Toolbar, Tooltip, Typography } from '@mui/material';
import theme from '../../../themes';
import { useNavigate } from 'react-router-dom';
import { useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Roles } from '../../../interfaces/enums';
import { Cancel, DoneAll, Menu, Notifications, BugReport, Delete, ClearAll, Star, Settings } from '@mui/icons-material';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { useUserCourseLessonData } from '../../../hooks/useUserCourseLessonData';
import NotificationsBox from '../notifications/Notifications';
import { collection, doc, onSnapshot, query, where, writeBatch, serverTimestamp, getDocs, limit } from 'firebase/firestore';
import { db } from '../../../firebase';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import CustomDrawer from './CustomDrawer';
import ReportBugDialog from '../dashboard/ReportBugDialog';
import SubscriptionDialog from '../../subscription/SubscriptionDialog';
import UnsubscribeDialog from '../../subscription/UnsubscribeDialog';
import ConditionalStripeProvider from '../../common/ConditionalStripeProvider';
import { useUnreadMessages } from '../../../hooks/useUnreadMessages';
import { useAuth } from '../../../hooks/useAuth';

interface DashboardHeaderProps {
	pageName: string;
}

const DashboardHeader = ({ pageName }: DashboardHeaderProps) => {
	const { signOut, user, setUser } = useContext(UserAuthContext);
	const { isRotated, isVerySmallScreen, isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);

	const navigate = useNavigate();
	const { updateInProgressLessons } = useUserCourseLessonData();

	const isMobileSize: boolean = isSmallScreen || isRotatedMedium;

	const { hasAdminAccess } = useAuth();

	// Memoize expensive computations
	const hasActiveSubscriptionMemo = useMemo(() => {
		return (user: any): boolean => {
			// User has active subscription if:
			// 1. isSubscribed is true AND status is 'active', OR
			// 2. subscriptionStatus is 'canceled_at_period_end' (scheduled for cancellation but still has access)
			return (user?.isSubscribed === true && user?.subscriptionStatus === 'active') || user?.subscriptionStatus === 'canceled_at_period_end';
		};
	}, []);

	// Check if subscription is scheduled for cancellation (user cannot re-subscribe until period ends)
	const isSubscriptionScheduledForCancellation = useMemo(() => {
		return (user: any): boolean => {
			return user?.subscriptionStatus === 'canceled_at_period_end';
		};
	}, []);

	// Format period end date for tooltip
	const getPeriodEndTooltip = useMemo(() => {
		return (user: any): string => {
			if (!user?.subscriptionValidUntil) return '';
			const endDate = new Date(user.subscriptionValidUntil);
			return `Access ends on ${endDate.toLocaleDateString('en-GB', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			})}`;
		};
	}, []);

	const headerBackgroundColor = useMemo(() => {
		return hasAdminAccess
			? theme.bgColor?.adminHeader
			: user?.role === Roles.INSTRUCTOR
				? theme.bgColor?.instructorHeader
				: user?.role === Roles.USER
					? theme.bgColor?.lessonInProgress
					: theme.bgColor?.adminHeader;
	}, [hasAdminAccess, user?.role]);

	const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
	const hasUnreadMessages = useUnreadMessages();
	const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
	const [numberOfUnreadNotifications, setNumberOfUnreadNotifications] = useState<number>(0);

	const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(false);
	const [bugReportDialogOpen, setBugReportDialogOpen] = useState<boolean>(false);
	const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState<boolean>(false);
	const [unsubscribeDialogOpen, setUnsubscribeDialogOpen] = useState<boolean>(false);

	const notificationsRef = useRef<HTMLDivElement>(null); // Create a ref for the notifications box
	const notificationsButtonRef = useRef<HTMLButtonElement>(null); // Create a ref for the notifications button

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			// Close notifications if click is outside both the notifications box and the notifications button
			const target = event.target as Node;
			const isOutsideNotificationsBox = !notificationsRef.current?.contains(target);
			const isOutsideNotificationsButton = !notificationsButtonRef.current?.contains(target);

			if (isOutsideNotificationsBox && isOutsideNotificationsButton) {
				setNotificationsOpen(false);
			}
		};

		// Attach the event listener to detect outside clicks
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside); // Cleanup on unmount
	}, []);

	const clearAllQuizData = useCallback(() => {
		Object.keys(localStorage)?.forEach((key) => {
			if (key.startsWith('UserQuizAnswers-')) {
				localStorage.removeItem(key);
			}
		});
	}, []);

	useEffect(() => {
		if (!user?.firebaseUserId) return;

		// Real-time listener for unread notifications count
		const notificationsRef = collection(db, 'notifications', user?.firebaseUserId, 'userNotifications');
		const q = query(notificationsRef, where('isRead', '==', false));

		const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
			const unreadCount = snapshot.size;
			setNumberOfUnreadNotifications(unreadCount);
		});

		return () => unsubscribe();
	}, [user?.firebaseUserId]);

	const markAllAsRead = useCallback(async (userFirebaseId: string) => {
		if (!userFirebaseId) return;

		try {
			const notificationsRef = collection(db, 'notifications', userFirebaseId, 'userNotifications');

			// Firestore max batch limit = 500
			const BATCH_LIMIT = 500;

			let hasMore = true;
			let totalUpdated = 0;

			while (hasMore) {
				// Get unread notifications only (more efficient - only reads what we need to update)
				const snapshot = await getDocs(query(notificationsRef, where('isRead', '==', false), limit(BATCH_LIMIT)));

				if (snapshot.empty) {
					hasMore = false;
					break;
				}

				const batch = writeBatch(db);

				snapshot.forEach((docSnapshot) => {
					batch.update(doc(db, 'notifications', userFirebaseId, 'userNotifications', docSnapshot.id), {
						isRead: true,
					});
				});

				await batch.commit();
				totalUpdated += snapshot.size;

				// If exactly 500, there might be more — continue loop
				hasMore = snapshot.size === BATCH_LIMIT;
			}

			// eslint-disable-next-line no-console
			console.log(`Marked ${totalUpdated} notifications as read`);
		} catch (error) {
			console.error('Error marking notifications as read:', error);
		}
	}, []);

	const deleteAllNotifications = useCallback(async (userFirebaseId: string) => {
		if (!userFirebaseId) return;

		try {
			const notificationsRef = collection(db, 'notifications', userFirebaseId, 'userNotifications');

			// Firestore max batch limit = 500
			const BATCH_LIMIT = 500;

			let hasMore = true;

			while (hasMore) {
				const snapshot = await getDocs(query(notificationsRef, limit(BATCH_LIMIT)));

				if (snapshot.empty) {
					hasMore = false;
					break;
				}

				const batch = writeBatch(db);

				snapshot.forEach((docSnapshot) => {
					batch.delete(doc(db, 'notifications', userFirebaseId, 'userNotifications', docSnapshot.id));
				});

				await batch.commit();

				// If exactly 500, there might be more — continue loop
				hasMore = snapshot.size === BATCH_LIMIT;
			}
		} catch (error) {
			console.error('Error deleting notifications:', error);
		}
	}, []);

	return (
		<AppBar position='sticky'>
			<Toolbar
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					height: '3.5rem',
					width: '100%',
					backgroundColor: headerBackgroundColor,
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

				<CustomDrawer isDrawerOpen={isDrawerOpen} setIsDrawerOpen={setIsDrawerOpen} hasUnreadMessages={hasUnreadMessages}></CustomDrawer>

				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					{/* Subscribe/Unsubscribe Button */}
					{user?.role === Roles.USER && !user?.hasRegisteredCourse && (
						<>
							{!hasActiveSubscriptionMemo(user) ? (
								<Tooltip
									title={
										isSubscriptionScheduledForCancellation(user)
											? getPeriodEndTooltip(user) ||
												'Subscription is scheduled for cancellation. You cannot re-subscribe until the current period ends.'
											: ''
									}
									arrow>
									<span>
										<Button
											variant='contained'
											startIcon={<Star />}
											onClick={() => setSubscriptionDialogOpen(true)}
											disabled={isSubscriptionScheduledForCancellation(user)}
											sx={{
												'backgroundColor': theme.textColor?.greenPrimary.main,
												'color': '#fff',
												'fontSize': isMobileSize ? '0.7rem' : '0.8rem',
												'fontFamily': theme.fontFamily?.main,
												'textTransform': 'capitalize',
												'mr': 1,
												'px': isMobileSize ? 1 : 2,
												'py': 0.5,
												'&:hover': {
													backgroundColor: theme.textColor?.greenPrimary.main,
													opacity: 0.8,
												},
												'&:disabled': {
													backgroundColor: '#ccc',
													color: '#fff',
													opacity: 0.6,
												},
											}}>
											Subscribe
										</Button>
									</span>
								</Tooltip>
							) : (
								<Tooltip
									title={
										isSubscriptionScheduledForCancellation(user)
											? getPeriodEndTooltip(user) || 'Subscription is already scheduled for cancellation'
											: ''
									}
									arrow>
									<span>
										<Button
											variant='outlined'
											startIcon={<Star />}
											onClick={() => setUnsubscribeDialogOpen(true)}
											disabled={isSubscriptionScheduledForCancellation(user)}
											sx={{
												'borderColor': theme.textColor?.error.main,
												'color': '#fff',
												'fontSize': isMobileSize ? '0.7rem' : '0.8rem',
												'fontFamily': theme.fontFamily?.main,
												'textTransform': 'capitalize',
												'mr': 1,
												'px': isMobileSize ? 1 : 2,
												'py': 0.5,
												'&:hover': {
													borderColor: theme.textColor?.error.main,
													backgroundColor: theme.textColor?.error.main,
												},
												'&:disabled': {
													borderColor: '#ccc',
													color: '#ccc',
													opacity: 0.6,
												},
											}}>
											{isSubscriptionScheduledForCancellation(user) ? 'Cancelled' : 'Unsubscribe'}
										</Button>
									</span>
								</Tooltip>
							)}
						</>
					)}

					<Tooltip title='Report a Bug' placement='top' arrow>
						<IconButton
							onClick={() => setBugReportDialogOpen(true)}
							sx={{
								':hover': {
									backgroundColor: 'transparent',
								},
								'mr': 1,
							}}>
							<BugReport
								color='secondary'
								fontSize={isMobileSize ? 'small' : 'medium'}
								sx={{
									fontSize: isMobileSize ? '1rem' : undefined,
								}}
							/>
						</IconButton>
					</Tooltip>

					{hasAdminAccess && (
						<Tooltip title='Recycle Bin' placement='top' arrow>
							<IconButton
								onClick={() => navigate('/admin/recycle-bin')}
								sx={{
									':hover': {
										backgroundColor: 'transparent',
									},
									'mr': 1,
								}}>
								<Delete
									color='secondary'
									fontSize={isMobileSize ? 'small' : 'medium'}
									sx={{
										fontSize: isMobileSize ? '1rem' : undefined,
									}}
								/>
							</IconButton>
						</Tooltip>
					)}

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
								right: 24,
								top: 8,
							},
						}}>
						<IconButton
							ref={notificationsButtonRef}
							onClick={() => setNotificationsOpen(!notificationsOpen)}
							sx={{
								':hover': {
									backgroundColor: 'transparent',
								},
							}}>
							<Notifications
								color='secondary'
								fontSize={isMobileSize ? 'small' : 'medium'}
								sx={{ fontSize: isMobileSize ? '1rem' : undefined, mr: '1rem' }}
							/>
						</IconButton>
					</Badge>

					{(hasAdminAccess || user?.role === Roles.INSTRUCTOR) && (
						<Tooltip title='Settings' placement='top' arrow>
							<IconButton
								onClick={() => {
									const settingsPath = hasAdminAccess ? '/admin/settings' : '/instructor/settings';
									navigate(settingsPath);
								}}
								sx={{
									':hover': {
										backgroundColor: 'transparent',
									},
									'mr': 1,
									'ml': -1,
								}}>
								<Settings
									color='secondary'
									fontSize={isMobileSize ? 'small' : 'medium'}
									sx={{
										fontSize: isMobileSize ? '1rem' : undefined,
									}}
								/>
							</IconButton>
						</Tooltip>
					)}

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
									<Tooltip title='Delete All Notifications' placement='top' arrow>
										<IconButton
											onClick={() => {
												if (user && user.firebaseUserId) {
													deleteAllNotifications(user.firebaseUserId);
												}
											}}
											sx={{
												':hover': {
													backgroundColor: 'transparent',
												},
											}}>
											<ClearAll fontSize={isMobileSize ? 'small' : 'medium'} />
										</IconButton>
									</Tooltip>
									<Tooltip title='Mark All as Read' placement='top' arrow>
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
									<Tooltip title='Close' placement='top' arrow>
										<IconButton
											onClick={() => setNotificationsOpen(false)}
											sx={{
												':hover': {
													backgroundColor: 'transparent',
												},
											}}>
											<Cancel fontSize={isMobileSize ? 'small' : 'medium'} />
										</IconButton>
									</Tooltip>
								</Box>
							</Box>

							<NotificationsBox showUnreadOnly={showUnreadOnly} />
						</Box>
					)}
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

			<ReportBugDialog open={bugReportDialogOpen} onClose={() => setBugReportDialogOpen(false)} />

			{/* Subscription Dialog */}
			<ConditionalStripeProvider>
				<SubscriptionDialog
					open={subscriptionDialogOpen}
					onClose={() => setSubscriptionDialogOpen(false)}
					onSuccess={async () => {
						if (user) {
							setUser((prevUser) => {
								if (prevUser) {
									// Calculate expiry date based on subscription type
									// For now, we'll use a default 30 days, but this should ideally come from the subscription response
									const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

									return {
										...prevUser,
										isSubscribed: true,
										subscriptionStatus: 'active',
										accessLevel: 'subscription',
										subscriptionType: 'monthly', // This should ideally come from the subscription data
										subscriptionValidUntil: expiryDate,
										subscriptionExpiry: expiryDate,
									};
								}
								return prevUser;
							});
						}
						// Close the subscription dialog
						setSubscriptionDialogOpen(false);
					}}
				/>
			</ConditionalStripeProvider>

			<UnsubscribeDialog open={unsubscribeDialogOpen} onClose={() => setUnsubscribeDialogOpen(false)} />
		</AppBar>
	);
};

export default DashboardHeader;
