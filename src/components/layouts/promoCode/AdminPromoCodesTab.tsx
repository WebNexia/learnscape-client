import { Box, FormControl, InputAdornment, MenuItem, Select, Table, TableBody, TableCell, TableRow } from '@mui/material';
import { PromoCode } from '../../../interfaces/promoCode';
import { useContext, useEffect, useRef, useState } from 'react';
import { PromoCodesContext } from '../../../contexts/PromoCodesContextProvider';
import CustomSubmitButton from '../../forms/customButtons/CustomSubmitButton';
import CreateCodeDialog from './CreateCodeDialog';
import EditCodeDialog from './EditCodeDialog';
import CustomTableHead from '../table/CustomTableHead';
import CustomTableCell from '../table/CustomTableCell';
import CustomActionBtn from '../table/CustomActionBtn';
import CustomTablePagination from '../table/CustomTablePagination';
import { Delete, Edit, Search } from '@mui/icons-material';
import axios from 'axios';
import CustomDialog from '../dialog/CustomDialog';
import CustomDialogActions from '../dialog/CustomDialogActions';
import CustomTextField from '../../forms/customFields/CustomTextField';
import theme from '../../../themes';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import CustomInfoMessageAlignedLeft from '../infoMessage/CustomInfoMessageAlignedLeft';

const AdminPromoCodesTab = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { sortedPromoCodesData, sortPromoCodesData, fetchPromoCodes, removePromoCode } = useContext(PromoCodesContext);

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const [promoCodesPageNumber, setPromoCodesPageNumber] = useState<number>(1);
	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');

	const currentDate = new Date().toISOString().split('T')[0];

	const pageSize = 50;

	const filteredPromoCodes = sortedPromoCodesData.filter((promoCode) => {
		if (searchValue) {
			const lowerSearch = searchValue.toLowerCase();
			return promoCode?.code?.toLowerCase().includes(lowerSearch);
		}

		const expireDate = new Date(promoCode.expirationDate!).toISOString().split('T')[0];

		if (filterValue) {
			if (filterValue === 'percentage' && promoCode.discountType === 'percentage') return true;
			if (filterValue === 'fixed' && promoCode.discountType === 'fixed') return true;
			if (filterValue === 'active' && promoCode.isActive) return true;
			if (filterValue === 'inactive' && !promoCode.isActive) return true;
			if (filterValue === 'unlimited usage' && promoCode.usageLimit === 0) return true;
			if (filterValue === 'limited usage' && promoCode.usageLimit !== 0) return true;
			if (filterValue === 'expired' && expireDate < currentDate) return true;
			if (filterValue === 'unexpired' && expireDate >= currentDate) return true;
		}
		return !searchValue && !filterValue;
	});

	const promoCodesNumberOfPages = Math.ceil(filteredPromoCodes.length / pageSize);

	const paginatedPromoCodes = filteredPromoCodes.slice((promoCodesPageNumber - 1) * pageSize, promoCodesPageNumber * pageSize);

	const [orderBy, setOrderBy] = useState<keyof PromoCode>('updatedAt');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	const [isNewCodeModalOpen, setIsNewCodeModalOpen] = useState<boolean>(false);
	const [isEditCodeModalOpen, setIsEditCodeModalOpen] = useState<boolean[]>([]);
	const [isDeleteCodeModalOpen, setIsDeleteCodeModalOpen] = useState<boolean[]>([]);

	const [singleCode, setSingleCode] = useState<PromoCode | null>(null);

	const handleSort = (property: keyof PromoCode) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
		sortPromoCodesData(property, isAsc ? 'desc' : 'asc');
	};

	useEffect(() => {
		setPromoCodesPageNumber(1);
	}, []);

	useEffect(() => {
		setIsDeleteCodeModalOpen(Array(sortedPromoCodesData.length).fill(false));
		setIsEditCodeModalOpen(Array(sortedPromoCodesData.length).fill(false));
	}, [sortedPromoCodesData, promoCodesPageNumber]);

	const isInitialMount = useRef(true);

	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
		} else {
			fetchPromoCodes();
		}
	}, []);

	const openDeleteCodeModal = (index: number) => {
		const updatedState = [...isDeleteCodeModalOpen];
		updatedState[index] = true;
		setIsDeleteCodeModalOpen(updatedState);
	};
	const closeDeleteCodeModal = (index: number) => {
		const updatedState = [...isDeleteCodeModalOpen];
		updatedState[index] = false;
		setIsDeleteCodeModalOpen(updatedState);
	};

	const deleteCode = async (codeId: string): Promise<void> => {
		try {
			removePromoCode(codeId);
			await axios.delete(`${base_url}/promocodes/${codeId}`);
			fetchPromoCodes();
		} catch (error) {
			console.log(error);
		}
	};

	const toggleCodeEditModal = (index: number) => {
		const newEditModalOpen = [...isEditCodeModalOpen];
		newEditModalOpen[index] = !newEditModalOpen[index];
		setIsEditCodeModalOpen(newEditModalOpen);
	};

	const closeCodeEditModal = (index: number) => {
		const newEditModalOpen = [...isEditCodeModalOpen];
		newEditModalOpen[index] = false;
		setIsEditCodeModalOpen(newEditModalOpen);
	};

	return (
		<Box sx={{ width: '100%' }}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'flex-end',
					padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '2rem 2rem 1rem 2rem',
					width: '100%',
				}}>
				<Box sx={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
					<Box sx={{ mr: '1rem' }}>
						<FormControl>
							<Select
								size='small'
								value={filterValue}
								onChange={(e) => {
									setSearchValue('');
									setFilterValue(e.target.value);
								}}
								displayEmpty
								sx={{
									backgroundColor: theme.bgColor?.common,
									width: isMobileSizeSmall ? '8rem' : '12rem',
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
									Filter Codes
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
									All Codes
								</MenuItem>
								{['Percentage', 'Fixed', 'Active', 'Inactive', 'Unlimited Usage', 'Limited Usage', 'Expired', 'Unexpired'].map((type) => (
									<MenuItem
										value={type.toLowerCase()}
										key={type}
										sx={{
											fontSize: isMobileSize ? '0.65rem' : '0.85rem',
											textTransform: 'capitalize',
											padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
											minHeight: '2rem',
										}}>
										{type}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>
					<Box sx={{ alignSelf: 'flex-start', width: isVerySmallScreen ? '7rem' : isMobileSize ? '15rem' : '17.5rem' }}>
						<CustomTextField
							value={searchValue}
							placeholder={isVerySmallScreen ? 'Search Code' : 'Search Promo Code'}
							onChange={(e) => {
								setSearchValue(e.target.value);
								setFilterValue('filter');
								if (e.target.value === '') {
									setFilterValue('');
								}
							}}
							sx={{ backgroundColor: '#fff' }}
							required={false}
							InputProps={{
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
				</Box>
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '15%', height: isVerySmallScreen ? '1.75rem' : '2rem' }}>
					<CustomSubmitButton
						onClick={() => {
							setIsNewCodeModalOpen(true);
						}}
						sx={{ fontSize: isMobileSize ? '0.7rem' : undefined }}
						type='button'>
						{isMobileSize ? 'New' : 'New Promo Code'}
					</CustomSubmitButton>
				</Box>
			</Box>

			<CreateCodeDialog isNewCodeModalOpen={isNewCodeModalOpen} setIsNewCodeModalOpen={setIsNewCodeModalOpen} />

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: '0rem 2rem 2rem 2rem',
					width: '100%',
					mt: '1rem',
				}}>
				<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
					<CustomTableHead<PromoCode>
						orderBy={orderBy}
						order={order}
						handleSort={handleSort}
						columns={
							isVerySmallScreen
								? [
										{ key: 'code', label: 'Promo Code' },
										{ key: 'discountType', label: 'Discount Type' },
										{ key: 'discountAmount', label: 'Discount Amount' },
										{ key: 'isActive', label: 'Status' },
										{ key: 'actions', label: 'Actions' },
								  ]
								: [
										{ key: 'code', label: 'Promo Code' },
										{ key: 'discountType', label: 'Discount Type' },
										{ key: 'discountAmount', label: 'Discount Amount' },
										{ key: 'expirationDate', label: 'Expiration Date' },
										{ key: 'usageLimit', label: 'Usage Limit' },
										{ key: 'isActive', label: 'Status' },
										{ key: 'actions', label: 'Actions' },
								  ]
						}
					/>
					<TableBody>
						{paginatedPromoCodes &&
							paginatedPromoCodes?.map((promoCode: PromoCode, index) => {
								return (
									<TableRow key={promoCode._id}>
										<CustomTableCell value={promoCode.code} />
										<CustomTableCell value={promoCode.discountType.charAt(0).toUpperCase() + promoCode.discountType.slice(1)} />
										<CustomTableCell value={promoCode.discountAmount} />
										{!isVerySmallScreen && (
											<CustomTableCell
												value={new Date(promoCode.expirationDate!).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
											/>
										)}
										{!isVerySmallScreen && <CustomTableCell value={promoCode.usageLimit === 0 ? 'Unlimited' : promoCode.usageLimit} />}
										<CustomTableCell value={promoCode.isActive ? 'Active' : 'Inactive'} />

										<TableCell
											sx={{
												textAlign: 'center',
											}}>
											<CustomActionBtn
												title='Edit'
												onClick={() => {
													toggleCodeEditModal(index);
													setSingleCode(promoCode);
												}}
												icon={<Edit fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
											/>
											<EditCodeDialog
												isEditCodeModalOpen={isEditCodeModalOpen}
												closeCodeEditModal={closeCodeEditModal}
												index={index}
												singleCode={singleCode}
												setSingleCode={setSingleCode}
											/>
											<CustomActionBtn
												title='Delete'
												onClick={() => {
													openDeleteCodeModal(index);
												}}
												icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
											/>
										</TableCell>
										{isDeleteCodeModalOpen[index] !== undefined && (
											<CustomDialog
												openModal={isDeleteCodeModalOpen[index]}
												closeModal={() => closeDeleteCodeModal(index)}
												title='Delete Promo Code'
												content='Are you sure you want to delete this promo code?'
												maxWidth='sm'>
												<CustomDialogActions
													onCancel={() => {
														closeDeleteCodeModal(index);
													}}
													deleteBtn={true}
													onDelete={() => {
														deleteCode(promoCode.code);
														closeDeleteCodeModal(index);
													}}
												/>
											</CustomDialog>
										)}
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
				{isVerySmallScreen && <CustomInfoMessageAlignedLeft message='Rotate your device for more info' />}
				<CustomTablePagination count={promoCodesNumberOfPages} page={promoCodesPageNumber} onChange={setPromoCodesPageNumber} />
			</Box>
		</Box>
	);
};

export default AdminPromoCodesTab;
