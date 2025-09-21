import { useParams } from 'react-router-dom';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import { useContext, useEffect, useState } from 'react';
import { AllPublicCoursesContext } from '../contexts/AllPublicCoursesContextProvider';
import { SingleCourse } from '../interfaces/course';
import { Box, Card, CardContent, Typography, Avatar, Chip, Stack, IconButton } from '@mui/material';
import CoursePageBanner from '../components/layouts/coursePageBanner/CoursePageBanner';
import ChatWhatsApp from '../components/landingPage/ChatWhatsApp';
import { LinkedIn, Language } from '@mui/icons-material';
import theme from '../themes';
import ScrollToTopButton from '../components/landingPage/ScrollToTopButton';

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
				width: { xs: '85%', sm: '60%', md: '30vw' },
				maxWidth: '35rem',
				minHeight: '15rem',
				height: { xs: 'auto', sm: 'auto', md: 'auto', lg: '48vh' },
				maxHeight: { md: '480px' },
				borderRadius: '0.5rem',
				boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
				background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
				transition: 'transform 0.2s ease-in-out',
				display: 'flex', // ✅ ensures flexible layout inside
				flexDirection: 'column',
				mt: { xs: '-1rem', sm: '-1rem', md: '1rem' },
				justifyContent: 'space-between',
				position: 'relative',
			}}>
			<CardContent sx={{ p: 3, flexGrow: 1 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
					<Avatar
						src={instructor.imageUrl}
						alt={instructor.name}
						sx={{
							width: { xs: '4.5rem', sm: '5.5rem' },
							height: { xs: '4.5rem', sm: '5.5rem' },
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

				<Typography variant='body2' color='text.secondary' sx={{ mb: 2, fontFamily: 'Varela Round', fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
					{instructor.bio}
				</Typography>

				<Stack direction='row' spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
					{instructor.expertise?.map((skill, index) => (
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

				<Box
					sx={{
						display: 'flex',
						justifyContent: 'flex-end',
						gap: { xs: 0.25, sm: 0.25 },
						mt: 'auto',
						mb: '-1.25rem',
						mr: '-1.25rem',
						position: 'absolute',
						bottom: '1.5rem',
						right: '1.5rem',
					}}>
					<IconButton
						href={formatUrl(instructor.linkedInUrl)}
						target='_blank'
						sx={{
							'color': theme.palette.primary.main,
							'&:hover': { backgroundColor: theme.palette.primary.light, color: '#fff' },
						}}>
						<LinkedIn fontSize='small' />
					</IconButton>

					<IconButton
						href={formatUrl(instructor.website)}
						target='_blank'
						sx={{
							'color': theme.palette.primary.main,
							'&:hover': { backgroundColor: theme.palette.primary.light, color: '#fff' },
						}}>
						<Language fontSize='small' />
					</IconButton>
				</Box>
			</CardContent>
		</Card>
	);
};

const LandingPageCourse = () => {
	const { courseId } = useParams();
	const { courses, loading, error } = useContext(AllPublicCoursesContext);

	const [course, setCourse] = useState<SingleCourse>();

	useEffect(() => {
		if (courseId && courses) {
			const selectedCourse = courses?.find((course: SingleCourse) => course._id === courseId);
			setCourse(selectedCourse);
		}
	}, [courseId, courses]);

	return (
		<LandingPageLayout>
			{!loading && !error && course && (
				<Box
					sx={{
						display: 'flex',
						flexDirection: { xs: 'column', sm: 'column', md: 'row' },
						justifyContent: 'center',
						alignItems: 'center',
						width: '100%',
						paddingTop: '13vh',
						gap: '2rem',
						flexWrap: { xs: 'wrap', md: 'nowrap' },
					}}>
					<CoursePageBanner course={course} fromHomePage={true} />
					<InstructorCard instructor={course.instructor} />
				</Box>
			)}

			{!loading && !error && !course && (
				<Box sx={{ paddingTop: '25vh', textAlign: 'center' }}>
					<Typography variant='h6' sx={{ fontFamily: 'Varela Round' }}>
						Kurs bulunamadı
					</Typography>
				</Box>
			)}
			<Box sx={{ margin: '1rem 0 3rem 0' }}>
				<ChatWhatsApp />
				<ScrollToTopButton />
			</Box>
		</LandingPageLayout>
	);
};

export default LandingPageCourse;
