import { DialogActions } from '@mui/material';
import CustomCancelButton from '../../forms/customButtons/CustomCancelButton';
import CustomSubmitButton from '../../forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from '../../forms/customButtons/CustomDeleteButton';
import { ReactNode } from 'react';

interface CustomDialogActionsProps {
	children?: ReactNode;
	onCancel?: () => void;
	onSubmit?: () => void;
	onDelete?: () => void;
	actionSx?: object;
	cancelBtnSx?: object;
	submitBtnSx?: object;
	cancelBtnText?: string;
	submitBtnText?: string;
	deleteBtn?: boolean;
	submitBtnType?: 'submit' | 'button' | 'reset' | undefined;
}

const CustomDialogActions = ({
	children,
	onCancel,
	onSubmit,
	onDelete,
	cancelBtnText = 'Cancel',
	submitBtnText = 'Create',
	actionSx,
	cancelBtnSx,
	submitBtnSx,
	deleteBtn = false,
	submitBtnType,
}: CustomDialogActionsProps) => {
	return (
		<DialogActions
			sx={{
				marginBottom: '1.5rem',
				...actionSx,
			}}>
			{children}
			<CustomCancelButton
				onClick={onCancel}
				sx={{
					margin: '0 0.5rem 0.5rem 0',
					...cancelBtnSx,
				}}>
				{cancelBtnText}
			</CustomCancelButton>
			{!deleteBtn ? (
				<CustomSubmitButton
					type={submitBtnType}
					sx={{
						margin: '0 0.5rem 0.5rem 0',
						...submitBtnSx,
					}}
					onClick={onSubmit}>
					{submitBtnText}
				</CustomSubmitButton>
			) : (
				<CustomDeleteButton
					sx={{
						margin: '0 0.5rem 0.5rem 0',
					}}
					onClick={onDelete}>
					Delete
				</CustomDeleteButton>
			)}
		</DialogActions>
	);
};

export default CustomDialogActions;
