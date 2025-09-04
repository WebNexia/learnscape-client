import React from 'react';
import ConditionalStripeProvider from '../../common/ConditionalStripeProvider';
import PaymentDialog from './PaymentDialog';
import { SingleCourse } from '../../../interfaces/course';

interface PaymentDialogWrapperProps {
	course: SingleCourse;
	isPaymentDialogOpen: boolean;
	setIsPaymentDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
	courseRegistration: any;
	fromHomePage?: boolean;
	setDisplayEnrollmentMsg: React.Dispatch<React.SetStateAction<boolean>>;
	setIsEnrolledStatus?: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Wrapper component that provides Stripe context only when course payment dialog is open.
 * This prevents unnecessary Stripe loading when the dialog is closed.
 */
const PaymentDialogWrapper: React.FC<PaymentDialogWrapperProps> = (props) => {
	// Only render Stripe provider when dialog is actually open
	if (!props.isPaymentDialogOpen) {
		return null;
	}

	return (
		<ConditionalStripeProvider>
			<PaymentDialog {...props} />
		</ConditionalStripeProvider>
	);
};

export default PaymentDialogWrapper;
