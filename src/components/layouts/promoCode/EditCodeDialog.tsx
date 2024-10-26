import { Box, Checkbox, DialogContent, FormControl, FormControlLabel, MenuItem, Select, Tooltip, Typography } from '@mui/material';
import { PromoCode } from '../../../interfaces/promoCode';
import CustomDialog from '../dialog/CustomDialog';
import CustomDialogActions from '../dialog/CustomDialogActions';
import CustomTextField from '../../forms/customFields/CustomTextField';
import SelectApplicableCoursesEdit from './SelectApplicableCoursesEdit';
import theme from '../../../themes';

interface EditCodeDialogProps {
	singleCode: PromoCode | null;
	isEditCodeModalOpen: boolean[];
	closeCodeEditModal: (index: number) => void;
	index: number;
	setSingleCode: React.Dispatch<React.SetStateAction<PromoCode | null>>;
}

const EditCodeDialog = ({ singleCode, isEditCodeModalOpen, closeCodeEditModal, index, setSingleCode }: EditCodeDialogProps) => {
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
			openModal={isEditCodeModalOpen[index]}
			closeModal={() => {
				closeCodeEditModal(index);
			}}
			title='Edit Promo Code'
			maxWidth='sm'>
			<form
				onSubmit={() => {
					closeCodeEditModal(index);
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
								value={singleCode?.discountAmount}
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
								value={singleCode?.usageLimit}
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
