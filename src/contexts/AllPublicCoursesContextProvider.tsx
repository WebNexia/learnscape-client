import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { OrganisationContext } from './OrganisationContextProvider';
import { SingleCourse } from '../interfaces/course';
import { useLocation } from 'react-router-dom';

interface AllPublicCoursesContextTypes {
	courses: SingleCourse[];
	loading: boolean;
	error: string | null;
	total: number;
	hasMore: boolean;
	loadMore: () => void;
	// Search and filter functionality
	searchValue: string;
	setSearchValue: (value: string) => void;
	activeFilter: string;
	setActiveFilter: (filter: string) => void;
	searchedValue: string;
	onSearch: (searchTerm?: string) => void;
	onReset: () => void;
	onRemoveSearch: () => void;
	isSearching: boolean;
}

interface AllPublicCoursesContextProviderProps {
	children: ReactNode;
}

export const AllPublicCoursesContext = createContext<AllPublicCoursesContextTypes>({
	courses: [],
	loading: false,
	error: null,
	total: 0,
	hasMore: false,
	loadMore: () => {},
	searchValue: '',
	setSearchValue: () => {},
	activeFilter: '',
	setActiveFilter: () => {},
	searchedValue: '',
	onSearch: () => {},
	onReset: () => {},
	onRemoveSearch: () => {},
	isSearching: false,
});

const AllPublicCoursesContextProvider = (props: AllPublicCoursesContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const location = useLocation();

	// Check if we're on any landing page route (courses page or individual course page)
	// Exclude logged-in user course routes that contain '/userCourseId/'
	const isLandingPageRoute =
		location.pathname === '/landing-page-courses' ||
		(location.pathname.startsWith('/landing-page-course/') && !location.pathname?.includes('/userCourseId/'));

	// State for pagination
	const [currentPage, setCurrentPage] = useState(1);
	const [allCourses, setAllCourses] = useState<SingleCourse[]>([]);

	// State for search and filters
	const [searchValue, setSearchValue] = useState('');
	const [activeFilter, setActiveFilter] = useState<string>('');
	const [searchedValue, setSearchedValue] = useState<string>('');
	const [isSearching, setIsSearching] = useState(false);

	const getUserCurrency = () => {
		// Get user's country from URL or default to US
		const country = new URLSearchParams(location.search).get('country') || 'US';

		switch (country.toUpperCase()) {
			case 'GB':
				return 'gbp';
			case 'TR':
				return 'try';
			case 'EU':
				return 'eur';
			default:
				return 'usd';
		}
	};

	const fetchCourses = async () => {
		if (!orgId) return { data: [], total: 0 };

		try {
			// Build query parameters
			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: '25',
				currency: getUserCurrency(),
			});

			// Add search parameter if provided
			if (searchedValue.trim()) {
				params.append('search', searchedValue.trim());
			}

			// Add filter parameter if provided
			if (activeFilter) {
				params.append('filters', activeFilter);
			}

			const finalUrl = `${base_url}/courses/public/${orgId}?${params.toString()}`;
			const response = await axios.get(finalUrl);
			return response.data;
		} catch (error: any) {
			console.error('Error fetching courses:', error);
			throw error;
		}
	};

	const {
		data: coursesData,
		isLoading,
		isError,
	} = useQuery(['landingPageCourses', orgId, currentPage, searchedValue, activeFilter, location.search], fetchCourses, {
		enabled: !!orgId && isLandingPageRoute,
		staleTime: 5 * 60 * 1000, // 5 minutes
		cacheTime: 30 * 60 * 1000, // 30 minutes
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

	// Update allCourses when coursesData changes
	useEffect(() => {
		if (coursesData) {
			if (currentPage === 1) {
				// First page - replace all courses
				setAllCourses(coursesData.data || []);
			} else {
				// Subsequent pages - append courses
				setAllCourses((prev) => [...prev, ...(coursesData.data || [])]);
			}
			// Set isSearching to false when data is loaded
			setIsSearching(false);
		}
	}, [coursesData, currentPage]);

	const loadMore = () => {
		if (coursesData && allCourses && allCourses.length < coursesData.total) {
			setCurrentPage((prev) => prev + 1);
		}
	};

	// Search and reset functions
	const onSearch = (searchTerm?: string) => {
		const termToSearch = searchTerm || searchValue;

		// If there's no search term, don't trigger search
		if (!termToSearch.trim()) {
			return;
		}

		// If the search term is the same as the current searched value, don't trigger search again
		if (termToSearch.trim() === searchedValue) {
			return;
		}

		setIsSearching(true);
		setSearchedValue(termToSearch.trim()); // Store the searched value

		// Don't clear searchValue - keep it in input like admin pages
		setCurrentPage(1); // Reset to first page
		setAllCourses([]); // Clear existing courses
		// The useQuery will automatically refetch due to dependency changes
	};

	const onReset = () => {
		setSearchValue('');
		setActiveFilter('');
		setSearchedValue('');
		setIsSearching(false);
		setCurrentPage(1);
		// Don't clear allCourses immediately - let the new query results replace them
		// The useQuery will automatically refetch due to dependency changes
	};

	const onRemoveSearch = () => {
		setSearchValue(''); // Clear the search input
		setSearchedValue(''); // Clear the searched value
		setCurrentPage(1);
		setAllCourses([]);
		// The useQuery will automatically refetch due to dependency changes
	};

	// Calculate if there are more courses to load
	const hasMore = coursesData ? allCourses && allCourses.length < coursesData.total : false;
	const total = coursesData?.total || 0;

	return (
		<AllPublicCoursesContext.Provider
			value={{
				courses: allCourses,
				loading: isLoading,
				error: isError ? 'Failed to fetch courses' : null,
				total,
				hasMore,
				loadMore,
				searchValue,
				setSearchValue,
				activeFilter,
				setActiveFilter,
				searchedValue,
				onSearch,
				onReset,
				onRemoveSearch,
				isSearching,
			}}>
			{props.children}
		</AllPublicCoursesContext.Provider>
	);
};

export default AllPublicCoursesContextProvider;
