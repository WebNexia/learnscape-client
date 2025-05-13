import { Box, Checkbox, DialogContent, FormControl, FormControlLabel, MenuItem, Select, Tooltip, Typography } from '@mui/material';
import { PromoCode } from '../../../interfaces/promoCode';
import CustomDialog from '../dialog/CustomDialog';
import CustomDialogActions from '../dialog/CustomDialogActions';
import CustomTextField from '../../forms/customFields/CustomTextField';
import SelectApplicableCoursesEdit from './SelectApplicableCoursesEdit';
import theme from '../../../themes';
import axios from '@utils/axiosInstance';
import { useContext, useState } from 'react';
import { PromoCodesContext } from '../../../contexts/PromoCodesContextProvider';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import CustomErrorMessage from '../../forms/customFields/CustomErrorMessage';

interface EditCodeDialogProps {
	singleCode: PromoCode | null;
	isEditCodeModalOpen: boolean[];
	closeCodeEditModal: (index: number) => void;
	index: number;
	setSingleCode: React.Dispatch<React.SetStateAction<PromoCode | null>>;
}

const EditCodeDialog = ({ singleCode, isEditCodeModalOpen, closeCodeEditModal, index, setSingleCode }: EditCodeDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { updatePromoCode } = useContext(PromoCodesContext);

	const [errorMsg, setErrorMsg] = useState<string>('');
	const { orgId } = useContext(OrganisationContext);

	const editCode = async () => {
		if (singleCode?.discountAmount && singleCode?.discountAmount < 0) {
			setErrorMsg('Discount amount cannot be negative number');
			return;
		}

		if (singleCode?.usageLimit && singleCode?.usageLimit < 0) {
			setErrorMsg('Usage limit cannot be negative number');
			return;
		}

		const updatedCode = {
			_id: singleCode?._id!,
			code: singleCode?.code!,
			discountType: singleCode?.discountType!,
			discountAmount: singleCode?.discountAmount || 0,
			expirationDate: singleCode?.expirationDate!,
			usageLimit: singleCode?.usageLimit || 0,
			isActive: singleCode?.isActive!,
			coursesApplicable: singleCode?.coursesApplicable!,
			isAllCoursesSelected: singleCode?.isAllCoursesSelected!,
			orgId,
			usersUsed: singleCode?.usersUsed!,
		};
		const res = await axios.patch(`${base_url}/promocodes/${singleCode?._id}`, updatedCode);

		closeCodeEditModal(index);

		updatePromoCode({
			...updatedCode,
			createdAt: res.data.createdAt,
			updatedAt: res.data.updatedAt,
		});
		try {
		} catch (error) {
			console.log(error);
		}
	};

	const formatDate = (date: string | Date) => {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return ''; // Check for valid Date

		const day = String(dateObj.getDate()).padStart(2, '0');
		const month = String(dateObj.getMonth() + 1).padStart(2, '0');
		const year = dateObj.getFullYear();

		return `${year}-${month}-${day}`;
	};

	const parseDate = (dateString: string) => {
		const [year, month, day] = dateString.split('-');
		return new Date(`${year}-${month}-${day}`);
	};

	return (
		<CustomDialog
			openModal={isEditCodeModalOpen[index]}
			closeModal={() => {
				closeCodeEditModal(index);
			}}
			title='Edit Promo Code'
			maxWidth='sm'>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					editCode();
				}}>
				<DialogContent sx={{ mt: '-0.5rem' }}>
					<Box>
						<Typography variant='h6' sx={{ fontSize: '0.9rem', mb: '0.25rem' }}>
							Code
						</Typography>
						<Tooltip title='Max 15 Characters' placement='top'>
							<CustomTextField
								value={singleCode?.code}
								onChange={(e) => setSingleCode((prevData) => ({ ...prevData!, code: e.target.value.trim() }))}
								InputProps={{
									inputProps: {
										maxLength: 15,
									},
								}}
							/>
						</Tooltip>
					</Box>

					<SelectApplicableCoursesEdit singleCode={singleCode} setSingleCode={setSingleCode} />

					<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
						<Box sx={{ flex: 1, margin: '1rem 0rem 1.85rem 0rem' }}>
							<Typography variant='h6' sx={{ fontSize: '0.9rem', mb: '0.25rem' }}>
								Discount Type
							</Typography>
							<FormControl>
								<Select
									size='small'
									value={singleCode?.discountType}
									onChange={(e) => setSingleCode((prevData) => ({ ...prevData!, discountType: e.target.value }))}
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
								value={singleCode?.discountAmount || undefined}
								onChange={(e) => setSingleCode((prevData) => ({ ...prevData!, discountAmount: +e.target.value }))}
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
								value={formatDate(singleCode?.expirationDate!)}
								onChange={(e) => {
									const selectedDate = parseDate(e.target.value);
									setSingleCode((prevData) => ({ ...prevData!, expirationDate: selectedDate }));
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
								value={singleCode?.usageLimit || undefined}
								onChange={(e) => setSingleCode((prevData) => ({ ...prevData!, usageLimit: +e.target.value }))}
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
									checked={singleCode?.isActive}
									onChange={(e) => {
										setSingleCode((prevData) => ({ ...prevData!, isActive: e.target.checked }));
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
					{errorMsg && <CustomErrorMessage sx={{ width: '100%' }}>{errorMsg}</CustomErrorMessage>}
				</DialogContent>
				<CustomDialogActions
					onCancel={() => {
						closeCodeEditModal(index);
					}}
					submitBtnText='Save'
				/>
			</form>
		</CustomDialog>
	);
};

export default EditCodeDialog;
