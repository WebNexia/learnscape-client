import React, { useState, useEffect } from 'react';
import {
	Box,
	TextField,
	Button,
	Chip,
	Grid,
	Typography,
	InputAdornment,
	IconButton,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Paper,
} from '@mui/material';
import { Search, Clear, FilterList, InfoOutlined } from '@mui/icons-material';
import theme from '../../themes';
import LandingPageCoursesInfoDialog from './LandingPageCoursesInfoDialog';

interface FilterOption {
	value: string;
	label: string;
}

interface SearchFilterProps {
	searchValue: string;
	onSearchChange: (value: string) => void;
	onSearch: (searchTerm?: string) => void;
	onReset: () => void;
	activeFilter: string;
	onFilterChange: (filter: string) => void;
	filterOptions: FilterOption[];
	loading?: boolean;
	placeholder?: string;
	searchLabel?: string;
	searchedValue?: string; // Add searched value to show as chip
	onRemoveSearch?: () => void; // Add callback to remove search
	totalCount?: number; // Total number of items
	hasActiveSearchOrFilter?: boolean; // Whether there's an active search or filter
	isCoursesPage?: boolean;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
	searchValue,
	onSearchChange,
	onSearch,
	onReset,
	activeFilter,
	onFilterChange,
	filterOptions,
	loading = false,
	placeholder = 'Search...',
	searchLabel = 'Search',
	searchedValue = '',
	onRemoveSearch,
	totalCount = 0,
	hasActiveSearchOrFilter = false,
	isCoursesPage,
}) => {
	const [localSearchValue, setLocalSearchValue] = useState(searchValue);
	const [isInfoDialogOpen, setIsInfoDialogOpen] = useState<boolean>(false);

	useEffect(() => {
		setLocalSearchValue(searchValue);
	}, [searchValue]);

	const handleSearch = () => {
		onSearchChange(localSearchValue);
		// Only trigger search if the local search value is different from the current searched value
		// or if there's no current search active
		if (localSearchValue.trim() !== searchedValue || !searchedValue) {
			onSearch(localSearchValue); // Pass the search term directly
		}
		// Don't clear the search input - keep it like admin pages
	};

	const handleReset = () => {
		setLocalSearchValue('');
		onSearchChange('');
		onFilterChange('');
		onReset();
	};

	const handleKeyPress = (event: React.KeyboardEvent) => {
		if (event.key === 'Enter') {
			handleSearch();
		}
	};

	const handleFilterChange = (filterValue: string) => {
		onFilterChange(filterValue);
	};

	const handleRemoveSearch = () => {
		if (onRemoveSearch) {
			onRemoveSearch();
		} else {
			// Fallback: clear search and trigger new search
			setLocalSearchValue('');
			onSearchChange('');
			onSearch();
		}
	};

	return (
		<Paper
			elevation={0}
			sx={{
				'p': 1.75,
				'mb': 2,
				'borderRadius': '1rem',
				'backgroundColor': 'rgba(255, 255, 255, 0.9)',
				'backdropFilter': 'blur(20px)',
				'border': '2px solid rgba(91, 141, 239, 0.15)',
				'boxShadow': '0 4px 20px rgba(91, 141, 239, 0.1)',
				'transition': 'all 0.3s ease',
				'&:hover': {
					boxShadow: '0 6px 25px rgba(91, 141, 239, 0.15)',
					borderColor: 'rgba(91, 141, 239, 0.25)',
				},
			}}>
			<Grid container spacing={2} alignItems='center'>
				{/* Search Input */}
				<Grid item xs={12} md={5}>
					<TextField
						fullWidth
						value={localSearchValue}
						onChange={(e) => setLocalSearchValue(e.target.value)}
						onKeyPress={handleKeyPress}
						placeholder={placeholder}
						label={searchLabel}
						variant='outlined'
						size='small'
						InputProps={{
							startAdornment: (
								<InputAdornment position='start'>
									<Search sx={{ color: '#5B8DEF' }} fontSize='small' />
								</InputAdornment>
							),
							endAdornment: localSearchValue && (
								<InputAdornment position='end'>
									<IconButton size='small' onClick={() => setLocalSearchValue('')} edge='end' sx={{ color: '#5B8DEF' }}>
										<Clear />
									</IconButton>
								</InputAdornment>
							),
							inputProps: {
								fontSize: '0.5rem',
							},
						}}
						sx={{
							'& .MuiOutlinedInput-root': {
								'fontFamily': 'Varela Round',
								'backgroundColor': 'rgba(250, 251, 252, 0.8)',
								'&:hover .MuiOutlinedInput-notchedOutline': {
									borderColor: '#5B8DEF',
								},
								'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
									borderColor: '#5B8DEF',
									borderWidth: '2px',
								},
							},
							'& .MuiInputLabel-root': {
								fontFamily: 'Varela Round',
							},
							'& .MuiInputBase-input::placeholder': {
								fontSize: '0.85rem',
								fontFamily: 'Varela Round',
							},

							'& input': {
								fontSize: '0.8rem',
								height: '1.15rem',
							},
						}}
					/>
				</Grid>

				{/* Filter Dropdown */}
				<Grid item xs={12} md={3}>
					<FormControl fullWidth size='small'>
						<InputLabel
							sx={{
								'fontFamily': 'Varela Round',
								'fontSize': '0.8rem',
								'&.Mui-focused': {
									fontSize: '0.8rem',
								},
								'&.MuiFormLabel-filled': {
									fontSize: '0.8rem',
								},
							}}>
							Filtre
						</InputLabel>
						<Select
							value={activeFilter}
							onChange={(e) => handleFilterChange(e.target.value as string)}
							label='Filtre'
							sx={{
								'fontFamily': 'Varela Round',
								'& .MuiSelect-select': {
									fontFamily: 'Varela Round',
								},
								'fontSize': '0.85rem',
							}}>
							<MenuItem value='' sx={{ fontFamily: 'Varela Round', fontSize: '0.85rem' }}>
								<em>Tümü</em>
							</MenuItem>
							{filterOptions.map((option) => (
								<MenuItem key={option.value} value={option.value} sx={{ fontFamily: 'Varela Round', fontSize: '0.85rem' }}>
									{option.label}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Grid>

				{/* Action Buttons */}
				<Grid item xs={12} md={4}>
					<Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'center', md: 'flex-end' } }}>
						<Button
							variant='contained'
							onClick={handleSearch}
							disabled={loading}
							startIcon={<Search fontSize='small' />}
							sx={{
								'fontFamily': 'Varela Round',
								'fontWeight': 500,
								'background': 'linear-gradient(135deg, #FF6B3D 0%, #ff7d55 100%)',
								'color': '#FFFFFF',
								'boxShadow': '0 4px 15px rgba(249, 115, 22, 0.35)',
								'&:hover': {
									transform: 'translateY(-2px)',
								},
								'&.Mui-disabled': {
									background: 'rgba(249, 115, 22, 0.3)',
									color: 'rgba(255, 255, 255, 0.6)',
								},
								'textTransform': 'capitalize',
								'fontSize': '0.8rem',
								'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
								'borderRadius': '0.75rem',
							}}>
							Ara
						</Button>
						<Button
							variant='outlined'
							onClick={handleReset}
							disabled={loading}
							startIcon={<Clear fontSize='small' />}
							sx={{
								'fontFamily': 'Varela Round',
								'fontWeight': 500,
								'borderColor': '#FF6F4E',
								'color': '#FF6F4E',
								'borderWidth': '2px',
								'background': 'rgba(249, 115, 22, 0.08)',
								'&:hover': {
									borderColor: '#ea580c',
									color: '#ea580c',
									backgroundColor: 'rgba(249, 115, 22, 0.15)',
									transform: 'translateY(-2px)',
								},
								'&.Mui-disabled': {
									borderColor: 'rgba(249, 115, 22, 0.3)',
									color: 'rgba(249, 115, 22, 0.3)',
								},
								'textTransform': 'capitalize',
								'fontSize': '0.8rem',
								'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
								'borderRadius': '0.75rem',
							}}>
							Sıfırla
						</Button>
						{/* Course Count Display */}

						<Typography
							variant='body2'
							sx={{
								fontFamily: 'Varela Round',
								color: 'text.secondary',
								fontSize: '0.875rem',
								ml: 2,
								display: 'flex',
								alignItems: 'center',
							}}>
							{hasActiveSearchOrFilter ? `${totalCount} sonuç bulundu` : `Toplam ${totalCount} ${isCoursesPage ? 'kurs' : 'kaynak'}`}
						</Typography>

						{isCoursesPage && (
							<IconButton
								size='small'
								sx={{ 'ml': { xs: '0.5rem', sm: '0.75rem' }, '& svg': { fontSize: { xs: '1.1rem', sm: '1.25rem' } } }}
								onClick={() => setIsInfoDialogOpen(true)}>
								<InfoOutlined />
							</IconButton>
						)}
					</Box>
				</Grid>
			</Grid>

			{/* Active Search and Filter Display */}
			{(searchedValue || activeFilter) && (
				<Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 2 }}>
					<Typography
						variant='body2'
						sx={{
							fontFamily: 'Varela Round',
							color: 'text.secondary',
							display: 'flex',
							alignItems: 'center',
							gap: 0.5,
						}}>
						<FilterList fontSize='small' />
						Aktif:
					</Typography>
					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
						{searchedValue && (
							<Chip
								label={`Arama: "${searchedValue}"`}
								onDelete={handleRemoveSearch}
								color='primary'
								variant='outlined'
								size='small'
								sx={{
									fontFamily: 'Varela Round',
									fontSize: '0.75rem',
								}}
							/>
						)}
						{activeFilter && (
							<Chip
								label={`Filtre: ${filterOptions.find((opt) => opt.value === activeFilter)?.label || activeFilter}`}
								onDelete={() => handleFilterChange('')}
								color='primary'
								variant='outlined'
								size='small'
								sx={{
									fontFamily: 'Varela Round',
									fontSize: '0.75rem',
								}}
							/>
						)}
					</Box>
				</Box>
			)}
			<LandingPageCoursesInfoDialog isInfoDialogOpen={isInfoDialogOpen} setIsInfoDialogOpen={setIsInfoDialogOpen} />
		</Paper>
	);
};

export default SearchFilter;
