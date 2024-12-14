import { InfoOutlined } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { useContext } from 'react';

interface infoMessageProps {
	message: string;
	sx?: React.CSSProperties;
	messageSx?: object;
}

const CustomInfoMessageAlignedRight = ({ message, sx, messageSx }: infoMessageProps) => {
	const { isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSizeSmall = isVerySmallScreen || isRotated;
	return (
		<Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', ...sx }}>
			<Box>
				<Typography sx={{ fontSize: isMobileSizeSmall ? '0.65rem' : '0.8rem', margin: '0 0.5rem 0.15rem 0', ...messageSx }}>{message}</Typography>
			</Box>
			<Box>
				<InfoOutlined fontSize='small' color='error' />
			</Box>
		</Box>
	);
};

export default CustomInfoMessageAlignedRight;
