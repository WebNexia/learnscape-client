import CustomTextField from './CustomTextField';

type ProcessingFeePercentFieldProps = {
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
};

const ProcessingFeePercentField = ({ value, onChange, disabled }: ProcessingFeePercentFieldProps) => (
	<CustomTextField
		label='İşlem ücreti (%)'
		value={value}
		onChange={(e) => {
			const next = e.target.value;
			if (next === '' || (/^\d*\.?\d*$/.test(next) && Number(next) <= 100)) onChange(next);
		}}
		type='number'
		disabled={disabled}
		placeholder='4'
		helperText='Boş bırakılırsa %4 uygulanır. 0 yazılırsa işlem ücreti eklenmez.'
		InputProps={{ inputProps: { min: 0, max: 100, step: 0.01 } }}
		sx={{ maxWidth: 280, mt: 1 }}
	/>
);

export default ProcessingFeePercentField;
