import { Box, Tab, Tabs } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useState } from 'react';
import theme from '../themes';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import AdminRecycleBinCoursesTab from '../components/layouts/recycleBin/AdminRecycleBinCoursesTab';

import { RecycleBinCoursesProvider } from '../contexts/RecycleBinCoursesContextProvider';
import { RecycleBinLessonsProvider } from '../contexts/RecycleBinLessonsContextProvider';
import { RecycleBinQuestionsProvider } from '../contexts/RecycleBinQuestionsContextProvider';
import { RecycleBinDocumentsProvider } from '../contexts/RecycleBinDocumentsContextProvider';
import AdminRecycleBinLessonsTab from '../components/layouts/recycleBin/AdminRecycleBinLessonsTab';
import AdminRecycleBinQuestionsTab from '../components/layouts/recycleBin/AdminRecycleBinQuestionsTab';
import AdminRecycleBinDocumentsTab from '../components/layouts/recycleBin/AdminRecycleBinDocumentsTab';

const AdminRecycleBin = () => {
	const [value, setValue] = useState<string>('Courses');
	const handleChange = (_: React.SyntheticEvent, newValue: string) => {
		setValue(newValue);
	};

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	return (
		<RecycleBinCoursesProvider>
			<RecycleBinLessonsProvider>
				<RecycleBinQuestionsProvider>
					<RecycleBinDocumentsProvider>
						<DashboardPagesLayout pageName='Recycle Bin' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
							<Box>
								<Tabs
									value={value}
									onChange={handleChange}
									textColor='primary'
									indicatorColor='secondary'
									sx={{
										'paddingTop': isMobileSize ? '0.75rem' : '1.5rem',
										'& .MuiTabs-indicator': {
											backgroundColor: theme.bgColor?.adminHeader, // Custom indicator color
										},
									}}>
									<Tab
										value='Courses'
										label='Courses'
										sx={{
											'&.Mui-selected': { color: theme.bgColor?.adminHeader },
											'textTransform': 'capitalize',
											'fontFamily': 'Poppins',
											'fontSize': isMobileSize ? '0.75rem' : undefined,
											'&.MuiTab-root': { textTransform: 'capitalize' }, // Ensure capitalization
										}}
									/>
									<Tab
										value='Lessons'
										label='Lessons'
										sx={{
											'&.Mui-selected': { color: theme.bgColor?.adminHeader },
											'textTransform': 'capitalize',
											'fontFamily': 'Poppins',
											'fontSize': isMobileSize ? '0.75rem' : undefined,
											'&.MuiTab-root': { textTransform: 'capitalize' }, // Ensure capitalization
										}}
									/>
									<Tab
										value='Questions'
										label='Questions'
										sx={{
											'&.Mui-selected': { color: theme.bgColor?.adminHeader },
											'textTransform': 'capitalize',
											'fontFamily': 'Poppins',
											'fontSize': isMobileSize ? '0.75rem' : undefined,
											'&.MuiTab-root': { textTransform: 'capitalize' }, // Ensure capitalization
										}}
									/>
									<Tab
										value='Documents'
										label='Documents'
										sx={{
											'&.Mui-selected': { color: theme.bgColor?.adminHeader },
											'textTransform': 'capitalize',
											'fontFamily': 'Poppins',
											'fontSize': isMobileSize ? '0.75rem' : undefined,
											'&.MuiTab-root': { textTransform: 'capitalize' }, // Ensure capitalization
										}}
									/>
								</Tabs>
							</Box>
							{value === 'Courses' && <AdminRecycleBinCoursesTab />}
							{value === 'Lessons' && <AdminRecycleBinLessonsTab />}
							{value === 'Questions' && <AdminRecycleBinQuestionsTab />}
							{value === 'Documents' && <AdminRecycleBinDocumentsTab />}
						</DashboardPagesLayout>
					</RecycleBinDocumentsProvider>
				</RecycleBinQuestionsProvider>
			</RecycleBinLessonsProvider>
		</RecycleBinCoursesProvider>
	);
};

export default AdminRecycleBin;
