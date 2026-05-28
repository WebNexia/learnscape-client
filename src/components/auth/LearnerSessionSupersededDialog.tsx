import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { DialogContent, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import { LEARNER_SESSION_SUPERSEDED_EVENT } from '../../utils/learnerSession';

const LearnerSessionSupersededDialog = () => {
	const { signOut } = useContext(UserAuthContext);
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);
	const [isSigningOut, setIsSigningOut] = useState(false);
	const isHandlingRef = useRef(false);

	const handleOk = useCallback(async () => {
		if (isHandlingRef.current) return;
		isHandlingRef.current = true;
		setIsSigningOut(true);
		try {
			await signOut();
			setOpen(false);
			navigate('/auth', { replace: true });
		} catch (error) {
			console.error('Error signing out after session superseded:', error);
			setOpen(false);
			navigate('/auth', { replace: true });
		} finally {
			setIsSigningOut(false);
			isHandlingRef.current = false;
		}
	}, [navigate, signOut]);

	useEffect(() => {
		const onSuperseded = () => {
			if (isHandlingRef.current) return;
			setOpen(true);
		};

		window.addEventListener(LEARNER_SESSION_SUPERSEDED_EVENT, onSuperseded);
		return () => window.removeEventListener(LEARNER_SESSION_SUPERSEDED_EVENT, onSuperseded);
	}, []);

	return (
		<CustomDialog
			openModal={open}
			title='Oturum sonlandırıldı'
			maxWidth='sm'
			disableDismiss>
			<DialogContent>
				<Typography variant='body1'>
					Hesabınız başka bir cihazda açıldı. Bu cihazda devam edemezsiniz.
				</Typography>
			</DialogContent>
			<CustomDialogActions
				showCancelBtn={false}
				submitBtnText='OK'
				submitBtnType='button'
				onSubmit={handleOk}
				isSubmitting={isSigningOut}
				disableBtn={isSigningOut}
			/>
		</CustomDialog>
	);
};

export default LearnerSessionSupersededDialog;
