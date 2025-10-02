import { Stack, Pagination } from '@mui/material';
import { useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface CustomPaginationProps {
	count: number;
	page: number;
	onChange: (value: number) => void;
}

const CustomTablePagination = ({ count, page, onChange }: CustomPaginationProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const handleChange = (event: React.ChangeEvent<unknown>, value: number) => {
		event.preventDefault();
		event.stopPropagation();
		onChange(value);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	return (
		<Stack spacing={3}>
			<Pagination
				showFirstButton
				showLastButton
				count={count}
				page={page}
				onChange={handleChange}
				sx={{
					'& .MuiPaginationItem-root': {
						fontSize: isMobileSize ? '0.7rem' : '0.85rem',
						mt: isMobileSize ? '0.5rem' : '1rem',
					},
					'& .MuiPaginationItem-icon': {
						fontSize: isMobileSize ? '1rem' : '1.25rem', // Adjust icon size
					},
				}}
			/>
		</Stack>
	);
};

export default CustomTablePagination;
