import { Typography } from '@mui/material';
import { ReactNode } from 'react';
interface ErrorMessageProps {
	children: ReactNode;
	sx?: object;
}

const CustomErrorMessage = ({ children, sx }: ErrorMessageProps) => {
	return (
		<Typography variant='body2' sx={{ color: 'red', backgroundColor: 'transparent', ...sx }}>
			{children}
		</Typography>
	);
};

export default CustomErrorMessage;
