import { Box, Table, TableBody, TableCell, TableRow } from '@mui/material';
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
import { Delete, Edit, FileCopy } from '@mui/icons-material';
import axios from 'axios';
import CustomDialog from '../dialog/CustomDialog';
import CustomDialogActions from '../dialog/CustomDialogActions';

const AdminPromoCodesTab = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const {
		sortedPromoCodesData,
		sortPromoCodesData,
		promoCodesNumberOfPages,
		setPromoCodesPageNumber,
		promoCodesPageNumber,
		fetchPromoCodes,
		removePromoCode,
	} = useContext(PromoCodesContext);

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
			fetchPromoCodes(promoCodesPageNumber);
		}
	}, [promoCodesPageNumber]);

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
			fetchPromoCodes(promoCodesPageNumber);
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
			<Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', padding: '2rem 2rem 0rem 2rem', width: '100%' }}>
				<CustomSubmitButton
					onClick={() => {
						setIsNewCodeModalOpen(true);
					}}
					type='button'>
					New Promo Code
				</CustomSubmitButton>
			</Box>

			<CreateCodeDialog isNewCodeModalOpen={isNewCodeModalOpen} setIsNewCodeModalOpen={setIsNewCodeModalOpen} />

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: '0rem 2rem 2rem 2rem',
					width: '100%',
					mt: '2rem',
				}}>
				<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
					<CustomTableHead<PromoCode>
						orderBy={orderBy}
						order={order}
						handleSort={handleSort}
						columns={[
							{ key: 'code', label: 'Promo Code' },
							{ key: 'discountType', label: 'Discount Type' },
							{ key: 'discountAmount', label: 'Discount Amount' },
							{ key: 'expirationDate', label: 'Expiration Date' },
							{ key: 'usageLimit', label: 'Usage Limit' },
							{ key: 'isActive', label: 'Status' },
							{ key: 'actions', label: 'Actions' },
						]}
					/>
					<TableBody>
						{sortedPromoCodesData &&
							sortedPromoCodesData?.map((promoCode: PromoCode, index) => {
								return (
									<TableRow key={promoCode._id}>
										<CustomTableCell value={promoCode.code} />
										<CustomTableCell value={promoCode.discountType.charAt(0).toUpperCase() + promoCode.discountType.slice(1)} />
										<CustomTableCell value={promoCode.discountAmount} />
										<CustomTableCell
											value={new Date(promoCode.expirationDate!).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
										/>
										<CustomTableCell value={promoCode.usageLimit === 0 ? 'Unlimited' : promoCode.usageLimit} />
										<CustomTableCell value={promoCode.isActive ? 'Active' : 'Inactive'} />

										<TableCell
											sx={{
												textAlign: 'center',
											}}>
											<CustomActionBtn title='Clone' onClick={() => {}} icon={<FileCopy fontSize='small' />} />
											<CustomActionBtn
												title='Edit'
												onClick={() => {
													toggleCodeEditModal(index);
													setSingleCode(promoCode);
												}}
												icon={<Edit fontSize='small' />}
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
												icon={<Delete fontSize='small' />}
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
				<CustomTablePagination count={promoCodesNumberOfPages} page={promoCodesPageNumber} onChange={setPromoCodesPageNumber} />
			</Box>
		</Box>
	);
};

export default AdminPromoCodesTab;
