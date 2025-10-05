import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useState } from 'react';
import StickyTabLayout from '../components/layouts/StickyTabLayout';
import { RecycleBinQuestionsProvider } from '../contexts/RecycleBinQuestionsContextProvider';
import { RecycleBinDocumentsProvider } from '../contexts/RecycleBinDocumentsContextProvider';
import AdminRecycleBinQuestionsTab from '../components/layouts/recycleBin/AdminRecycleBinQuestionsTab';
import AdminRecycleBinDocumentsTab from '../components/layouts/recycleBin/AdminRecycleBinDocumentsTab';

const AdminRecycleBin = () => {
	const [value, setValue] = useState<string>('Questions');
	const handleChange = (_: React.SyntheticEvent, newValue: string) => {
		setValue(newValue);
	};

	// Tab configuration - only Questions and Documents
	const tabs = [
		{ value: 'Questions', label: 'Questions' },
		{ value: 'Documents', label: 'Documents' },
	];

	return (
		<RecycleBinQuestionsProvider>
			<RecycleBinDocumentsProvider>
				<DashboardPagesLayout pageName='Recycle Bin' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
					<StickyTabLayout activeTab={value} onTabChange={handleChange} tabs={tabs} isSticky={true}>
						{value === 'Questions' && <AdminRecycleBinQuestionsTab />}
						{value === 'Documents' && <AdminRecycleBinDocumentsTab />}
					</StickyTabLayout>
				</DashboardPagesLayout>
			</RecycleBinDocumentsProvider>
		</RecycleBinQuestionsProvider>
	);
};

export default AdminRecycleBin;
