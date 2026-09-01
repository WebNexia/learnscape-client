import React from 'react';
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

const PaymentDialogWrapper: React.FC<PaymentDialogWrapperProps> = (props) => {
	if (!props.isPaymentDialogOpen) {
		return null;
	}

	return <PaymentDialog {...props} />;
};

export default PaymentDialogWrapper;
