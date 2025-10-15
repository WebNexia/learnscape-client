import { Box, Checkbox, DialogContent, FormControlLabel, Tooltip, Typography } from '@mui/material';
import { PromoCode } from '../../../interfaces/promoCode';
import CustomDialog from '../dialog/CustomDialog';
import CustomDialogActions from '../dialog/CustomDialogActions';
import CustomTextField from '../../forms/customFields/CustomTextField';
import SelectApplicableCoursesEdit from './SelectApplicableCoursesEdit';
import axios from '@utils/axiosInstance';
import { useContext, useState } from 'react';
import { PromoCodesContext } from '../../../contexts/PromoCodesContextProvider';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import CustomErrorMessage from '../../forms/customFields/CustomErrorMessage';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

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

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

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
			discountAmount: singleCode?.discountAmount || 0,
			expirationDate: singleCode?.expirationDate!,
			usageLimit: singleCode?.usageLimit || 0,
			isActive: singleCode?.isActive!,
			coursesApplicable: singleCode?.coursesApplicable!,
			isAllCoursesSelected: singleCode?.isAllCoursesSelected!,
			applicableForSubscriptions: singleCode?.applicableForSubscriptions || false,
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
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
						<Box sx={{ width: '100%', mr: '1rem' }}>
							<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '0.25rem' }}>
								Code
							</Typography>

							<CustomTextField
								value={singleCode?.code}
								onChange={(e) => setSingleCode((prevData) => ({ ...prevData!, code: e.target.value.trim() }))}
								InputProps={{
									inputProps: {
										maxLength: 15,
									},
								}}
							/>
							<Typography sx={{ fontSize: isMobileSize ? '0.65rem' : '0.7rem', margin: '-0.25rem 0 0.5rem 0rem', textAlign: 'right' }}>
								{singleCode?.code.length}/15 Characters
							</Typography>
						</Box>
						<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
							<Box sx={{ width: '100%' }}>
								<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '0.25rem' }}>
									Discount Percentage
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
					</Box>

					<SelectApplicableCoursesEdit singleCode={singleCode} setSingleCode={setSingleCode} />

					<Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mt: '1rem' }}>
						<Box sx={{ flex: 1 }}>
							<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '0.25rem' }}>
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
							<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.9rem', mb: '0.25rem' }}>
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
					<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '1rem' }}>
						<FormControlLabel
							labelPlacement='end'
							control={
								<Checkbox
									checked={singleCode?.applicableForSubscriptions || false}
									onChange={(e) => {
										setSingleCode((prevData) => ({ ...prevData!, applicableForSubscriptions: e.target.checked }));
									}}
									sx={{
										'& .MuiSvgIcon-root': {
											fontSize: isMobileSize ? '0.9rem' : '1rem', // Adjust the checkbox icon size
										},
									}}
								/>
							}
							label='Applicable for Subscriptions'
							sx={{
								'& .MuiFormControlLabel-label': {
									fontSize: isMobileSize ? '0.75rem' : '0.85rem', // Adjust the label font size
								},
							}}
						/>
						<FormControlLabel
							labelPlacement='start'
							control={
								<Checkbox
									checked={singleCode?.isActive}
									onChange={(e) => {
										setSingleCode((prevData) => ({ ...prevData!, isActive: e.target.checked }));
									}}
									sx={{
										'& .MuiSvgIcon-root': {
											fontSize: isMobileSize ? '0.9rem' : '1rem', // Adjust the checkbox icon size
										},
									}}
								/>
							}
							label='Active'
							sx={{
								'& .MuiFormControlLabel-label': {
									fontSize: isMobileSize ? '0.75rem' : '0.85rem', // Adjust the label font size
								},
							}}
						/>
					</Box>
					{errorMsg && <CustomErrorMessage sx={{ width: '100%' }}>{errorMsg}</CustomErrorMessage>}
				</DialogContent>
				<CustomDialogActions
					actionSx={{ mt: '-1.5rem', mr: '0.5rem' }}
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
