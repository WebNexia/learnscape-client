import { Typography } from '@mui/material';
import { ReactNode } from 'react';
interface ErrorMessageProps {
	children: ReactNode;
}

const CustomErrorMessage = ({ children }: ErrorMessageProps) => {
	return (
		<Typography variant='body2' sx={{ color: 'red', backgroundColor: 'transparent' }}>
			{children}
		</Typography>
	);
};

export default CustomErrorMessage;
