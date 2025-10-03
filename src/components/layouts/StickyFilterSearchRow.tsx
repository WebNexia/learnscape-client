import { Box, FormControl, InputAdornment, MenuItem, Select, Typography, Chip } from '@mui/material';
import { Search } from '@mui/icons-material';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import CustomTextField from '../forms/customFields/CustomTextField';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from '../forms/customButtons/CustomDeleteButton';
import theme from '../../themes';

interface StickyFilterSearchRowProps {
	filterValue: string;
	setFilterValue: (value: string) => void;
	searchValue: string;
	setSearchValue: (value: string) => void;
	onSearch: () => void;
	onReset: () => void;
	filterOptions: string[];
	searchPlaceholder: string;
	isSearchActive: boolean;
	searchResultsTotalItems: number;
	totalItems: number;
	searchedValue: string;
	searchButtonClicked: boolean;
	onResetFilter: () => void;
	onResetSearch: () => void;
	isSearchLoading?: boolean;
}

const StickyFilterSearchRow = ({
	filterValue,
	setFilterValue,
	searchValue,
	setSearchValue,
	onSearch,
	onReset,
	filterOptions,
	searchPlaceholder,
	isSearchActive,
	searchResultsTotalItems,
	totalItems,
	searchedValue,
	searchButtonClicked,
	onResetFilter,
	onResetSearch,
	isSearchLoading = false,
}: StickyFilterSearchRowProps) => {
	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	return (
		<>
			{/* Sticky Filter/Search Row */}
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: isMobileSize ? 'center' : 'space-between',
					padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '0rem 2rem 0rem 2rem',
					width: '100%',
					position: 'sticky',
					top: 0,
					zIndex: 99,
					backgroundColor: theme.bgColor?.secondary,
					backdropFilter: 'blur(10px)',
				}}>
				<Box sx={{ display: 'flex', width: '100%', flexDirection: 'column' }}>
					<Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
						<Box sx={{ display: 'flex', flexDirection: isMobileSize ? 'column' : 'row', width: isVerySmallScreen ? '100%' : 'fit-content' }}>
							<Box sx={{ display: 'flex', width: '100%' }}>
								<Box sx={{ mr: '1rem' }}>
									<FormControl>
										<Select
											size='small'
											value={filterValue}
											onChange={(e) => setFilterValue(e.target.value)}
											displayEmpty
											sx={{
												backgroundColor: theme.bgColor?.common,
												width: isMobileSizeSmall ? '7rem' : '12rem',
												fontSize: isMobileSize ? '0.7rem' : '0.85rem',
												textTransform: 'capitalize',
											}}>
											<MenuItem
												disabled
												value='filter'
												selected
												sx={{
													fontSize: isMobileSize ? '0.65rem' : '0.85rem',
													fontStyle: 'italic',
													textTransform: 'capitalize',
													padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
													minHeight: '2rem',
												}}>
												Filter
											</MenuItem>
											<MenuItem
												value=''
												selected
												sx={{
													fontSize: isMobileSize ? '0.65rem' : '0.85rem',
													textTransform: 'capitalize',
													padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
													minHeight: '2rem',
												}}>
												All
											</MenuItem>
											{filterOptions?.map((option) => (
												<MenuItem
													value={option.toLowerCase()}
													key={option}
													sx={{
														fontSize: isMobileSize ? '0.65rem' : '0.85rem',
														textTransform: 'capitalize',
														padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
														minHeight: '2rem',
													}}>
													{option}
												</MenuItem>
											))}
										</Select>
									</FormControl>
								</Box>
								<CustomTextField
									value={searchValue}
									placeholder={searchPlaceholder}
									onChange={(e) => {
										setSearchValue(e.target.value);
									}}
									sx={{ backgroundColor: '#fff', minWidth: isVerySmallScreen ? '10rem' : '17.5rem' }}
									required={false}
									InputProps={{
										onKeyDown: (e) => {
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
							</Box>
							<Box sx={{ display: 'flex', alignItems: 'center', height: '2rem' }}>
								<CustomSubmitButton onClick={onSearch} sx={{ marginLeft: isMobileSize ? '0' : '1rem' }} disabled={!searchValue || isSearchLoading}>
									Search
								</CustomSubmitButton>
								<CustomDeleteButton onClick={onReset}>Reset</CustomDeleteButton>
								{isSearchActive ? (
									<Typography
										variant='body2'
										sx={{
											color: 'text.secondary',
											fontSize: isMobileSize ? '0.7rem' : '0.85rem',
											ml: 1,
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
											ml: 1,
											whiteSpace: 'nowrap',
										}}>
										{totalItems} {totalItems === 1 ? 'item' : 'items'}
									</Typography>
								)}
							</Box>
						</Box>
					</Box>
				</Box>
				<Box
					sx={{
						display: 'flex',
						gap: 1,
						flexWrap: 'wrap',
						justifyContent: 'flex-start',
						padding: '0.5rem 1rem 0.5rem 0rem',
						borderRadius: '4px',
						backgroundColor: theme.bgColor?.secondary,
						width: '100%',
					}}>
					{filterValue && filterValue.trim() && (
						<Chip
							label={`Filter: ${filterValue}`}
							onDelete={onResetFilter}
							color='secondary'
							variant='outlined'
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
					{searchedValue && searchButtonClicked && (
						<Chip
							label={`Search: "${searchedValue}"`}
							onDelete={onResetSearch}
							variant='outlined'
							color='secondary'
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
			</Box>

			{/* Spacer to push content down when sticky */}
			<Box
				sx={{
					height: (isSearchActive && searchedValue && searchButtonClicked) || (filterValue && filterValue.trim()) ? '0rem' : '0rem',
					width: '100%',
				}}
			/>
		</>
	);
};

export default StickyFilterSearchRow;
