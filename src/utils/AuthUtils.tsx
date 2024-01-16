import { TextField } from '@mui/material';
import { ReactElement } from 'react';

export const AuthUtils = {
	textFieldGenerator: (label: string, type: string, value: string, onchange: (evt: any) => void): ReactElement => (
		<TextField
			variant='outlined'
			label={label}
			type={type}
			value={value}
			onChange={onchange}
			fullWidth
			sx={{ marginBottom: '0.85rem' }}
			size='small'
		/>
	),
};
