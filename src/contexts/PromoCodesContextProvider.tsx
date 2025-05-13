import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery } from 'react-query';

import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';
import { PromoCode } from '../interfaces/promoCode';

interface PromoCodesContextTypes {
	sortedPromoCodesData: PromoCode[];
	sortPromoCodesData: (property: keyof PromoCode, order: 'asc' | 'desc') => void;
	addNewPromoCode: (newPromoCode: any) => void;
	removePromoCode: (id: string) => void;
	updatePromoCode: (singlePromoCode: PromoCode) => void;
	// promoCodesNumberOfPages: number;
	// promoCodesPageNumber: number;
	// setPromoCodesPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchPromoCodes: () => void;
}

interface PromoCodesContextProviderProps {
	children: ReactNode;
}

export const PromoCodesContext = createContext<PromoCodesContextTypes>({
	sortedPromoCodesData: [],
	sortPromoCodesData: () => {},
	addNewPromoCode: () => {},
	removePromoCode: () => {},
	updatePromoCode: () => {},
	// promoCodesNumberOfPages: 1,
	// promoCodesPageNumber: 1,
	// setPromoCodesPageNumber: () => {},
	fetchPromoCodes: () => {},
});

const PromoCodesContextProvider = (props: PromoCodesContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { orgId } = useContext(OrganisationContext);

	const [sortedPromoCodesData, setSortedPromoCodesData] = useState<PromoCode[]>([]);
	// const [promoCodesNumberOfPages, setNumberOfPages] = useState<number>(1);
	// const [promoCodesPageNumber, setPromoCodesPageNumber] = useState<number>(1);

	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	const fetchPromoCodes = async () => {
		if (!orgId) return;
		try {
			const response = await axios.get(`${base_url}/promoCodes/organisation/${orgId}`);

			// Initial sorting when fetching data
			const sortedDataCopy = [...response.data.data].sort((a: PromoCode, b: PromoCode) => b.updatedAt.localeCompare(a.updatedAt));
			setSortedPromoCodesData(sortedDataCopy);
			// setNumberOfPages(response.data.pages);
			setIsLoaded(true);
			return response.data.data;
		} catch (error) {
			setIsLoaded(true); // Set isLoading to false in case of an error
			throw error; // Rethrow the error to be handled by React Query
		}
	};

	const { data, isLoading, isError } = useQuery(['allPromoCodes', orgId], () => fetchPromoCodes(), {
		enabled: !!orgId && !isLoaded,
	});

	// Function to handle sorting
	const sortPromoCodesData = (property: keyof PromoCode, order: 'asc' | 'desc') => {
		const sortedDataCopy = [...sortedPromoCodesData].sort((a: PromoCode, b: PromoCode) => {
			if (order === 'asc') {
				return a[property]! > b[property]! ? 1 : -1;
			} else {
				return a[property]! < b[property]! ? 1 : -1;
			}
		});
		setSortedPromoCodesData(sortedDataCopy);
	};
	// Function to update sortedPromoCodesData with new promoCode data
	const addNewPromoCode = (newPromoCode: any) => {
		setSortedPromoCodesData((prevSortedData) => [newPromoCode, ...prevSortedData]);
	};

	const updatePromoCode = (singlePromoCode: PromoCode) => {
		const updatedPromoCodeList = sortedPromoCodesData?.map((promoCode) => {
			if (singlePromoCode._id === promoCode._id) {
				return singlePromoCode;
			}
			return promoCode;
		});
		setSortedPromoCodesData(updatedPromoCodeList);
	};

	const removePromoCode = (id: string) => {
		setSortedPromoCodesData((prevSortedData) => prevSortedData?.filter((data) => data._id !== id));
	};

	if (isLoading) {
		return <Loading />;
	}

	if (isError) {
		return <LoadingError />;
	}

	return (
		<PromoCodesContext.Provider
			value={{
				sortedPromoCodesData,
				sortPromoCodesData,
				addNewPromoCode,
				removePromoCode,
				updatePromoCode,
				// promoCodesNumberOfPages,
				// promoCodesPageNumber,
				// setPromoCodesPageNumber,
				fetchPromoCodes,
			}}>
			{props.children}
		</PromoCodesContext.Provider>
	);
};

export default PromoCodesContextProvider;
