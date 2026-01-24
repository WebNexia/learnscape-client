import { Box, Typography } from '@mui/material';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { useContext } from 'react';

interface NoContentBoxAdminProps {
	content: string;
}

const NoContentBoxAdmin = ({ content }: NoContentBoxAdminProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height: '10rem',
				boxShadow: '0.1rem 0 1rem 0.1rem rgba(0, 0, 0, 0.2)',
				borderRadius: '0.5rem',
				margin: '1rem 0',
			}}>
			<Typography variant='body1' sx={{ fontSize: isMobileSize ? '0.8rem' : '0.9rem' }}>
				{content}
			</Typography>
		</Box>
	);
};

export default NoContentBoxAdmin;
