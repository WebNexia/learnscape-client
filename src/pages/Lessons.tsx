import { Box } from '@mui/material';
import CourseSection from '../components/CourseSection';

const Lessons = () => {
	const sampleLessons = [
		{
			id: 1,
			title: 'Section 1 - Lorem Ipsum',
			lessons: [
				{
					title: 'Lesson 1',
					topic: 'Job Interviews',
					imageUrl:
						'https://plus.unsplash.com/premium_photo-1679936310136-71330fad74b9?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
				},
				{
					title: 'Lesson 2',
					topic: 'Job Interviews',
					imageUrl:
						'https://plus.unsplash.com/premium_photo-1679936310136-71330fad74b9?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
				},
				{
					title: 'Lesson 3',
					topic: 'Job Interviews',
					imageUrl:
						'https://plus.unsplash.com/premium_photo-1679936310136-71330fad74b9?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
				},
				{
					title: 'Lesson 4',
					topic: 'Job Interviews',
					imageUrl:
						'https://plus.unsplash.com/premium_photo-1679936310136-71330fad74b9?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
				},
			],
		},
		{
			id: 2,
			title: 'Section 2 - Lorem Ipsum',
			lessons: [
				{
					title: 'Lesson 1',
					topic: 'Daily English',
					imageUrl:
						'https://plus.unsplash.com/premium_photo-1679936310136-71330fad74b9?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
				},
				{
					title: 'Lesson 2',
					topic: 'Daily English',
					imageUrl:
						'https://plus.unsplash.com/premium_photo-1679936310136-71330fad74b9?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
				},
				{
					title: 'Lesson 3',
					topic: 'Daily English',
					imageUrl:
						'https://plus.unsplash.com/premium_photo-1679936310136-71330fad74b9?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
				},
				{
					title: 'Lesson 4',
					topic: 'Daily English',
					imageUrl:
						'https://plus.unsplash.com/premium_photo-1679936310136-71330fad74b9?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
				},
				{
					title: 'Lesson 5',
					topic: 'Daily English',
					imageUrl:
						'https://plus.unsplash.com/premium_photo-1679936310136-71330fad74b9?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
				},
			],
		},
		{
			id: 3,
			title: 'Section 3 - Lorem Ipsum',
			lessons: [
				{
					title: 'Lesson 1',
					topic: 'Phrasal Verbs',
					imageUrl:
						'https://plus.unsplash.com/premium_photo-1679936310136-71330fad74b9?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
				},
				{
					title: 'Lesson 2',
					topic: 'Phrasal Verbs',
					imageUrl:
						'https://plus.unsplash.com/premium_photo-1679936310136-71330fad74b9?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
				},
				{
					title: 'Lesson 3',
					topic: 'Phrasal Verbs',
					imageUrl:
						'https://plus.unsplash.com/premium_photo-1679936310136-71330fad74b9?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
				},
				{
					title: 'Lesson 4',
					topic: 'Phrasal Verbs',
					imageUrl:
						'https://plus.unsplash.com/premium_photo-1679936310136-71330fad74b9?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
				},
				{
					title: 'Lesson 5',
					topic: 'Phrasal Verbs',
					imageUrl:
						'https://plus.unsplash.com/premium_photo-1679936310136-71330fad74b9?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
				},
				{
					title: 'Lesson 6',
					topic: 'Phrasal Verbs',
					imageUrl:
						'https://plus.unsplash.com/premium_photo-1679936310136-71330fad74b9?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
				},
				{
					title: 'Lesson 7',
					topic: 'Phrasal Verbs',
					imageUrl:
						'https://plus.unsplash.com/premium_photo-1679936310136-71330fad74b9?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
				},
			],
		},
	];
	return (
		<Box sx={{ width: '85%' }}>
			{sampleLessons.map((section) => {
				return <CourseSection key={section.id} section={section} />;
			})}
		</Box>
	);
};

export default Lessons;
