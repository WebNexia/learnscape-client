import { Box, Typography, DialogActions } from '@mui/material';
import { Payment } from '../../../interfaces/payment';
import { setCurrencySymbol } from '../../../utils/setCurrencySymbol';
import theme from '../../../themes';
import CustomDialog from '../dialog/CustomDialog';
import CustomCancelButton from '../../../components/forms/customButtons/CustomCancelButton';
import { useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { useAuth } from '../../../hooks/useAuth';

interface PaymentDetailsDialogProps {
	open: boolean;
	onClose: () => void;
	payment: Payment | null;
}

const PaymentDetailsDialog = ({ open, onClose, payment }: PaymentDetailsDialogProps) => {
	if (!payment) return null;

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const { isOwner, isSuperAdmin } = useAuth();

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	// Build income details based on user role
	const incomeDetails = [];
	if (isOwner && payment.ownerIncome !== undefined) {
		incomeDetails.push({ label: 'Your Income (Commission)', value: `£${payment.ownerIncome.toFixed(2)}` });
		if (payment.commissionRate !== undefined) {
			const commissionPercent = (payment.commissionRate * 100).toFixed(2);
			incomeDetails.push({ label: 'Commission Rate', value: `${commissionPercent}%` });
		}
		if (payment.commissionType) {
			incomeDetails.push({ label: 'Commission Type', value: payment.commissionType === 'percentage' ? 'Percentage' : 'Fixed' });
		}
	} else if (isSuperAdmin && payment.superAdminIncome !== undefined) {
		incomeDetails.push({ label: 'Your Income (Share)', value: `£${payment.superAdminIncome.toFixed(2)}` });
		if (payment.commissionRate !== undefined) {
			const commissionPercent = (payment.commissionRate * 100).toFixed(2);
			incomeDetails.push({ label: 'Commission Rate', value: `${commissionPercent}%` });
		}
	}

	const sections = [
		{
			title: 'Payment Information',
			details: [
				{ label: 'Payment ID', value: payment.paymentId },
				{ label: 'Amount', value: `${setCurrencySymbol(payment.currency)}${payment.amount}` },
				{ label: 'Amount Received (GBP)', value: `£${payment.amountReceivedInGbp}` },
				{ label: 'Status', value: payment.status },
				{ label: 'Payment Type', value: payment.paymentType },
				...incomeDetails, // Add income details if available
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
			title: 'Course/Document Information',
			details: [
				{ label: 'Course', value: payment.courseTitle },
				{ label: 'Document', value: payment.documentName },
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

	return (
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
			<DialogActions>
				<CustomCancelButton
					onClick={onClose}
					sx={{
						margin: '0 1rem 0.5rem 0',
					}}>
					Close
				</CustomCancelButton>
			</DialogActions>
		</CustomDialog>
	);
};

export default PaymentDetailsDialog;
