import { Box, Checkbox, FormControlLabel, Typography } from '@mui/material';
import { useState } from 'react';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import CustomTextField from '../forms/customFields/CustomTextField';
import CustomErrorMessage from '../forms/customFields/CustomErrorMessage';
import HandleImageUploadURL from '../forms/uploadImageVideoDocument/HandleImageUploadURL';
import HandleVideoUploadURL from '../forms/uploadImageVideoDocument/HandleVideoUploadURL';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import type { SpeakingQuestionInput } from '../../utils/speakingTest/types';

type Props = {
	open: boolean;
	campaignId: string;
	initial: SpeakingQuestionInput | null;
	saving: boolean;
	onClose: () => void;
	onSave: (question: SpeakingQuestionInput) => void;
};

const SpeakingTestQuestionDialog = ({ open, campaignId, initial, saving, onClose, onSave }: Props) => {
	const [prompt, setPrompt] = useState(initial?.prompt || '');
	const [imageUrl, setImageUrl] = useState(initial?.imageUrl || '');
	const [videoUrl, setVideoUrl] = useState(initial?.videoUrl || '');
	const [askAudio, setAskAudio] = useState(initial?.askAudio ?? true);
	const [askVideo, setAskVideo] = useState(initial?.askVideo ?? false);
	const [enterImageUrl, setEnterImageUrl] = useState(false);
	const [enterVideoUrl, setEnterVideoUrl] = useState(true);
	const [error, setError] = useState('');

	const save = () => {
		const cleanPrompt = prompt.trim();
		if (cleanPrompt.length < 2) {
			setError('Question must be at least 2 characters.');
			return;
		}
		if (!askAudio && !askVideo) {
			setError('Select audio recording, video recording, or both.');
			return;
		}
		setError('');
		onSave({
			prompt: cleanPrompt,
			imageUrl: imageUrl.trim(),
			videoUrl: videoUrl.trim(),
			askAudio,
			askVideo,
		});
	};

	return (
		<CustomDialog
			openModal={open}
			closeModal={() => !saving && onClose()}
			maxWidth='md'
			title={initial ? 'Edit question' : 'New question'}>
			<Box sx={{ px: 3, pb: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
				<CustomTextField
					label='Question'
					value={prompt}
					onChange={(event) => setPrompt(event.target.value)}
					multiline
					rows={4}
					required
					InputProps={{ inputProps: { maxLength: 2000 } }}
				/>
				<Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', textAlign: 'right' }}>{prompt.trim().length}/2000</Typography>
				<Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
					Students can upload up to a 5-minute audio or 1-minute video recording.
				</Typography>
				<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
					<Box sx={{ flex: 1, minWidth: 240 }}>
						<HandleImageUploadURL
							label='Question image'
							imageFolderName='SpeakingTestQuestionImages'
							scopedEntityId={campaignId}
							imageUrlValue={imageUrl}
							enterImageUrl={enterImageUrl}
							setEnterImageUrl={setEnterImageUrl}
							onImageUploadLogic={setImageUrl}
							onChangeImgUrl={(event) => setImageUrl(event.target.value)}
						/>
						{imageUrl ? (
							<Box sx={{ mt: 1 }}>
								<Box component='img' src={imageUrl} alt='' sx={{ maxWidth: '100%', maxHeight: 140, borderRadius: 1 }} />
								<CustomCancelButton type='button' onClick={() => setImageUrl('')} sx={{ mt: 1 }} disabled={saving}>
									Remove image
								</CustomCancelButton>
							</Box>
						) : null}
					</Box>
					<Box sx={{ flex: 1, minWidth: 240 }}>
						<HandleVideoUploadURL
							label='Question video'
							videoFolderName='SpeakingTestQuestionVideos'
							videoUrlValue={videoUrl}
							enterVideoUrl={enterVideoUrl}
							setEnterVideoUrl={setEnterVideoUrl}
							onVideoUploadLogic={setVideoUrl}
							onChangeVideoUrl={(event) => setVideoUrl(event.target.value)}
						/>
					</Box>
				</Box>
				<Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
					<FormControlLabel
						control={
							<Checkbox
								checked={askAudio}
								onChange={(event) => {
									setAskAudio(event.target.checked);
									setError('');
								}}
							/>
						}
						label='Ask Audio Recording'
					/>
					<FormControlLabel
						control={
							<Checkbox
								checked={askVideo}
								onChange={(event) => {
									setAskVideo(event.target.checked);
									setError('');
								}}
							/>
						}
						label='Ask Video Recording'
					/>
				</Box>
				{error ? <CustomErrorMessage>- {error}</CustomErrorMessage> : null}
			</Box>
			<CustomDialogActions
				onCancel={onClose}
				onSubmit={save}
				submitBtnText='Save'
				disableBtn={saving}
				disableCancelBtn={saving}
				isSubmitting={saving}
			/>
		</CustomDialog>
	);
};

export default SpeakingTestQuestionDialog;
