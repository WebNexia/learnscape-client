import { InfoOutlined } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';

interface infoMessageProps {
	message: string;
	sx?: React.CSSProperties;
	messageSx?: object;
}

const CustomInfoMessageAlignedLeft = ({ message, sx, messageSx }: infoMessageProps) => {
	return (
		<Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', mb: '0.5rem', ...sx }}>
			<Box>
				<InfoOutlined fontSize='small' color='error' />
			</Box>
			<Box>
				<Typography sx={{ fontSize: '0.8rem', ml: '0.5rem', ...messageSx }}>{message}</Typography>
			</Box>
		</Box>
	);
};

export default CustomInfoMessageAlignedLeft;
