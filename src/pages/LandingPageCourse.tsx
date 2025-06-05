import { useParams } from 'react-router-dom';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import { useContext, useEffect, useState } from 'react';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { SingleCourse } from '../interfaces/course';
import { Box, Card, CardContent, Typography, Avatar, Chip, Stack, IconButton } from '@mui/material';
import CoursePageBanner from '../components/layouts/coursePageBanner/CoursePageBanner';
import ChatWhatsApp from '../components/landingPage/ChatWhatsApp';
import { LinkedIn, Language } from '@mui/icons-material';
import theme from '../themes';

const InstructorCard = ({ instructor }: { instructor: SingleCourse['instructor'] }) => {
	// Ensure URLs have proper protocol
	const formatUrl = (url: string | undefined) => {
		if (!url) return '';
		if (url.startsWith('http://') || url.startsWith('https://')) return url;
		return `https://${url}`;
	};

	return (
		<Card
			sx={{
				'width': '30vw',
				'maxWidth': '400px',
				'height': '48vh',
				'borderRadius': '0.5rem',
				'boxShadow': '0 4px 20px rgba(0,0,0,0.1)',
				'background': 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
				'transition': 'transform 0.2s ease-in-out',
				'&:hover': {
					transform: 'translateY(-5px)',
				},
				'mt': '1rem',
				'position': 'relative',
			}}>
			<CardContent sx={{ p: 3, position: 'absolute', top: 0, bottom: '0', width: '100%' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
					<Avatar
						src={instructor.imageUrl}
						alt={instructor.name}
						sx={{
							width: 100,
							height: 100,
							border: '3px solid',
							borderColor: theme.palette.primary.main,
						}}
					/>
					<Box sx={{ ml: 2.5 }}>
						<Typography variant='h6' sx={{ fontWeight: 600, color: theme.palette.primary.main, fontFamily: 'Varela Round' }}>
							{instructor.name}
						</Typography>
						<Typography variant='subtitle2' color='text.secondary' sx={{ fontFamily: 'Varela Round' }}>
							{instructor.title}
						</Typography>
					</Box>
				</Box>

				<Typography variant='body2' color='text.secondary' sx={{ mb: 3, fontFamily: 'Varela Round' }}>
					{instructor.bio}
				</Typography>

				<Stack direction='row' spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
					{instructor.expertise.map((skill, index) => (
						<Chip
							key={index}
							label={skill}
							size='small'
							sx={{
								backgroundColor: theme.palette.primary.light,
								color: '#fff',
								fontWeight: 500,
								fontFamily: 'Varela Round',
								borderRadius: '0.35rem',
								fontSize: '0.7rem',
							}}
						/>
					))}
				</Stack>

				<Box sx={{ display: 'flex', gap: 1, position: 'absolute', bottom: '1rem', right: '1rem' }}>
					<IconButton
						href={formatUrl(instructor.linkedInUrl)}
						target='_blank'
						sx={{
							'color': theme.palette.primary.main,
							'&:hover': { backgroundColor: theme.palette.primary.light, color: '#fff' },
						}}>
						<LinkedIn />
					</IconButton>

					<IconButton
						href={formatUrl(instructor.website)}
						target='_blank'
						sx={{
							'color': theme.palette.primary.main,
							'&:hover': { backgroundColor: theme.palette.primary.light, color: '#fff' },
						}}>
						<Language />
					</IconButton>
				</Box>
			</CardContent>
		</Card>
	);
};

const LandingPageCourse = () => {
	const { courseId } = useParams();
	const { sortedPublicCoursesData } = useContext(CoursesContext);

	const [course, setCourse] = useState<SingleCourse>();

	useEffect(() => {
		if (courseId) {
			const selectedCourse = sortedPublicCoursesData.filter((course) => course._id === courseId)[0];
			setCourse(selectedCourse);
		}
	}, [courseId, sortedPublicCoursesData]);

	return (
		<LandingPageLayout>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					width: '100%',
					paddingTop: '13vh',
					gap: '3rem',
					flexWrap: { xs: 'wrap', md: 'nowrap' },
				}}>
				{course && (
					<>
						<CoursePageBanner course={course} fromHomePage={true} />
						<InstructorCard instructor={course.instructor} />
					</>
				)}
			</Box>
			<Box sx={{ margin: '1rem 0 3rem 0' }}>
				<ChatWhatsApp />
			</Box>
		</LandingPageLayout>
	);
};

export default LandingPageCourse;
