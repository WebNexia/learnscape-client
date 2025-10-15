import { Box, Checkbox, DialogContent, FormControlLabel, Tooltip, Typography } from '@mui/material';
import CustomTextField from '../../forms/customFields/CustomTextField';
import CustomDialog from '../dialog/CustomDialog';
import CustomDialogActions from '../dialog/CustomDialogActions';
import { useContext, useState } from 'react';
import { PromoCode } from '../../../interfaces/promoCode';
import axios from '@utils/axiosInstance';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import { PromoCodesContext } from '../../../contexts/PromoCodesContextProvider';
import SelectApplicableCoursesCreate from './SelectApplicableCoursesCreate';
import CustomErrorMessage from '../../forms/customFields/CustomErrorMessage';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface CreateCodeDialogProps {
	isNewCodeModalOpen: boolean;
	setIsNewCodeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CreateCodeDialog = ({ isNewCodeModalOpen, setIsNewCodeModalOpen }: CreateCodeDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { orgId } = useContext(OrganisationContext);
	const { addNewPromoCode } = useContext(PromoCodesContext);

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [newPromoCode, setNewPromoCode] = useState<PromoCode>({
		_id: '',
		code: '',
		discountAmount: undefined,
		expirationDate: null,
		usageLimit: undefined,
		coursesApplicable: [],
		isAllCoursesSelected: false,
		isActive: true,
		usersUsed: [],
		orgId: '',
		applicableForSubscriptions: false,
		createdAt: '',
		updatedAt: '',
	});

	const resetForm = () => {
		setNewPromoCode({
			_id: '',
			code: '',
			discountAmount: undefined,
			expirationDate: null,
			usageLimit: undefined,
			coursesApplicable: [],
			isAllCoursesSelected: false,
			isActive: true,
			usersUsed: [],
			orgId: '',
			applicableForSubscriptions: false,
			createdAt: '',
			updatedAt: '',
		});
		setIsNewCodeModalOpen(false);
	};

	const [errorMsg, setErrorMsg] = useState<string>('');

	const createPromoCode = async () => {
		if (newPromoCode?.discountAmount && newPromoCode?.discountAmount < 0) {
			setErrorMsg('Discount amount cannot be negative number');
			return;
		}

		if (newPromoCode?.usageLimit && newPromoCode?.usageLimit < 0) {
			setErrorMsg('Usage limit cannot be negative number');
			return;
		}

		const newCode = {
			code: newPromoCode.code,
			discountAmount: newPromoCode.discountAmount || 0,
			expirationDate: newPromoCode.expirationDate,
			usageLimit: newPromoCode.usageLimit || 0,
			coursesApplicable: newPromoCode.isAllCoursesSelected ? [] : newPromoCode.coursesApplicable,
			isAllCoursesSelected: newPromoCode.isAllCoursesSelected,
			isActive: newPromoCode.isActive,
			applicableForSubscriptions: newPromoCode.applicableForSubscriptions,
			orgId,
		};

		try {
			const res = await axios.post(`${base_url}/promocodes`, newCode);
			addNewPromoCode({ ...newCode, createdAt: res.data.createdAt, _id: res.data._id } as PromoCode);

			resetForm();
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
				}}>
				<DialogContent sx={{ mt: '-0.5rem' }}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
						<Box sx={{ width: '100%', mr: '1rem' }}>
							<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '0.25rem' }}>
								Code
							</Typography>

							<CustomTextField
								value={newPromoCode.code}
								onChange={(e) => setNewPromoCode((prevData) => ({ ...prevData, code: e.target.value.trim() }))}
								InputProps={{
									inputProps: {
										maxLength: 15,
									},
								}}
							/>
							<Typography sx={{ fontSize: isMobileSize ? '0.65rem' : '0.7rem', margin: '-0.25rem 0 0.5rem 0rem', textAlign: 'right' }}>
								{newPromoCode.code.length}/15 Characters
							</Typography>
						</Box>
						<Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', width: '100%' }}>
							<Box sx={{ width: '100%' }}>
								<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '0.25rem' }}>
									Discount Percentage
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
					</Box>

					<SelectApplicableCoursesCreate newPromoCode={newPromoCode} setNewPromoCode={setNewPromoCode} />

					<Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mt: '1rem' }}>
						<Box sx={{ flex: 1 }}>
							<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '0.25rem' }}>
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
						<Box sx={{ flex: 1, ml: '0.75rem' }}>
							<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '0.25rem' }}>
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
					<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '1rem' }}>
						<FormControlLabel
							labelPlacement='end'
							control={
								<Checkbox
									checked={newPromoCode.applicableForSubscriptions}
									onChange={(e) => {
										setNewPromoCode((prevData) => ({ ...prevData, applicableForSubscriptions: e.target.checked }));
									}}
									sx={{
										'& .MuiSvgIcon-root': {
											fontSize: '1rem', // Adjust the checkbox icon size
										},
									}}
								/>
							}
							label='Applicable for Subscriptions'
							sx={{
								'& .MuiFormControlLabel-label': {
									fontSize: isMobileSize ? '0.7rem' : '0.85rem', // Adjust the label font size
								},
							}}
						/>
						<FormControlLabel
							labelPlacement='start'
							control={
								<Checkbox
									checked={newPromoCode.isActive}
									onChange={(e) => {
										setNewPromoCode((prevData) => ({ ...prevData, isActive: e.target.checked }));
									}}
									sx={{
										'& .MuiSvgIcon-root': {
											fontSize: '1rem', // Adjust the checkbox icon size
										},
									}}
								/>
							}
							label='Active'
							sx={{
								'& .MuiFormControlLabel-label': {
									fontSize: '0.85rem', // Adjust the label font size
								},
							}}
						/>
					</Box>
					{errorMsg && <CustomErrorMessage sx={{ width: '100%' }}>{errorMsg}</CustomErrorMessage>}
				</DialogContent>
				<CustomDialogActions
					actionSx={{ mt: '-1.5rem', mr: '0.5rem' }}
					onCancel={() => {
						resetForm();
					}}
				/>
			</form>
		</CustomDialog>
	);
};

export default CreateCodeDialog;
