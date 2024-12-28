import { InfoOutlined } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface infoMessageProps {
	message: string;
	sx?: React.CSSProperties;
	messageSx?: object;
}

const CustomInfoMessageAlignedLeft = ({ message, sx, messageSx }: infoMessageProps) => {
	const { isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSizeSmall = isVerySmallScreen || isRotated;
	return (
		<Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', mb: '0.5rem', ...sx }}>
			<Box>
				<InfoOutlined fontSize='small' color='error' sx={{ fontSize: isMobileSizeSmall ? '0.8rem' : undefined }} />
			</Box>
			<Box>
				<Typography sx={{ fontSize: isMobileSizeSmall ? '0.6rem' : '0.8rem', ml: '0.5rem', ...messageSx }}>{message}</Typography>
			</Box>
		</Box>
	);
};

export default CustomInfoMessageAlignedLeft;
