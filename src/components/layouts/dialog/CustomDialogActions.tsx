import { DialogActions } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import CustomCancelButton from '../../forms/customButtons/CustomCancelButton';
import CustomSubmitButton from '../../forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from '../../forms/customButtons/CustomDeleteButton';
import { ReactNode, useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import theme from '../../../themes';

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
	deleteBtnText?: string;
	deleteBtn?: boolean;
	submitBtnType?: 'submit' | 'button' | 'reset' | undefined;
	disableBtn?: boolean;
	disableCancelBtn?: boolean;
	showCancelBtn?: boolean;
	isSubmitting?: boolean;
	isDeleting?: boolean;
	hideSubmit?: boolean; // When true, only show cancel button
}

const CustomDialogActions = ({
	children,
	onCancel,
	onSubmit,
	onDelete,
	cancelBtnText = 'Cancel',
	submitBtnText = 'Create',
	deleteBtnText = 'Delete',
	actionSx,
	cancelBtnSx,
	submitBtnSx,
	deleteBtn = false,
	submitBtnType,
	disableBtn = false,
	disableCancelBtn = false,
	showCancelBtn = true,
	isSubmitting = false,
	isDeleting = false,
	hideSubmit = false,
}: CustomDialogActionsProps) => {
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);

	const isMobileSize: boolean = isSmallScreen || isRotatedMedium;
	// Same height/radius as New Course (CustomSubmitButton); no forced extra width
	const dialogBtnSx = {
		margin: '0 0.5rem 0.5rem 0',
		height: isMobileSize ? '1.5rem' : '1.75rem',
		fontSize: isMobileSize ? '0.7rem' : '0.85rem',
		borderRadius: '10px',
	};

	return (
		<DialogActions
			sx={{
				marginBottom: isMobileSize ? '0.5rem' : '1.5rem',
				...actionSx,
			}}>
			{children}
			{showCancelBtn && (
				<CustomCancelButton
					onClick={onCancel}
					disabled={disableCancelBtn || isSubmitting || isDeleting}
					sx={{
						...dialogBtnSx,
						cursor: disableCancelBtn || isSubmitting || isDeleting ? 'not-allowed' : 'pointer',
						pointerEvents: disableCancelBtn || isSubmitting || isDeleting ? 'none' : 'auto',
						...cancelBtnSx,
					}}>
					{cancelBtnText}
				</CustomCancelButton>
			)}
			{!hideSubmit && !deleteBtn && (isSubmitting ? (
				<LoadingButton
					type={submitBtnType}
					disabled={true}
					loading={true}
					variant='contained'
					sx={{
						...dialogBtnSx,
						backgroundColor: theme.bgColor?.greenPrimary,
						boxShadow: 'none',
						textTransform: 'capitalize',
						...submitBtnSx,
					}}
					size='small'>
					{submitBtnText}
				</LoadingButton>
			) : (
				<CustomSubmitButton
					type={submitBtnType}
					disabled={disableBtn}
					sx={{
						...dialogBtnSx,
						...submitBtnSx,
					}}
					onClick={onSubmit}>
					{submitBtnText}
				</CustomSubmitButton>
			))}
			{!hideSubmit && deleteBtn && (isDeleting ? (
				<LoadingButton
					disabled={true}
					loading={true}
					variant='contained'
					sx={{
						...dialogBtnSx,
						backgroundColor: 'white !important',
						textTransform: 'capitalize',
						'&.Mui-disabled': {
							backgroundColor: 'white !important',
						},
					}}
					size='small'>
					{deleteBtnText}
				</LoadingButton>
			) : (
				<CustomDeleteButton
					disabled={disableBtn}
					sx={{
						...dialogBtnSx,
					}}
					onClick={onDelete}>
					{deleteBtnText}
				</CustomDeleteButton>
			))}
		</DialogActions>
	);
};

export default CustomDialogActions;
