import { Box, Typography } from '@mui/material';

interface NoContentBoxAdminProps {
	content: string;
}

const NoContentBoxAdmin = ({ content }: NoContentBoxAdminProps) => {
	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height: '25vh',
				boxShadow: '0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)',
				borderRadius: '0.35rem',
				mt: '1rem',
			}}>
			<Typography variant='body1'>{content}</Typography>
		</Box>
	);
};

export default NoContentBoxAdmin;
