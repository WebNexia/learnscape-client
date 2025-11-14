import { MarkunreadOutlined } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { useContext, useEffect, useState, useMemo, memo } from 'react';
import theme from '../../../themes';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

const UnreadMessages = memo(() => {
	const { user } = useContext(UserAuthContext);
	const { isRotated, isSmallScreen } = useContext(MediaQueryContext);

	// Memoize expensive computations
	const isMobileSize = useMemo(() => isSmallScreen || isRotated, [isSmallScreen, isRotated]);
	const [unreadCount, setUnreadCount] = useState<number>(0);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	// Memoize the user ID to prevent unnecessary re-renders
	const userFirebaseId = useMemo(() => user?.firebaseUserId, [user?.firebaseUserId]);

	// Optimized real-time listener - only listens to chats where user is a participant
	useEffect(() => {
		if (!userFirebaseId) {
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		setError(null);

		const chatsRef = collection(db, 'chats');
		// Query chats where user is a participant (security rule compliant)
		const q = query(chatsRef, where('participants', 'array-contains', userFirebaseId));

		// Real-time listener — no polling needed
		const unsubscribe = onSnapshot(
			q,
			(snapshot) => {
				// Count chats that have unreadBy array containing the user
				let unreadCount = 0;
				snapshot.forEach((doc) => {
					const data = doc.data();
					if (data.unreadBy && data.unreadBy.includes(userFirebaseId)) {
						unreadCount++;
					}
				});
				setUnreadCount(unreadCount);
				setIsLoading(false);
			},
			(error) => {
				console.error('Error listening to unread messages:', error);
				setError('Failed to load unread messages');
				setIsLoading(false);
			}
		);

		return () => unsubscribe(); // cleanup
	}, [userFirebaseId]);

	// Memoize the message text to prevent unnecessary re-renders
	const messageText = useMemo(() => {
		if (isLoading) return 'Loading...';
		if (error) return 'Error loading messages';
		return unreadCount ? `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'You have no unread messages';
	}, [isLoading, error, unreadCount]);

	// Memoize the message color
	const messageColor = useMemo(() => {
		if (isLoading) return 'gray';
		if (error) return '#ef5350';
		return unreadCount ? '#ef5350' : 'gray';
	}, [isLoading, error, unreadCount]);

	return (
		<Box
			sx={{
				'display': 'flex',
				'flexDirection': 'column',
				'alignItems': 'center',
				'boxShadow': '0.1rem 0.3rem 0.3rem 0.3rem rgba(0,0,0,0.2)',
				'padding': '1rem',
				'borderRadius': '0.35rem',
				'height': '12rem',
				'cursor': 'pointer',
				'transition': '0.3s',
				':hover': {
					boxShadow: '0rem 0.1rem 0.2rem 0.1rem rgba(0,0,0,0.3)',
				},
			}}>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : null }}>
					Unread Messages
				</Typography>
				<MarkunreadOutlined sx={{ ml: '0.5rem', color: theme.textColor?.greenPrimary.main }} fontSize={isMobileSize ? 'small' : 'medium'} />
			</Box>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '7rem' }}>
				<Typography sx={{ fontSize: isMobileSize ? '0.65rem' : '0.85rem', color: messageColor, textAlign: 'center' }}>{messageText}</Typography>
			</Box>
		</Box>
	);
});

export default UnreadMessages;
