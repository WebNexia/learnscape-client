import { Avatar, Box, IconButton, Link, Tooltip, Typography } from '@mui/material';
import theme from '../../themes';
import { SingleCourse } from '../../interfaces/course';

import { ChapterLessonData } from '../../pages/AdminCourseEditPage';
import { EditTwoTone } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { dateFormatter } from '../../utils/dateFormatter';
import NoContentBoxAdmin from '../layouts/noContentBox/NoContentBoxAdmin';
import { setCurrencySymbol } from '../../utils/setCurrencySymbol';
import UKFlag from '../../assets/uk_flag_icon_round.svg.png';
import USFlag from '../../assets/usa_flag_united_states_america_icon_228698.png';
import EUFlag from '../../assets/european_flag_icon_228671.png';
import TRFlag from '../../assets/tr-flag-round-500.png';
import EditInstructorDialog from './EditInstructorDialog';
import { useState } from 'react';
import { truncateText } from '@utils/utilText';

interface CourseDetailsNonEditBoxProps {
	singleCourse?: SingleCourse;
	chapters: ChapterLessonData[];
	setSingleCourse: React.Dispatch<React.SetStateAction<SingleCourse | undefined>>;
}

const CourseDetailsNonEditBox = ({ singleCourse, chapters, setSingleCourse }: CourseDetailsNonEditBoxProps) => {
	const { userId } = useParams();

	const [isEditInstructorDialogOpen, setIsEditInstructorDialogOpen] = useState<boolean>(false);

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'flex-start',
				width: '90%',
			}}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', gap: '2rem' }}>
				<Box
					sx={{
						mt: '1rem',
						padding: '1rem',
						height: '7.25rem',
						boxShadow: '0 0 0.4rem 0.2rem rgba(0,0,0,0.2)',
						flex: 1,
						borderRadius: '0.35rem',
					}}>
					<Typography variant='h6'>Instructor</Typography>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', mt: '0.5rem' }}>
						<Avatar src={singleCourse?.instructor?.imageUrl} sx={{ width: '2rem', height: '2rem', objectFit: 'cover' }} />
						<Typography
							variant='body2'
							sx={{
								'textTransform': 'capitalize',
								'cursor': 'pointer',
								':hover': { textDecoration: 'underline' },
								'display': 'flex',
								'alignItems': 'center',
								'gap': '0.5rem',
							}}
							onClick={() => setIsEditInstructorDialogOpen(true)}>
							{singleCourse?.instructor?.name} <EditTwoTone fontSize='small' />
						</Typography>
					</Box>
					<EditInstructorDialog
						isEditInstructorDialogOpen={isEditInstructorDialogOpen}
						setIsEditInstructorDialogOpen={setIsEditInstructorDialogOpen}
						singleCourse={singleCourse}
						setSingleCourse={setSingleCourse}
					/>
				</Box>
				<Box
					sx={{
						mt: '1rem',
						padding: '1rem',
						height: '7.25rem',
						boxShadow: '0 0 0.4rem 0.2rem rgba(0,0,0,0.2)',
						flex: 3,
						borderRadius: '0.35rem',
					}}>
					<Typography variant='h6'>Description</Typography>
					<Typography variant='body2' sx={{ mt: '0.5rem' }}>
						{truncateText(singleCourse?.description || '', 200)}
					</Typography>
				</Box>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'flex-end',
						mt: '1rem',
						padding: '0 0 2rem 0rem',
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
					alignItems: 'flex-start',
					padding: '2rem',
					boxShadow: '0 0 0.4rem 0.2rem rgba(0,0,0,0.2)',
					borderRadius: '0.35rem',
				}}>
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
					<Typography variant='h6'>Prices</Typography>

					<Box sx={{ display: 'flex', mt: '0.5rem' }}>
						{singleCourse?.prices?.map((price) => {
							return (
								<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: '2rem' }} key={price.currency}>
									<Typography variant='body2'>
										{price.amount !== 'Free' && price.amount !== '0' && price.amount !== '' ? setCurrencySymbol(price.currency) : ''}
										{price.amount === 'Free' || price.amount === '0' || price.amount === '' ? 'Free' : price.amount}
									</Typography>
									<img
										src={
											price.currency === 'gbp'
												? UKFlag
												: price.currency === 'usd'
													? USFlag
													: price.currency === 'eur'
														? EUFlag
														: price.currency === 'try'
															? TRFlag
															: undefined
										}
										alt='flag'
										style={{ height: '2rem', width: '2rem', borderRadius: '50%', marginTop: '0.35rem' }}
									/>
								</Box>
							);
						})}
					</Box>
				</Box>
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
					<Typography variant='h6'>Starting Date</Typography>
					<Typography variant='body2' sx={{ mt: '1.5rem' }}>
						{dateFormatter(singleCourse?.startingDate) || 'N/A'}
					</Typography>
				</Box>
				<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
					<Typography variant='h6'>Weeks</Typography>
					<Typography variant='body2' sx={{ mt: '1.5rem' }}>
						{singleCourse?.durationWeeks || 'N/A'}
					</Typography>
				</Box>
				<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
					<Typography variant='h6'>Hours</Typography>
					<Typography variant='body2' sx={{ mt: '1.5rem' }}>
						{singleCourse?.durationHours || 'N/A'}
					</Typography>
				</Box>
			</Box>

			{!singleCourse?.courseManagement.isExternal && (
				<Box sx={{ mt: '4rem', minHeight: '40vh' }}>
					<Typography variant='h5' sx={{ mb: '2.25rem', fontWeight: '600' }}>
						CHAPTERS
					</Typography>
					{singleCourse?.chapterIds?.length === 0 ? (
						<NoContentBoxAdmin content='No chapter for this course' />
					) : (
						<>
							{singleCourse &&
								singleCourse?.chapters &&
								chapters?.map((chapter) => {
									return (
										<Box key={chapter.chapterId} sx={{ margin: '1rem 0 3rem 0' }}>
											<Box display='flex'>
												<Typography variant='h6' sx={{ mb: '0rem' }}>
													{chapter.title}
												</Typography>
											</Box>
											{chapter &&
												chapter?.lessons &&
												chapter?.lessons?.length !== 0 &&
												chapter?.lessons
													?.filter((lesson) => lesson !== null)
													.map((lesson) => {
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
																		<Typography variant='body2'>{lesson?.title}</Typography>
																	</Box>
																	<Box sx={{ flex: 1 }}>
																		<Typography variant='body2'>{lesson?.isActive ? 'Published' : 'Unpublished'}</Typography>
																	</Box>
																	<Box
																		sx={{
																			display: 'flex',
																			justifyContent: 'flex-end',
																			alignItems: 'center',
																			flex: 4,
																		}}>
																		<Box sx={{ mr: '1rem' }}>
																			<Typography variant='body2'>{lesson?.type}</Typography>
																		</Box>
																		<Box>
																			<Tooltip title='Edit Lesson' placement='top'>
																				<IconButton
																					onClick={() => {
																						window.open(`/admin/lesson-edit/user/${userId}/lesson/${lesson._id}`, '_blank');
																						window.scrollTo({ top: 0, behavior: 'smooth' });
																					}}>
																					<EditTwoTone fontSize='small' />
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
			)}
			{!singleCourse?.courseManagement.isExternal && (
				<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', width: '100%', mb: '4rem' }}>
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
			)}
		</Box>
	);
};

export default CourseDetailsNonEditBox;
