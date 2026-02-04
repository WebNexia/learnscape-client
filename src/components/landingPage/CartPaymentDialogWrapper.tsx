import ConditionalStripeProvider from '../common/ConditionalStripeProvider';
import CartPaymentDialog, { CartPaymentItem } from './CartPaymentDialog';

interface CartPaymentDialogWrapperProps {
	open: boolean;
	onClose: () => void;
	queue: CartPaymentItem[];
	firstName: string;
	lastName: string;
	email: string;
	onSuccess: () => void;
}

export default function CartPaymentDialogWrapper(props: CartPaymentDialogWrapperProps) {
	if (!props.open || !props.queue.length) return null;
	return (
		<ConditionalStripeProvider>
			<CartPaymentDialog {...props} />
		</ConditionalStripeProvider>
	);
}
