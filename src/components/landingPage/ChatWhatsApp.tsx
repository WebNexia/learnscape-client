import { WhatsApp } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import theme from '../../themes';

const ChatWhatsApp = () => {
	return (
		<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
			<Box
				component='a'
				href={`https://wa.me/447498163458?text=${encodeURIComponent('Feel free to ask us anything about our courses!')}`}
				target='_blank'
				rel='noopener noreferrer'
				sx={{
					display: 'flex',
					alignItems: 'center',
					height: '4rem',
					border: `solid ${theme.textColor?.primary.main} 0.1rem`,
					margin: '2rem 0',
					padding: '2.5rem 2rem',
					borderRadius: '5rem',
					transition: '0.4s',
					backgroundColor: 'transparent',
					color: theme.textColor?.primary.main, // Ensures default text color
					':hover': {
						backgroundColor: '#4D7B8B',
						color: '#fff', // Ensures text changes to white
					},
				}}>
				<Typography sx={{ transition: '0.4s', color: 'inherit' }}>Chat with Us on WhatsApp</Typography>
				<WhatsApp sx={{ ml: '0.75rem', transition: '0.4s', color: theme.textColor?.greenSecondary.main }} /> {/* Inherit icon color */}
			</Box>
		</Box>
	);
};

export default ChatWhatsApp;
