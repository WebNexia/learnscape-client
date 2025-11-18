import { useQuery } from 'react-query';
import axios from '@utils/axiosInstance';
import { useContext } from 'react';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { useAuth } from './useAuth';

interface QuestionType {
	_id: string;
	name: string;
}

const useQuestionTypes = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, hasAdminAccess, isLearner, isInstructor } = useAuth();

	const { data: questionTypes = [] } = useQuery<QuestionType[]>(
		['allQuestionTypes', orgId],
		async () => {
			if (!orgId) return [];
			const response = await axios.get(`${base_url}/questiontypes/organisation/${orgId}`);
			return response.data.data || [];
		},
		{
			enabled: !!orgId && isAuthenticated && (hasAdminAccess || isLearner || isInstructor),
			staleTime: 60 * 60 * 1000, // 1 hour
			cacheTime: 24 * 60 * 1000, // 24 hours
			refetchOnMount: false,
			refetchOnWindowFocus: false,
		}
	);

	const fetchQuestionTypeName = (question: any): string => {
		if (!question || !question.questionType) {
			return 'Unknown';
		}

		// Use find instead of filter since we only need the first match
		const questionType = questionTypes?.find((type: any) => {
			return type._id === question?.questionType || type.name === question?.questionType;
		});

		return questionType?.name || '';
	};

	return {
		questionTypes,
		fetchQuestionTypeName,
	};
};

export default useQuestionTypes;
