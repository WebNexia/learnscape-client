import React, { useContext } from 'react';
import { Box, FormControl, Select, MenuItem, InputAdornment, Chip, Typography, useTheme } from '@mui/material';
import { Search } from '@mui/icons-material';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import CustomTextField from '../forms/customFields/CustomTextField';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from '../forms/customButtons/CustomDeleteButton';
import theme from '../../themes';

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
	isRecycleBin?: boolean;
	isPayments?: boolean;
	isCommunity?: boolean;
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
	isRecycleBin = false,
	isPayments = false,
	isCommunity = false,
	sx = {},
}) => {
	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;
	const themeUseTheme = useTheme();

	const stickyStyles = isSticky
		? {
				position: 'fixed' as const,
				top: isCommunity
					? isMobileSize
						? '6.5rem'
						: '7rem' // Community specific positioning below sticky title
					: isRecycleBin || isPayments
						? isMobileSize
							? '6.75rem'
							: '7.25rem'
						: isMobileSize
							? '3.5rem'
							: '4rem', // Normal positioning
				left: isMobileSize ? 0 : '10rem', // Account for sidebar width on desktop
				right: 0,
				zIndex: isCommunity
					? 99 // Community z-index below title (100)
					: isRecycleBin || isPayments
						? 99
						: 100, // Normal z-index
				backgroundColor: theme.bgColor?.secondary,
				backdropFilter: 'blur(10px)',
				minHeight: 'auto', // Ensure it doesn't collapse
				paddingTop: isCommunity
					? '0.5rem' // Community specific padding
					: isRecycleBin || isPayments
						? '1rem'
						: undefined,
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
					...(isCommunity && isSticky
						? {
								padding: isMobileSize ? '0.5rem 1rem' : '0.5rem 2rem', // Match Community title padding
							}
						: {}),
					...stickyStyles,
					...sx,
				}}>
				{/* Responsive Layout - Desktop unchanged, Mobile optimized */}
				<Box
					sx={{
						display: 'flex',
						width: '100%',
						flexDirection: isMobileSize ? 'column' : 'row',
						gap: isMobileSize ? 1 : 0,
						alignItems: isMobileSize ? 'flex-start' : 'flex-start',
					}}>
					{/* Filter & Search Section */}
					<Box
						sx={{
							display: 'flex',
							flexDirection: isMobileSize ? 'column' : 'row', // Always row for filter and search
							alignItems: isMobileSize ? 'flex-start' : 'flex-start',
							gap: 1,
							flex: isMobileSize ? 'none' : 1,
							width: isMobileSize ? '100%' : 'auto',
						}}>
						<Box sx={{ display: 'flex', gap: 1.5, width: isMobileSize ? '100%' : 'auto' }}>
							{/* Filter Dropdown */}
							<FormControl sx={{ minWidth: isMobileSize ? '8rem' : '12rem', flex: isMobileSize ? 'none' : 'none' }}>
								<Select
									size='small'
									value={filterValue}
									onChange={(e) => onFilterChange(e.target.value)}
									displayEmpty
									MenuProps={{
										PaperProps: {
											sx: {
												'maxHeight': 300,
												'zIndex': 9999,
												'& .MuiMenuItem-root': {
													fontSize: isMobileSize ? '0.7rem' : '0.85rem',
													textTransform: 'capitalize',
													whiteSpace: 'nowrap',
													overflow: 'hidden',
													textOverflow: 'ellipsis',
												},
											},
										},
									}}
									sx={{
										backgroundColor: themeUseTheme.palette.background.paper,
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

							{/* Search Input */}
							<CustomTextField
								value={searchValue}
								placeholder={searchPlaceholder}
								onChange={(e) => onSearchChange(e.target.value)}
								sx={{
									backgroundColor: '#fff',
									minWidth: isMobileSize ? 'auto' : '17.5rem',
									flex: 1, // Takes remaining space
								}}
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
											<Search sx={{ mr: '-0.5rem' }} fontSize={isMobileSize ? 'small' : 'medium'} />
										</InputAdornment>
									),
									inputProps: {
										maxLength: 50,
									},
								}}
							/>
						</Box>

						{/* Search & Reset Buttons - Desktop only */}
						<Box sx={{ display: 'flex', ml: isMobileSize ? 0 : 2 }}>
							{!isMobileSize && (
								<>
									<CustomSubmitButton
										onClick={onSearch}
										disabled={!searchValue || isSearchLoading}
										sx={{ fontSize: isMobileSize ? '0.7rem' : undefined }}>
										Search
									</CustomSubmitButton>
									<CustomDeleteButton onClick={onReset} sx={{ fontSize: isMobileSize ? '0.7rem' : undefined }}>
										Reset
									</CustomDeleteButton>
								</>
							)}

							{/* Results Count - Desktop only */}
							{!isMobileSize && (
								<Box sx={{ display: 'flex', alignItems: 'center', height: '2rem', ml: 1 }}>
									<Typography
										variant='body2'
										sx={{
											color: 'text.secondary',
											fontSize: isMobileSize ? '0.7rem' : '0.85rem',
											whiteSpace: 'nowrap',
										}}>
										{isSearchActive
											? `${searchResultsTotalItems} ${searchResultsTotalItems === 1 ? 'result' : 'results'}`
											: `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`}
									</Typography>
								</Box>
							)}
						</Box>
					</Box>

					{/* Action Buttons Section - Desktop only */}
					{!isMobileSize && actionButtons && actionButtons.length > 0 && (
						<Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: '0.85rem', alignItems: 'center', width: '100%' }}>
							{actionButtons.map((button, index) => {
								if (button.label.includes('Delete')) {
									return (
										<CustomDeleteButton
											key={index}
											onClick={button.onClick}
											disabled={button.disabled}
											sx={{ fontSize: isMobileSize ? '0.7rem' : undefined, width: 'auto', justifyContent: 'center' }}>
											{button.label}
										</CustomDeleteButton>
									);
								} else {
									return (
										<CustomSubmitButton
											startIcon={button.startIcon}
											key={index}
											onClick={button.onClick}
											disabled={button.disabled}
											sx={{ fontSize: isMobileSize ? '0.7rem' : undefined, width: 'auto', justifyContent: 'center' }}>
											{button.label}
										</CustomSubmitButton>
									);
								}
							})}
						</Box>
					)}
				</Box>

				{/* Mobile-specific rows */}
				{isMobileSize && (
					<Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '0.5rem' }}>
						{/* Mobile: Search/Reset buttons and Results count in one row */}
						<Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', justifyContent: 'flex-start' }}>
							<Box sx={{ display: 'flex', flex: 1 }}>
								<CustomSubmitButton onClick={onSearch} disabled={!searchValue || isSearchLoading} sx={{ flex: 1, fontSize: '0.7rem' }}>
									Search
								</CustomSubmitButton>
								<CustomDeleteButton onClick={onReset} sx={{ flex: 1, fontSize: '0.7rem' }}>
									Reset
								</CustomDeleteButton>
							</Box>
							<Typography
								variant='body2'
								sx={{
									color: 'text.secondary',
									fontSize: '0.7rem',
									whiteSpace: 'nowrap',
									ml: 1,
								}}>
								{isSearchActive
									? `${searchResultsTotalItems} ${searchResultsTotalItems === 1 ? 'result' : 'results'}`
									: `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`}
							</Typography>
						</Box>

						{/* Mobile: Action buttons at bottom */}
						{actionButtons && actionButtons.length > 0 && (
							<Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: isMobileSize ? 0 : 1 }}>
								{actionButtons.map((button, index) => {
									if (button.label.includes('Delete')) {
										return (
											<CustomDeleteButton
												key={index}
												onClick={button.onClick}
												disabled={button.disabled}
												sx={{ fontSize: '0.7rem', width: 'auto', justifyContent: 'center' }}>
												{button.label}
											</CustomDeleteButton>
										);
									} else {
										return (
											<CustomSubmitButton
												startIcon={button.startIcon}
												key={index}
												onClick={button.onClick}
												disabled={button.disabled}
												sx={{
													fontSize: '0.7rem',
													width: 'auto',
													justifyContent: 'center',
												}}>
												{button.label}
											</CustomSubmitButton>
										);
									}
								})}
							</Box>
						)}
					</Box>
				)}

				{((isSearchActive && searchedValue) || (isSearchActive && filterValue && filterValue.trim())) && (
					<Box
						sx={{
							display: 'flex',
							gap: 1,
							flexWrap: 'wrap',
							justifyContent: 'flex-start',
							alignSelf: 'flex-start',
							marginBottom: isRecycleBin || isPayments ? '0.5rem' : '0.25rem',
							marginTop: isMobileSize ? '1rem' : '0.5rem',
							width: '100%',
							zIndex: 100,
						}}>
						{isSearchActive && filterValue && filterValue.trim() && (
							<Chip
								label={`Filter: "${filterValue?.length > 30 ? `${filterValue.substring(0, 20)}...` : filterValue}"`}
								onDelete={onResetFilter}
								variant='outlined'
								color='secondary'
								size='small'
								sx={{
									backgroundColor: '#1976d2',
									color: 'white',
									fontSize: isMobileSize ? '0.7rem' : '0.8rem',
									letterSpacing: '0.025rem',
									height: isMobileSize ? '1.1rem' : '1.25rem',
								}}
							/>
						)}
						{isSearchActive && searchedValue && (
							<Chip
								label={`Search: "${searchedValue?.length > 30 ? `${searchedValue.substring(0, 20)}...` : searchedValue}"`}
								onDelete={onResetSearch}
								color='primary'
								variant='filled'
								size='small'
								sx={{
									backgroundColor: 'coral',
									color: 'white',
									fontSize: isMobileSize ? '0.7rem' : '0.8rem',
									letterSpacing: '0.025rem',
									height: isMobileSize ? '1.1rem' : '1.25rem',
								}}
							/>
						)}
					</Box>
				)}
			</Box>

			{/* Spacer to push content down when filter bar is fixed */}
			{isSticky && (
				<Box
					sx={{
						height: isCommunity
							? isMobileSize
								? (isSearchActive && searchedValue) || (isSearchActive && filterValue && filterValue.trim())
									? '11.5rem' // Community mobile with chips
									: '9rem' // Community mobile without chips
								: (isSearchActive && searchedValue) || (isSearchActive && filterValue && filterValue.trim())
									? '8rem' // Community desktop with chips
									: '6rem' // Community desktop without chips
							: isRecycleBin || isPayments
								? isMobileSize
									? (isSearchActive && searchedValue) || (isSearchActive && filterValue && filterValue.trim())
										? '10.5rem' // RecycleBin/Payments mobile with chips
										: '8.25rem' // RecycleBin/Payments mobile without chips
									: (isSearchActive && searchedValue) || (isSearchActive && filterValue && filterValue.trim())
										? '7.5rem' // RecycleBin/Payments desktop with chips
										: '5rem' // RecycleBin/Payments desktop without chips
								: isMobileSize
									? (isSearchActive && searchedValue) || (isSearchActive && filterValue && filterValue.trim())
										? '11rem' // Mobile compact height with chips
										: '9rem' // Mobile compact height without chips
									: (isSearchActive && searchedValue) || (isSearchActive && filterValue && filterValue.trim())
										? '8.5rem'
										: '6rem', // Desktop height unchanged
						width: '100%',
					}}
				/>
			)}
		</>
	);
};

export default FilterSearchRow;
