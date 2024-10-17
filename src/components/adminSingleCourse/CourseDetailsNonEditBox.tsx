import { Box, IconButton, Link, Tooltip, Typography } from '@mui/material';
import theme from '../../themes';
import { SingleCourse } from '../../interfaces/course';

import { ChapterLessonData } from '../../pages/AdminCourseEditPage';
import { EditTwoTone } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { dateFormatter } from '../../utils/dateFormatter';
import NoContentBoxAdmin from '../layouts/noContentBox/NoContentBoxAdmin';

interface CourseDetailsNonEditBoxProps {
	singleCourse?: SingleCourse;
	chapters: ChapterLessonData[];
}

const CourseDetailsNonEditBox = ({ singleCourse, chapters }: CourseDetailsNonEditBoxProps) => {
	const { userId } = useParams();
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'flex-start',
				width: '90%',
			}}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
				<Box
					sx={{
						mt: '3rem',
						padding: '2rem',
						boxShadow: '0 0 0.4rem 0.2rem rgba(0,0,0,0.2)',
						flex: 3,
						borderRadius: '0.35rem',
					}}>
					<Typography variant='h5'>Description</Typography>
					<Typography variant='body2' sx={{ mt: '0.5rem' }}>
						{singleCourse?.description}
					</Typography>
				</Box>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'flex-end',
						mt: '3rem',
						padding: '0 0 2rem 2rem',
						flex: 1,
					}}>
					<Box sx={{ textAlign: 'center' }}>
						<img
							src={singleCourse?.imageUrl || 'https://directmobilityonline.co.uk/assets/img/noimage.png'}
							alt='course_img'
							height='115rem'
							style={{
								borderRadius: '0.2rem',
								boxShadow: '0 0 0.4rem 0.2rem rgba(0,0,0,0.2)',
							}}
						/>
						<Box>
							<Typography variant='body2' sx={{ mt: '0.25rem' }}>
								Cover Image
							</Typography>
						</Box>
					</Box>
				</Box>
			</Box>

			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					mt: '2rem',
					padding: '2rem',
					boxShadow: '0 0 0.4rem 0.2rem rgba(0,0,0,0.2)',
					borderRadius: '0.35rem',
				}}>
				<Box sx={{ textAlign: 'center' }}>
					<Typography variant='h5'>Price</Typography>
					<Typography variant='body2' sx={{ mt: '0.5rem' }}>
						{singleCourse?.priceCurrency}
						{singleCourse?.price}
					</Typography>
				</Box>
				<Box sx={{ textAlign: 'center' }}>
					<Typography variant='h5'>Starting Date</Typography>
					<Typography variant='body2' sx={{ mt: '0.5rem' }}>
						{dateFormatter(singleCourse?.startingDate)}
					</Typography>
				</Box>
				<Box sx={{ textAlign: 'center' }}>
					<Typography variant='h5'>Weeks</Typography>
					<Typography variant='body2' sx={{ mt: '0.5rem' }}>
						{singleCourse?.durationWeeks}
					</Typography>
				</Box>
				<Box sx={{ textAlign: 'center' }}>
					<Typography variant='h5'>Hours</Typography>
					<Typography variant='body2' sx={{ mt: '0.5rem' }}>
						{singleCourse?.durationHours}
					</Typography>
				</Box>
			</Box>
			<Box sx={{ mt: '6rem', minHeight: '40vh' }}>
				<Typography variant='h5' sx={{ mb: '2.25rem' }}>
					CHAPTERS
				</Typography>
				{singleCourse?.chapterIds?.length === 0 ? (
					<NoContentBoxAdmin content='No chapter for this course' />
				) : (
					<>
						{singleCourse &&
							singleCourse.chapters &&
							chapters?.map((chapter) => {
								return (
									<Box key={chapter.chapterId} sx={{ margin: '1rem 0 3rem 0' }}>
										<Box display='flex'>
											<Typography variant='h6' sx={{ mb: '0rem' }}>
												{chapter.title}
											</Typography>
										</Box>
										{chapter &&
											chapter.lessons &&
											chapter.lessons.length !== 0 &&
											chapter.lessons.map((lesson) => {
												return (
													<Box
														key={lesson._id}
														sx={{
															display: 'flex',
															alignItems: 'center',
															height: '3rem',
															width: '100%',
															backgroundColor: theme.bgColor?.common,
															margin: '1rem 0',
															borderRadius: '0.25rem',
															boxShadow: '0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)',
														}}>
														<Box
															sx={{
																height: '3rem',
																width: '4rem',
															}}>
															<img
																src={lesson?.imageUrl || 'https://directmobilityonline.co.uk/assets/img/noimage.png'}
																alt='lesson_img'
																height='100%'
																width='100%'
																style={{
																	borderRadius: '0.25rem 0 0 0.25rem',
																}}
															/>
														</Box>
														<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', margin: '0 1rem' }}>
															<Box sx={{ flex: 4 }}>
																<Typography variant='body2'>{lesson.title}</Typography>
															</Box>
															<Box sx={{ flex: 1 }}>
																<Typography variant='body2'>{lesson.isActive ? 'Published' : 'Unpublished'}</Typography>
															</Box>
															<Box
																sx={{
																	display: 'flex',
																	justifyContent: 'flex-end',
																	alignItems: 'center',
																	flex: 4,
																}}>
																<Box sx={{ mr: '1rem' }}>
																	<Typography variant='body2'>{lesson.type}</Typography>
																</Box>
																<Box>
																	<Tooltip title='Edit Lesson' placement='top'>
																		<IconButton
																			onClick={() => {
																				window.open(`/admin/lesson-edit/user/${userId}/lesson/${lesson._id}`, '_blank');
																				window.scrollTo({ top: 0, behavior: 'smooth' });
																			}}>
																			<EditTwoTone />
																		</IconButton>
																	</Tooltip>
																</Box>
															</Box>
														</Box>
													</Box>
												);
											})}
									</Box>
								);
							})}
					</>
				)}
			</Box>
			<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', width: '100%', margin: '2rem 0 4rem 0' }}>
				<Box sx={{ mb: '1.25rem' }}>
					<Typography variant='h5'>Course Materials</Typography>
				</Box>
				{singleCourse?.documents?.filter((doc) => doc !== null).length !== 0 ? (
					<Box>
						{singleCourse?.documents
							?.filter((doc) => doc !== null)
							?.map((doc) => (
								<Box sx={{ mb: '0.5rem' }} key={doc._id}>
									<Link href={doc?.documentUrl} target='_blank' rel='noopener noreferrer' variant='body2'>
										{doc?.name}
									</Link>
								</Box>
							))}
					</Box>
				) : (
					<NoContentBoxAdmin content='No material for this course' />
				)}
			</Box>
		</Box>
	);
};

export default CourseDetailsNonEditBox;
