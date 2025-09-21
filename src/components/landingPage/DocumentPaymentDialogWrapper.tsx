import React from 'react';
import ConditionalStripeProvider from '../common/ConditionalStripeProvider';
import DocumentPaymentDialog from './DocumentPaymentDialog';
import { Document } from '../../interfaces/document';

interface DocumentPaymentDialogWrapperProps {
	document: Pick<Document, '_id' | 'name' | 'prices' | 'documentUrl' | 'orgId'>;
	isPaymentDialogOpen: boolean;
	setIsPaymentDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
	userCurrency: string;
	fromHomePage?: boolean;
	showSuccess: boolean;
	setShowSuccess: React.Dispatch<React.SetStateAction<boolean>>;
	showEmailWarning: boolean;
	setShowEmailWarning: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Wrapper component that provides Stripe context only when payment dialog is open.
 * This prevents unnecessary Stripe loading when the dialog is closed.
 */
const DocumentPaymentDialogWrapper: React.FC<DocumentPaymentDialogWrapperProps> = (props) => {
	// Only render Stripe provider when dialog is actually open
	if (!props.isPaymentDialogOpen) {
		return null;
	}

	return (
		<ConditionalStripeProvider>
			<DocumentPaymentDialog {...props} />
		</ConditionalStripeProvider>
	);
};

export default DocumentPaymentDialogWrapper;
