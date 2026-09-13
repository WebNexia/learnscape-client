import { Box, Typography, DialogActions } from '@mui/material';
import { Payment } from '../../../interfaces/payment';
import { setCurrencySymbol } from '../../../utils/setCurrencySymbol';
import theme from '../../../themes';
import CustomDialog from '../dialog/CustomDialog';
import CustomCancelButton from '../../../components/forms/customButtons/CustomCancelButton';
import CustomDeleteButton from '../../../components/forms/customButtons/CustomDeleteButton';
import CustomDialogActions from '../dialog/CustomDialogActions';
import { useContext, useState } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import axios from '@utils/axiosInstance';

interface PaymentDetailsDialogProps {
	open: boolean;
	onClose: () => void;
	payment: Payment | null;
	onDeleted?: (paymentId: string) => void;
}

const PaymentDetailsDialog = ({ open, onClose, payment, onDeleted }: PaymentDetailsDialogProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	if (!payment) return null;

	const canDelete = payment.isTestPayment === true;

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const sections = [
		{
			title: 'Payment Information',
			details: [
				{ label: 'Payment ID', value: payment.paymentId },
				{ label: 'Fatura No', value: payment.invoiceNumber },
				{ label: 'Amount', value: `${setCurrencySymbol(payment.currency)}${payment.amount}` },
				{ label: 'Amount Received (GBP)', value: `£${payment.amountReceivedInGbp}` },
				{ label: 'Status', value: payment.status },
				{ label: 'Payment Type', value: payment.paymentType },
				{ label: 'Test Payment', value: payment.isTestPayment === true ? 'Yes' : payment.isTestPayment === false ? 'No' : 'Unknown (legacy)' },
			],
		},
		{
			title: 'Payer Information',
			details: [
				{ label: 'First Name', value: payment.firstName },
				{ label: 'Last Name', value: payment.lastName },
				{ label: 'Email', value: payment.email },
				{ label: 'Username', value: payment.username },
			],
		},
		{
			title: 'Course/Document/Consultation/Club Information',
			details: [
				{ label: 'Course', value: payment.courseTitle },
				{ label: 'Document', value: payment.documentName },
				{ label: 'Consultation', value: payment.consultationTitle },
				{ label: 'Club', value: payment.clubTitle },
			],
		},
		{
			title: 'Additional Information',
			details: [
				{ label: 'Created At', value: formatDate(payment.createdAt) },
				{ label: 'Updated At', value: formatDate(payment.updatedAt) },
				{ label: 'Refunded', value: payment.isRefunded ? 'Yes' : 'No' },
				{ label: 'Refund ID', value: payment.refundId || 'N/A' },
			],
		},
	];

	const handleDelete = async () => {
		setDeleteError(null);
		setIsDeleting(true);
		try {
			await axios.delete(`${base_url}/payments/${payment._id}`);
			onDeleted?.(payment._id);
			setConfirmDelete(false);
			onClose();
		} catch (err: any) {
			setDeleteError(err?.response?.data?.message || 'Failed to delete payment.');
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<>
			<CustomDialog openModal={open} closeModal={onClose} maxWidth='md'>
				<Box sx={{ padding: '1.5rem' }}>
					{sections?.map((section, sectionIndex) => (
						<Box key={sectionIndex} sx={{ mb: sectionIndex < sections.length - 1 ? '3rem' : 0 }}>
							<Typography
								variant='h6'
								sx={{
									color: theme.textColor?.primary,
									fontWeight: 600,
									mb: 2,
									fontSize: isMobileSize ? '0.85rem' : '1rem',
								}}>
								{section.title}
							</Typography>
							<Box
								sx={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
									gap: '1.5rem',
								}}>
								{section.details?.map((detail, index) => (
									<Box
										key={index}
										sx={{
											display: 'flex',
											flexDirection: 'column',
											gap: '0.5rem',
										}}>
										<Typography
											variant='body2'
											sx={{
												color: theme.textColor?.primary.main,
												fontSize: isMobileSize ? '0.75rem' : '0.95rem',
												letterSpacing: '0.5px',
												fontWeight: 500,
											}}>
											{detail.label}
										</Typography>
										<Typography
											variant='body1'
											sx={{
												fontSize: isMobileSize ? '0.7rem' : '0.85rem',
												backgroundColor: theme.bgColor?.secondary,
												padding: '0.5rem 0.75rem',
												borderRadius: '0.5rem',
												border: '1px solid #e0e0e0',
											}}>
											{detail.value || 'N/A'}
										</Typography>
									</Box>
								))}
							</Box>
						</Box>
					))}
				</Box>
				<DialogActions sx={{ justifyContent: canDelete ? 'space-between' : 'flex-end', px: '1rem', pb: '0.5rem' }}>
					{canDelete && (
						<CustomDeleteButton type='button' onClick={() => setConfirmDelete(true)} sx={{ ml: 0 }}>
							Delete Test Payment
						</CustomDeleteButton>
					)}
					<CustomCancelButton onClick={onClose}>Close</CustomCancelButton>
				</DialogActions>
			</CustomDialog>

			{confirmDelete && (
				<CustomDialog openModal={confirmDelete} closeModal={() => !isDeleting && setConfirmDelete(false)} title='Delete test payment?' maxWidth='xs'>
					<Box sx={{ px: '1.5rem', pb: '0.5rem' }}>
						<Typography sx={{ fontSize: isMobileSize ? '0.8rem' : '0.9rem' }}>
							This permanently removes the payment and related test data (ticket, enrollment, commission) from the platform. Stripe may keep a
							refund/history record.
						</Typography>
						{deleteError && (
							<Typography color='error' sx={{ mt: 1, fontSize: '0.85rem' }}>
								{deleteError}
							</Typography>
						)}
					</Box>
					<CustomDialogActions
						deleteBtn
						onDelete={handleDelete}
						onCancel={() => setConfirmDelete(false)}
						isDeleting={isDeleting}
						actionSx={{ mb: '0.5rem' }}
					/>
				</CustomDialog>
			)}
		</>
	);
};

export default PaymentDetailsDialog;
