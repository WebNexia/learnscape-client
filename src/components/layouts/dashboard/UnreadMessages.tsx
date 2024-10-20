import { MarkunreadOutlined } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import theme from '../../../themes';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';

const UnreadMessages = () => {
	const { user } = useContext(UserAuthContext);
	const [hasUnreadMessages, setHasUnreadMessages] = useState<boolean>(false);

	useEffect(() => {
		// If no user is authenticated, return early
		if (!user?.firebaseUserId) return;

		// Function to fetch unread messages
		const fetchUnreadMessages = async () => {
			const chatsRef = collection(db, 'chats');
			const q = query(chatsRef, where('participants', 'array-contains', user?.firebaseUserId));

			// Get all chat documents where the user is a participant
			const querySnapshot = await getDocs(q);

			let hasUnread = false;

			// Loop through chats to see if any hasUnreadMessages is true
			querySnapshot.forEach((doc) => {
				const data = doc.data();
				if (data.hasUnreadMessages) {
					hasUnread = true; // As soon as we find unread messages, we can set the flag
				}
			});

			// Set the state to true if there are any unread messages
			setHasUnreadMessages(hasUnread);
		};

		// Fetch unread messages on mount
		fetchUnreadMessages();

		// Set an interval to fetch unread messages every 5 minutes
		const intervalId = setInterval(fetchUnreadMessages, 600000);

		// Clear the interval when the component unmounts
		return () => clearInterval(intervalId);
	}, [user?.firebaseUserId]);

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				boxShadow: '0.1rem 0.3rem 0.3rem 0.3rem rgba(0,0,0,0.2)',
				padding: '1rem',
				borderRadius: '0.35rem',
				height: '12rem',
				cursor: 'pointer',
				transition: '0.3s',
				':hover': {
					boxShadow: '0rem 0.1rem 0.2rem 0.1rem rgba(0,0,0,0.3)',
				},
			}}>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<Typography variant='h5'>Unread Messages</Typography>
				<MarkunreadOutlined sx={{ ml: '0.5rem', color: theme.textColor?.greenPrimary.main }} />
			</Box>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '7rem' }}>
				<Typography sx={{ fontSize: '0.85rem' }}>{hasUnreadMessages ? 'You have unread messages' : 'You have no unread messages'}</Typography>
			</Box>
		</Box>
	);
};

export default UnreadMessages;
