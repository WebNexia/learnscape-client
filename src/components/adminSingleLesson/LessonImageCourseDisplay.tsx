import { Box, Typography } from '@mui/material';
import ReactPlayer from 'react-player';
import { Lesson } from '../../interfaces/lessons';
import CustomDialog from '../layouts/dialog/CustomDialog';
import { useState } from 'react';

interface LessonImageCourseDisplayProps {
	singleLesson: Lesson;
}

const LessonImageCourseDisplay = ({ singleLesson }: LessonImageCourseDisplayProps) => {
	const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState<boolean>(false);

	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				width: '90%',
			}}>
			<Box sx={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
				<Box sx={{ height: '8rem', width: '12rem', mr: '2rem' }}>
					<img
						src={singleLesson.imageUrl ? singleLesson.imageUrl : 'https://directmobilityonline.co.uk/assets/img/noimage.png'}
						alt='lesson_img'
						height='100%'
						width='100%'
						style={{
							borderRadius: '0.2rem',
							boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
						}}
					/>

					<Typography variant='body2' sx={{ mt: '0.35rem' }}>
						Lesson Image
					</Typography>
				</Box>
				<Box sx={{ height: '8rem', width: '12rem', cursor: 'pointer' }}>
					{singleLesson?.videoUrl ? (
						<Box
							sx={{
								height: '100%',
								width: '100%',
								position: 'relative',
							}}
							onClick={() => {
								if (singleLesson?.videoUrl) {
									setIsVideoPlayerOpen(true);
								}
							}}>
							<ReactPlayer
								url={singleLesson?.videoUrl}
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
									if (singleLesson?.videoUrl) {
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
					<ReactPlayer url={singleLesson?.videoUrl} height='30rem' width='55rem' style={{ margin: '0.5rem' }} controls={true} />
				</CustomDialog>
			</Box>
		</Box>
	);
};

export default LessonImageCourseDisplay;
