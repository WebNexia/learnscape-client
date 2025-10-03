import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useState } from 'react';
import StickyTabLayout from '../components/layouts/StickyTabLayout';
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

	// Tab configuration
	const tabs = [
		{ value: 'Courses', label: 'Courses' },
		{ value: 'Lessons', label: 'Lessons' },
		{ value: 'Questions', label: 'Questions' },
		{ value: 'Documents', label: 'Documents' },
	];

	return (
		<RecycleBinCoursesProvider>
			<RecycleBinLessonsProvider>
				<RecycleBinQuestionsProvider>
					<RecycleBinDocumentsProvider>
						<DashboardPagesLayout pageName='Recycle Bin' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
							<StickyTabLayout activeTab={value} onTabChange={handleChange} tabs={tabs} isSticky={true}>
								{value === 'Courses' && <AdminRecycleBinCoursesTab />}
								{value === 'Lessons' && <AdminRecycleBinLessonsTab />}
								{value === 'Questions' && <AdminRecycleBinQuestionsTab />}
								{value === 'Documents' && <AdminRecycleBinDocumentsTab />}
							</StickyTabLayout>
						</DashboardPagesLayout>
					</RecycleBinDocumentsProvider>
				</RecycleBinQuestionsProvider>
			</RecycleBinLessonsProvider>
		</RecycleBinCoursesProvider>
	);
};

export default AdminRecycleBin;
