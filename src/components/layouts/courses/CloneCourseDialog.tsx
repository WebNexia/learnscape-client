import { DialogContent, Typography } from '@mui/material';
import CustomDialog from '../dialog/CustomDialog';
import CustomDialogActions from '../dialog/CustomDialogActions';
import { useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { SingleCourse } from '../../../interfaces/course';

interface CloneCourseDialogProps {
	isCourseCloneModalOpen?: boolean[];
	index?: number;
	closeCloneCourseModal?: (index: number) => void;
	isCloning?: boolean;
	handleClone?: (courseId: string, index: number) => Promise<void>;
	course?: SingleCourse;
	isCloneCourseDialogOpen?: boolean;
	setIsCloneCourseDialogOpen?: (value: React.SetStateAction<boolean>) => void;
	cloneCourse?: () => Promise<void>;
}

const CloneCourseDialog = ({
	isCourseCloneModalOpen,
	index,
	closeCloneCourseModal,
	isCloning,
	handleClone,
	course,
	isCloneCourseDialogOpen,
	setIsCloneCourseDialogOpen,
	cloneCourse,
}: CloneCourseDialogProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	return (
		<CustomDialog
			openModal={isCourseCloneModalOpen?.[index ?? 0] || isCloneCourseDialogOpen}
			closeModal={() => (index !== undefined && closeCloneCourseModal?.(index)) || setIsCloneCourseDialogOpen?.(false)}
			title='Clone Course'
			content='Are you sure you want to clone the course?'
			maxWidth='sm'>
			<DialogContent sx={{ mt: '-0.75rem' }}>
				<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
					Cloning this course will:
				</Typography>
				<ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
					<li>
						<Typography variant='body2' sx={{ mb: '0.25rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
							Create a new course with a copy of all its chapters, lessons, questions, and documents
						</Typography>
					</li>
					<li>
						<Typography variant='body2' sx={{ mb: '0.25rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
							Preserve the original course and its content without any changes
						</Typography>
					</li>
					<li>
						<Typography variant='body2' sx={{ mb: '0.25rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
							Allow you to safely edit the new course without affecting previous versions
						</Typography>
					</li>
					<li>
						<Typography variant='body2' sx={{ mb: '0.25rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
							Keep the original pricing for all currencies
						</Typography>
					</li>
					<li>
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
							Mark the cloned course as unpublished by default
						</Typography>
					</li>
				</ul>
				<Typography variant='body2' sx={{ marginTop: '1rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
					You can customize the cloned course (including pricing) before publishing it.
				</Typography>
			</DialogContent>

			<CustomDialogActions
				onCancel={() => (index !== undefined && closeCloneCourseModal?.(index)) || setIsCloneCourseDialogOpen?.(false)}
				submitBtnText={isCloning ? 'Cloning...' : 'Clone'}
				onSubmit={() => {
					if (cloneCourse && isCloneCourseDialogOpen) {
						cloneCourse();
					} else if (handleClone && index !== undefined && course?._id) {
						handleClone(course._id, index);
					}
				}}
			/>
		</CustomDialog>
	);
};

export default CloneCourseDialog;
