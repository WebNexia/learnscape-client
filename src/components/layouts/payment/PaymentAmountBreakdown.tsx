import { Box, Typography } from '@mui/material';
import { applyProcessingFee, formatMoneyAmount } from '../../../utils/processingFee';
import { setCurrencySymbol } from '../../../utils/setCurrencySymbol';

type PaymentAmountBreakdownProps = {
	baseAmount: number;
	currency: string;
	processingFeePercent?: number | string | null;
	productLabel: string;
	fontFamily?: string;
	isTr?: boolean;
};

const PaymentAmountBreakdown = ({
	baseAmount,
	currency,
	processingFeePercent,
	productLabel,
	fontFamily = 'Varela Round',
	isTr = true,
}: PaymentAmountBreakdownProps) => {
	const quote = applyProcessingFee(baseAmount, processingFeePercent);
	const symbol = setCurrencySymbol(currency);
	const rows = [
		{ label: productLabel, value: quote.baseAmount },
		{ label: isTr ? 'İşlem ücreti' : 'Processing fee', value: quote.processingFee },
		{ label: isTr ? 'Toplam' : 'Total', value: quote.total, emphasis: true },
	];

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, width: '100%' }}>
			{rows.map((row) => (
				<Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
					<Typography sx={{ fontFamily, fontSize: row.emphasis ? '1rem' : '0.9rem', fontWeight: row.emphasis ? 800 : 500, color: '#0A1A2F' }}>
						{row.label}
					</Typography>
					<Typography sx={{ fontFamily, fontSize: row.emphasis ? '1rem' : '0.9rem', fontWeight: row.emphasis ? 800 : 600, color: '#0A1A2F' }}>
						{symbol}
						{formatMoneyAmount(row.value)}
					</Typography>
				</Box>
			))}
		</Box>
	);
};

export default PaymentAmountBreakdown;
