import React, { useContext } from 'react';
import { Box, FormControl, Select, MenuItem, InputAdornment, Chip, Typography, useTheme } from '@mui/material';
import { Search } from '@mui/icons-material';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import CustomTextField from '../forms/customFields/CustomTextField';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from '../forms/customButtons/CustomDeleteButton';

interface FilterOption {
	value: string;
	label: string;
}

interface ActionButton {
	label: string;
	onClick: () => void;
	startIcon?: React.ReactNode;
	disabled?: boolean;
}

interface FilterSearchRowProps {
	// Filter functionality
	filterValue: string;
	onFilterChange: (value: string) => void;
	filterOptions: FilterOption[];
	filterPlaceholder: string;

	// Search functionality
	searchValue: string;
	onSearchChange: (value: string) => void;
	onSearch: () => void;
	onReset: () => void;
	searchPlaceholder: string;
	isSearchLoading?: boolean;
	isSearchActive: boolean;
	searchResultsTotalItems: number;
	totalItems: number;

	// Chips functionality
	searchedValue: string;
	onResetSearch: () => void;
	onResetFilter: () => void;

	// Action buttons (optional)
	actionButtons?: ActionButton[];

	// Sticky functionality
	isSticky?: boolean;
	sx?: object;
}

const FilterSearchRow: React.FC<FilterSearchRowProps> = ({
	filterValue,
	onFilterChange,
	filterOptions,
	filterPlaceholder,
	searchValue,
	onSearchChange,
	onSearch,
	onReset,
	searchPlaceholder,
	isSearchLoading = false,
	isSearchActive,
	searchResultsTotalItems,
	totalItems,
	searchedValue,
	onResetSearch,
	onResetFilter,
	actionButtons = [],
	isSticky = false,
	sx = {},
}) => {
	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;
	const theme = useTheme();

	const stickyStyles = isSticky
		? {
				position: 'fixed' as const,
				top: '4rem', // Account for DashboardHeader height
				left: isMobileSize ? 0 : '10rem', // Account for sidebar width on desktop
				right: 0,
				zIndex: 100, // Higher z-index to ensure it's above all content
				backgroundColor: 'rgba(255, 255, 255, 0.85)', // Semi-transparent white for glassmorphism effect
				backdropFilter: 'blur(10px)',
				// borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
				// boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', // Add shadow for better visual separation
				minHeight: 'auto', // Ensure it doesn't collapse
			}
		: {};

	return (
		<>
			{/* Main Filter/Search Row - EXACTLY like AdminLessons structure */}
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-between',
					padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '1rem 2rem 0rem 2rem',
					width: isSmallScreen || isRotatedMedium ? '100%' : 'calc(100% - 10rem)',
					mb: isSticky ? 0 : '1.25rem',
					bgcolor: 'pink',
					...stickyStyles,
					...sx,
				}}>
				<Box sx={{ display: 'flex', width: '100%' }}>
					{/* Left Side - Filter, Search, Results - EXACTLY like AdminLessons */}
					<Box sx={{ display: 'flex', alignSelf: 'flex-start', width: isVerySmallScreen ? '12.5rem' : 'fit-content' }}>
						{/* Filter Dropdown */}
						<Box sx={{ mr: '1rem' }}>
							<FormControl>
								<Select
									size='small'
									value={filterValue}
									onChange={(e) => onFilterChange(e.target.value)}
									displayEmpty
									sx={{
										backgroundColor: theme.palette.background.paper,
										width: isMobileSizeSmall ? '8rem' : '12rem',
										fontSize: isMobileSize ? '0.7rem' : '0.85rem',
										textTransform: 'capitalize',
									}}>
									<MenuItem disabled value='filter' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.85rem', textTransform: 'capitalize' }}>
										{filterPlaceholder}
									</MenuItem>
									{filterOptions.map((option) => (
										<MenuItem
											key={option.value}
											value={option.value}
											sx={{ fontSize: isMobileSize ? '0.7rem' : '0.85rem', textTransform: 'capitalize' }}>
											{option.label}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Box>

						{/* Search Input */}
						<CustomTextField
							value={searchValue}
							placeholder={searchPlaceholder}
							onChange={(e) => onSearchChange(e.target.value)}
							sx={{ backgroundColor: '#fff', minWidth: isVerySmallScreen ? '10rem' : '17.5rem' }}
							required={false}
							InputProps={{
								onKeyDown: (e: React.KeyboardEvent) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										if (searchValue.trim() && !isSearchLoading) {
											onSearch();
										}
									}
								},
								endAdornment: (
									<InputAdornment position='end'>
										<Search
											sx={{
												mr: '-0.5rem',
											}}
											fontSize={isMobileSize ? 'small' : 'medium'}
										/>
									</InputAdornment>
								),
							}}
						/>

						{/* Search Button */}
						<CustomSubmitButton onClick={onSearch} sx={{ marginLeft: '1rem' }} disabled={!searchValue || isSearchLoading}>
							Search
						</CustomSubmitButton>

						{/* Reset Button */}
						<CustomDeleteButton onClick={onReset}>Reset</CustomDeleteButton>

						{/* Results Count */}
						<Box sx={{ ml: '1rem', display: 'flex', alignItems: 'center', height: '2rem' }}>
							{isSearchActive ? (
								<Typography
									variant='body2'
									sx={{
										color: 'text.secondary',
										fontSize: isMobileSize ? '0.7rem' : '0.85rem',
										whiteSpace: 'nowrap',
									}}>
									{searchResultsTotalItems} {searchResultsTotalItems === 1 ? 'result' : 'results'}
								</Typography>
							) : (
								<Typography
									variant='body2'
									sx={{
										color: 'text.secondary',
										fontSize: isMobileSize ? '0.7rem' : '0.85rem',
										whiteSpace: 'nowrap',
									}}>
									{totalItems} {totalItems === 1 ? 'item' : 'items'}
								</Typography>
							)}
						</Box>
					</Box>

					{/* Right Side - Action Buttons - EXACTLY like AdminLessons */}
					{actionButtons && actionButtons.length > 0 && (
						<Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: '0.85rem', alignItems: 'center', width: '100%' }}>
							{actionButtons.map((button, index) => (
								<CustomSubmitButton
									startIcon={button.startIcon}
									key={index}
									onClick={button.onClick}
									sx={{
										fontSize: isMobileSize ? '0.7rem' : undefined,
									}}>
									{button.label}
								</CustomSubmitButton>
							))}
						</Box>
					)}
				</Box>

				{((isSearchActive && searchedValue) || (isSearchActive && filterValue && filterValue.trim())) && (
					<Box
						sx={{
							display: 'flex',
							gap: 1,
							flexWrap: 'wrap',
							justifyContent: 'flex-start',
							alignSelf: 'flex-start',
							marginBottom: '1rem',
							marginTop: '0.5rem',
							width: '100%',
							zIndex: 100,
						}}>
						{isSearchActive && filterValue && filterValue.trim() && (
							<Chip
								label={`Filter: "${filterValue}"`}
								onDelete={onResetFilter}
								variant='outlined'
								color='secondary'
								size='small'
								sx={{ backgroundColor: '#1976d2', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
							/>
						)}
						{isSearchActive && searchedValue && (
							<Chip
								label={`Search: "${searchedValue}"`}
								onDelete={onResetSearch}
								color='primary'
								variant='filled'
								size='small'
								sx={{ backgroundColor: '#1EC28B', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
							/>
						)}
					</Box>
				)}
			</Box>

			{/* Spacer to push content down when filter bar is fixed */}
			{isSticky && (
				<Box
					sx={{
						height: (isSearchActive && searchedValue) || (isSearchActive && filterValue && filterValue.trim()) ? '8rem' : '6rem', // If chips exist, need more height (8rem), otherwise less (6rem)
						width: '100%',
					}}
				/>
			)}
		</>
	);
};

export default FilterSearchRow;
