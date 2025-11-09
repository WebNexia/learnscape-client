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
}: CustomDialogActionsProps) => {
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);

	const isMobileSize: boolean = isSmallScreen || isRotatedMedium;
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
					sx={{
						margin: '0 0.5rem 0.5rem 0',
						height: isMobileSize ? '1.5rem' : '2.15rem',
						fontSize: isMobileSize ? '0.7rem' : '0.85rem',
						cursor: disableCancelBtn || isSubmitting ? 'not-allowed' : 'pointer',
						pointerEvents: disableCancelBtn || isSubmitting ? 'none' : 'auto',
						...cancelBtnSx,
					}}>
					{cancelBtnText}
				</CustomCancelButton>
			)}
			{!deleteBtn ? (
				isSubmitting ? (
					<LoadingButton
						type={submitBtnType}
						disabled={true}
						loading={true}
						variant='contained'
						sx={{
							margin: '0 0.5rem 0.5rem 0',
							height: isMobileSize ? '1.5rem' : '2.15rem',
							fontSize: isMobileSize ? '0.7rem' : '0.85rem',
							backgroundColor: theme.bgColor?.greenPrimary,
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
							margin: '0 0.5rem 0.5rem 0',
							height: isMobileSize ? '1.5rem' : '2.15rem',
							fontSize: isMobileSize ? '0.7rem' : '0.85rem',
							...submitBtnSx,
						}}
						onClick={onSubmit}>
						{submitBtnText}
					</CustomSubmitButton>
				)
			) : (
				<CustomDeleteButton
					sx={{
						margin: '0 0.5rem 0.5rem 0',
						height: isMobileSize ? '1.5rem' : '2.15rem',
						fontSize: isMobileSize ? '0.7rem' : '0.85rem',
					}}
					onClick={onDelete}>
					{deleteBtnText}
				</CustomDeleteButton>
			)}
		</DialogActions>
	);
};

export default CustomDialogActions;
