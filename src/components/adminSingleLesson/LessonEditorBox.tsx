import { Alert, Box, IconButton, Snackbar, Tooltip, Typography } from '@mui/material';
import ReactPlayer from 'react-player';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import { Edit } from '@mui/icons-material';
import { Lesson } from '../../interfaces/lessons';
import { FormEvent, useState } from 'react';
import { QuestionUpdateTrack } from '../../pages/AdminLessonEditPage';
import CustomDialog from '../layouts/dialog/CustomDialog';

interface LessonEditorBoxProps {
	singleLesson: Lesson;
	singleLessonBeforeSave: Lesson;
	isEditMode: boolean;
	isActive: boolean;
	isMissingFieldMsgOpen: boolean;
	resetChanges: boolean;
	setSingleLessonBeforeSave: React.Dispatch<React.SetStateAction<Lesson>>;
	setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
	setIsMissingFieldMsgOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setIsMissingField: React.Dispatch<React.SetStateAction<boolean>>;
	handlePublishing: () => void;
	setResetChanges: React.Dispatch<React.SetStateAction<boolean>>;
	handleLessonUpdate: (event: React.FormEvent<Element>) => void;
	setIsLessonUpdated: React.Dispatch<React.SetStateAction<boolean>>;
	setIsQuestionUpdated: React.Dispatch<React.SetStateAction<QuestionUpdateTrack[]>>;
}

const LessonEditorBox = ({
	singleLesson,
	singleLessonBeforeSave,
	isEditMode,
	isActive,
	isMissingFieldMsgOpen,
	resetChanges,
	setSingleLessonBeforeSave,
	setIsEditMode,
	setIsMissingFieldMsgOpen,
	setIsMissingField,
	handlePublishing,
	setResetChanges,
	handleLessonUpdate,
	setIsLessonUpdated,
	setIsQuestionUpdated,
}: LessonEditorBoxProps) => {
	const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState<boolean>(false);
	const vertical = 'top';
	const horizontal = 'center';
	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				width: '100%',
			}}>
			<Box sx={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
				<Box sx={{ height: '8rem', width: '12rem', mr: '2rem' }}>
					{singleLessonBeforeSave?.imageUrl && (
						<img
							src={singleLessonBeforeSave.imageUrl}
							alt='course_img'
							height='100%'
							style={{
								borderRadius: '0.2rem',
								boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
							}}
						/>
					)}
					<Typography variant='body2' sx={{ mt: '0.35rem' }}>
						Lesson Image
					</Typography>
				</Box>
				<Box
					sx={{ height: '8rem', width: '12rem', cursor: 'pointer' }}
					onClick={() => {
						if (singleLessonBeforeSave?.videoUrl) {
							setIsVideoPlayerOpen(true);
						}
					}}>
					{singleLessonBeforeSave?.videoUrl ? (
						<Box
							sx={{
								height: '100%',
								width: '100%',
								position: 'relative',
							}}>
							<ReactPlayer
								url={singleLessonBeforeSave?.videoUrl}
								height='100%'
								width='100%'
								style={{
									borderRadius: '0.2rem',
									boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
								}}
								light={true}
								controls={false}
							/>
							<Box
								sx={{
									position: 'absolute',
									top: 0,
									left: 0,
									height: '100%',
									width: '100%',
									zIndex: 1000,
									backgroundColor: 'transparent',
									cursor: 'pointer',
								}}
								onClick={() => {
									if (singleLessonBeforeSave?.videoUrl) {
										setIsVideoPlayerOpen(true);
									}
								}}></Box>
						</Box>
					) : (
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								height: '100%',
							}}>
							<img
								src={'https://www.47pitches.com/contents/images/no-video.jpg'}
								alt='video_thumbnail'
								height='100%'
								width='100%'
								style={{
									borderRadius: '0.2rem',
									boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
								}}
							/>
						</Box>
					)}
					<Typography variant='body2' sx={{ mt: '0.35rem' }}>
						Video Thumbnail
					</Typography>
				</Box>
				<CustomDialog
					openModal={isVideoPlayerOpen}
					closeModal={() => {
						setIsVideoPlayerOpen(false);
					}}
					dialogPaperSx={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
					<ReactPlayer url={singleLessonBeforeSave?.videoUrl} height='30rem' width='55rem' style={{ margin: '0.5rem' }} controls={true} />
				</CustomDialog>
			</Box>
			<Box sx={{ display: 'flex' }}>
				<Box>
					<CustomSubmitButton
						sx={{
							visibility: isEditMode ? 'hidden' : 'visible',
						}}
						onClick={handlePublishing}>
						{isActive ? 'Unpublish' : 'Publish'}
					</CustomSubmitButton>
				</Box>
				<Snackbar
					open={isMissingFieldMsgOpen}
					autoHideDuration={3000}
					anchorOrigin={{ vertical, horizontal }}
					sx={{ mt: '14rem' }}
					onClose={() => setIsMissingFieldMsgOpen(false)}>
					<Alert severity='error' variant='filled' sx={{ width: '100%' }}>
						Fill the required field(s)
					</Alert>
				</Snackbar>
				{isEditMode ? (
					<Box>
						<CustomSubmitButton
							onClick={(e) => {
								if (singleLessonBeforeSave?.title.trim() !== '' && singleLessonBeforeSave?.title !== '') {
									setIsEditMode(false);
									handleLessonUpdate(e as FormEvent<Element>);
								} else {
									setIsMissingField(true);
									setIsMissingFieldMsgOpen(true);
								}
							}}>
							Save
						</CustomSubmitButton>
						<CustomCancelButton
							onClick={() => {
								setIsEditMode(false);
								setIsLessonUpdated(false);
								setResetChanges(!resetChanges);
								setSingleLessonBeforeSave(singleLesson);
								setIsQuestionUpdated((prevData: QuestionUpdateTrack[]) => {
									prevData = prevData.map((data) => {
										return { ...data, isUpdated: false };
									});
									return prevData;
								});
							}}>
							Cancel
						</CustomCancelButton>
					</Box>
				) : (
					<Box sx={{ ml: '1rem' }}>
						<Tooltip title='Edit Lesson' placement='top'>
							<IconButton
								onClick={() => {
									setIsEditMode(true);
								}}>
								<Edit />
							</IconButton>
						</Tooltip>
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default LessonEditorBox;
