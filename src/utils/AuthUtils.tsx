import { TextField } from '@mui/material';
import { ReactElement } from 'react';

export const AuthUtils = {
	textFieldGenerator: (label: string, type: string): ReactElement => (
		<TextField
			variant='outlined'
			label={label}
			type={type}
			fullWidth
			sx={{ marginBottom: '0.85rem' }}
			size='medium'
		/>
	),
};
