import { Box, Checkbox, DialogContent, FormControl, FormControlLabel, MenuItem, Select, Tooltip, Typography } from '@mui/material';
import CustomTextField from '../../forms/customFields/CustomTextField';
import CustomDialog from '../dialog/CustomDialog';
import CustomDialogActions from '../dialog/CustomDialogActions';
import { useContext, useState } from 'react';
import { PromoCode } from '../../../interfaces/promoCode';
import theme from '../../../themes';
import axios from 'axios';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import { PromoCodesContext } from '../../../contexts/PromoCodesContextProvider';
import SelectApplicableCoursesCreate from './SelectApplicableCoursesCreate';

interface CreateCodeDialogProps {
	isNewCodeModalOpen: boolean;
	setIsNewCodeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CreateCodeDialog = ({ isNewCodeModalOpen, setIsNewCodeModalOpen }: CreateCodeDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { orgId } = useContext(OrganisationContext);
	const { addNewPromoCode } = useContext(PromoCodesContext);

	const [newPromoCode, setNewPromoCode] = useState<PromoCode>({
		_id: '',
		code: '',
		discountType: '',
		discountAmount: undefined,
		expirationDate: null,
		usageLimit: undefined,
		coursesApplicable: [],
		isAllCoursesSelected: false,
		isActive: true,
		usersUsed: [],
		orgId: '',
		createdAt: '',
		updatedAt: '',
	});

	const resetForm = () => {
		setNewPromoCode({
			_id: '',
			code: '',
			discountType: '',
			discountAmount: undefined,
			expirationDate: null,
			usageLimit: undefined,
			coursesApplicable: [],
			isAllCoursesSelected: false,
			isActive: true,
			usersUsed: [],
			orgId: '',
			createdAt: '',
			updatedAt: '',
		});
		setIsNewCodeModalOpen(false);
	};

	const createPromoCode = async () => {
		const newCode = {
			code: newPromoCode.code,
			discountType: newPromoCode.discountType,
			discountAmount: newPromoCode.discountAmount,
			expirationDate: newPromoCode.expirationDate,
			usageLimit: newPromoCode.usageLimit || 0,
			coursesApplicable: newPromoCode.isAllCoursesSelected ? [] : newPromoCode.coursesApplicable,
			isAllCoursesSelected: newPromoCode.isAllCoursesSelected,
			isActive: newPromoCode.isActive,
			orgId,
		};

		try {
			const res = await axios.post(`${base_url}/promocodes`, newCode);
			addNewPromoCode({ ...newCode, createdAt: res.data.createdAt, _id: res.data._id });
		} catch (error) {
			console.log(error);
		}
	};

	const formatDate = (date: Date) => {
		if (!(date instanceof Date)) return ''; // Return empty string if date is not valid

		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();

		return `${year}-${month}-${day}`;
	};

	const parseDate = (dateString: string) => {
		const [year, month, day] = dateString.split('-');
		return new Date(`${year}-${month}-${day}`);
	};
	return (
		<CustomDialog
			openModal={isNewCodeModalOpen}
			closeModal={() => {
				resetForm();
			}}
			title='Create New Promo Code'
			maxWidth='sm'>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					createPromoCode();
					resetForm();
				}}>
				<DialogContent sx={{ mt: '-0.5rem' }}>
					<Box>
						<Typography variant='h6' sx={{ fontSize: '0.9rem', mb: '0.25rem' }}>
							Code
						</Typography>
						<Tooltip title='Max 15 Characters' placement='top'>
							<CustomTextField
								value={newPromoCode.code}
								onChange={(e) => setNewPromoCode((prevData) => ({ ...prevData, code: e.target.value.trim() }))}
								InputProps={{
									inputProps: {
										maxLength: 15,
									},
								}}
							/>
						</Tooltip>
					</Box>

					<SelectApplicableCoursesCreate newPromoCode={newPromoCode} setNewPromoCode={setNewPromoCode} />

					<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
						<Box sx={{ flex: 1, margin: '1rem 0rem 1.85rem 0rem' }}>
							<Typography variant='h6' sx={{ fontSize: '0.9rem', mb: '0.25rem' }}>
								Discount Type
							</Typography>
							<FormControl>
								<Select
									size='small'
									value={newPromoCode.discountType}
									onChange={(e) => setNewPromoCode((prevData) => ({ ...prevData, discountType: e.target.value }))}
									required
									sx={{ backgroundColor: theme.bgColor?.common, width: '11.25rem', mr: '0.75rem', fontSize: '0.85rem' }}>
									{['Percentage', 'Fixed'].map((type) => (
										<MenuItem value={type.toLowerCase()} key={type} sx={{ fontSize: '0.85rem' }}>
											{type}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Box>
						<Box sx={{ margin: '1rem 0rem', flex: 2 }}>
							<Typography variant='h6' sx={{ fontSize: '0.9rem', mb: '0.25rem' }}>
								Discount Amount
							</Typography>
							<CustomTextField
								value={newPromoCode.discountAmount}
								onChange={(e) => setNewPromoCode((prevData) => ({ ...prevData, discountAmount: +e.target.value }))}
								type='number'
								InputLabelProps={{
									sx: { fontSize: '0.8rem' },
								}}
							/>
						</Box>
					</Box>
					<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
						<Box sx={{ flex: 1 }}>
							<Typography variant='h6' sx={{ fontSize: '0.9rem', mb: '0.25rem' }}>
								Expiration Date
							</Typography>
							<CustomTextField
								value={formatDate(newPromoCode.expirationDate!)}
								onChange={(e) => {
									const selectedDate = parseDate(e.target.value);
									setNewPromoCode((prevData) => ({ ...prevData, expirationDate: selectedDate }));
								}}
								InputProps={{
									inputProps: {
										maxLength: 15,
									},
								}}
								type='date'
							/>
						</Box>
						<Box sx={{ flex: 2, ml: '0.75rem' }}>
							<Typography variant='h6' sx={{ fontSize: '0.9rem', mb: '0.25rem' }}>
								Usage Limit
							</Typography>
							<CustomTextField
								required={false}
								value={newPromoCode.usageLimit}
								onChange={(e) => setNewPromoCode((prevData) => ({ ...prevData, usageLimit: +e.target.value }))}
								InputProps={{
									inputProps: {
										maxLength: 15,
									},
								}}
								type='number'
							/>
						</Box>
					</Box>
					<Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: '0.85rem' }}>
						<FormControlLabel
							labelPlacement='end'
							control={
								<Checkbox
									checked={newPromoCode.isActive}
									onChange={(e) => {
										setNewPromoCode((prevData) => ({ ...prevData, isActive: e.target.checked }));
									}}
									sx={{
										'& .MuiSvgIcon-root': {
											fontSize: '1.25rem', // Adjust the checkbox icon size
										},
									}}
								/>
							}
							label='Active'
							sx={{
								'& .MuiFormControlLabel-label': {
									fontSize: '0.7rem', // Adjust the label font size
								},
							}}
						/>
					</Box>
				</DialogContent>
				<CustomDialogActions
					onCancel={() => {
						resetForm();
					}}
				/>
			</form>
		</CustomDialog>
	);
};

export default CreateCodeDialog;
