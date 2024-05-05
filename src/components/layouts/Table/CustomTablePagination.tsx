import { Stack, Pagination } from '@mui/material';

interface CustomPaginationProps {
	count: number;
	page: number;
	onChange: (value: number) => void;
}

const CustomTablePagination = ({ count, page, onChange }: CustomPaginationProps) => {
	const handleChange = (event: React.ChangeEvent<unknown>, value: number) => {
		event.preventDefault();
		event.stopPropagation();
		onChange(value);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	return (
		<Stack spacing={3}>
			<Pagination showFirstButton showLastButton count={count} page={page} onChange={handleChange} />
		</Stack>
	);
};

export default CustomTablePagination;
