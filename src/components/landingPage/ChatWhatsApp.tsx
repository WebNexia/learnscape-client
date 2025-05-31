import { Box, IconButton, Tooltip } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

const ChatWhatsApp = () => {
	return (
		<Box
			sx={{
				position: 'fixed',
				bottom: '2rem',
				right: '2rem',
				zIndex: 1000,
			}}>
			<Tooltip
				title="WhatsApp'tan Bize Ulaşın"
				placement='left'
				componentsProps={{
					tooltip: {
						sx: {
							fontFamily: 'Varela Round',
							fontSize: '0.85rem',
						},
					},
				}}>
				<IconButton
					href='https://wa.me/905555555555'
					target='_blank'
					rel='noopener noreferrer'
					sx={{
						'backgroundColor': '#25D366',
						'color': '#fff',
						'width': '60px',
						'height': '60px',
						'boxShadow': '0 4px 20px rgba(0,0,0,0.2)',
						'&:hover': {
							backgroundColor: '#128C7E',
							transform: 'scale(1.1)',
							boxShadow: '0 6px 25px rgba(0,0,0,0.3)',
						},
						'transition': 'all 0.3s ease',
						'&::before': {
							content: '""',
							position: 'absolute',
							top: '-5px',
							left: '-5px',
							right: '-5px',
							bottom: '-5px',
							borderRadius: '50%',
							background: 'rgba(37, 211, 102, 0.2)',
							animation: 'pulse 2s infinite',
							zIndex: -1,
						},
						'@keyframes pulse': {
							'0%': {
								transform: 'scale(1)',
								opacity: 1,
							},
							'100%': {
								transform: 'scale(1.5)',
								opacity: 0,
							},
						},
					}}>
					<WhatsAppIcon sx={{ fontSize: 35 }} />
				</IconButton>
			</Tooltip>
		</Box>
	);
};

export default ChatWhatsApp;
