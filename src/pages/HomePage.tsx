import { Box, Typography } from '@mui/material';
import Header from '../components/header/Header';

const HomePage = () => {
	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'flex-start',
				backgroundColor: '#FDF7F0',
				height: '100vh',
				position: 'relative',
			}}>
			<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
				<Header />
				<Box
					sx={{
						position: 'relative',
						width: '100vw',
						height: '87vh',
						overflow: 'hidden',
						marginTop: '13vh',
					}}>
					<Box
						sx={{
							position: 'absolute',
							width: '100%',
							height: '100%',
							backgroundImage:
								'url(https://plus.unsplash.com/premium_photo-1661964203376-9aeba8cdbd23?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8VUt8ZW58MHx8MHx8fDA%3D)',
							backgroundSize: 'cover',
							backgroundPosition: 'center',
							opacity: 0.6,
							zIndex: 1,
						}}
					/>

					<Box
						sx={{
							position: 'absolute',
							width: '100%',
							height: '100%',
							backgroundColor: 'rgba(0, 0, 0, 0.3)',
							zIndex: 2,
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
						}}>
						<Typography
							variant='h1'
							sx={{
								color: '#fff',
								fontSize: '5rem',
								zIndex: 3,
								textAlign: 'center',
							}}>
							Coming Soon!!
						</Typography>
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default HomePage;
