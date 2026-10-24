import { useEffect, useState } from 'react';
import { Alert, Box, Button } from '@mui/material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import PromoBannerFields from './PromoBannerFields';
import PromoBannerModal from '../landingPage/PromoBannerModal';
import { PromoBanner, coercePromoBanner, promoBannerError } from '../../utils/promoBanner';

interface PromoBannerEditorDialogProps {
	isOpen: boolean;
	banner?: Partial<PromoBanner> | null;
	onClose: () => void;
	onSave: (banner: PromoBanner) => Promise<void>;
}

const PromoBannerEditorDialog = ({ isOpen, banner, onClose, onSave }: PromoBannerEditorDialogProps) => {
	const [draft, setDraft] = useState<PromoBanner>(coercePromoBanner(banner));
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [previewOpen, setPreviewOpen] = useState(false);

	useEffect(() => {
		if (!isOpen) return;
		setDraft(coercePromoBanner(banner));
		setError(null);
		setPreviewOpen(false);
		// Reseed only when the dialog opens so typing is not reset by a parent render.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen]);

	const handleSave = async () => {
		const message = promoBannerError(draft);
		if (message) {
			setError(message);
			return;
		}
		setSaving(true);
		setError(null);
		try {
			await onSave({
				...draft,
				title: draft.title.trim(),
				body: draft.body.trim(),
				buttonLabel: draft.buttonLabel.trim(),
				buttonUrl: draft.buttonUrl.trim(),
			});
			onClose();
		} catch (saveError: unknown) {
			const responseMessage = (saveError as { response?: { data?: { message?: string } } })?.response?.data?.message;
			setError(responseMessage || 'Could not save the announcement');
		} finally {
			setSaving(false);
		}
	};

	return (
		<>
			<CustomDialog title='Books page announcement' openModal={isOpen} closeModal={onClose} maxWidth='sm' disableDismiss={saving}>
				<Box sx={{ px: { xs: 2, sm: 3 }, pb: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
					{error ? <Alert severity='error'>{error}</Alert> : null}
					<PromoBannerFields
						value={draft}
						onChange={setDraft}
						description='Shown once per visit on the public books page. Book detail pages use their own announcement, edited on each book.'
					/>
				</Box>
				<CustomDialogActions
					onCancel={onClose}
					onSubmit={() => {
						void handleSave();
					}}
					cancelBtnText='Cancel'
					submitBtnText={saving ? 'Saving...' : 'Save'}
					disableBtn={saving}
					disableCancelBtn={saving}
					isSubmitting={saving}
					actionSx={{ px: 2, pb: 1 }}>
					<Button
						onClick={() => setPreviewOpen(true)}
						disabled={!draft.title.trim() && !draft.body.trim()}
						sx={{ mr: 'auto', textTransform: 'none', fontSize: '0.85rem' }}>
						Preview
					</Button>
				</CustomDialogActions>
			</CustomDialog>
			<PromoBannerModal banner={{ ...draft, enabled: true }} open={previewOpen} onClose={() => setPreviewOpen(false)} preview />
		</>
	);
};

export default PromoBannerEditorDialog;
