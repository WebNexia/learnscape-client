import { useState, useCallback } from 'react';

const useNewQuestion = (initialOptions: string[] = ['']) => {
	const [options, setOptions] = useState<string[]>(initialOptions);
	const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(-1);
	const [correctAnswer, setCorrectAnswer] = useState<string>('');
	const [isDuplicateOption, setIsDuplicateOption] = useState<boolean>(false);
	const [isMinimumOptions, setIsMinimumOptions] = useState<boolean>(false);

	const addOption = useCallback(() => {
		setOptions((prevOptions) => {
			const newOptions = [...prevOptions, ''];
			setIsMinimumOptions(newOptions?.filter((option) => option.trim() !== '')?.length >= 2);
			return newOptions;
		});
	}, []);

	const handleCorrectAnswerChange = useCallback(
		(index: number) => {
			setCorrectAnswerIndex(index);
			setCorrectAnswer(options[index]);
		},
		[options]
	);

	const checkForDuplicateOptions = useCallback((options: string[]) => {
		const filteredOptions = options?.map((option) => option.trim())?.filter((option) => option.trim() !== '') || [];
		const uniqueOptions = new Set(filteredOptions);
		return uniqueOptions.size !== filteredOptions.length;
	}, []);

	const handleOptionChange = useCallback(
		(index: number, value: string) => {
			setOptions((prevOptions) => {
				const newOptions = [...prevOptions];
				newOptions[index] = value;

				setIsDuplicateOption(checkForDuplicateOptions(newOptions));
				setIsMinimumOptions(newOptions?.filter((option) => option.trim() !== '')?.length >= 2);

				return newOptions;
			});
		},
		[checkForDuplicateOptions]
	);

	const removeOption = useCallback(
		(indexToRemove: number) => {
			setOptions((prevOptions) => {
				const newOptions = [...prevOptions];
				newOptions?.splice?.(indexToRemove, 1);

				if (indexToRemove === correctAnswerIndex) {
					setCorrectAnswerIndex(-1);
					setCorrectAnswer('');
				} else if (indexToRemove < correctAnswerIndex) {
					setCorrectAnswerIndex(correctAnswerIndex - 1);
					setCorrectAnswer(newOptions[correctAnswerIndex - 1] || '');
				}

				setIsDuplicateOption(checkForDuplicateOptions(newOptions));
				setIsMinimumOptions(newOptions?.filter((option) => option.trim() !== '')?.length >= 2);

				return newOptions;
			});
		},
		[correctAnswerIndex, checkForDuplicateOptions]
	);

	return {
		options,
		setOptions,
		correctAnswerIndex,
		setCorrectAnswerIndex,
		correctAnswer,
		setCorrectAnswer,
		isDuplicateOption,
		setIsDuplicateOption,
		setIsMinimumOptions,
		isMinimumOptions,
		addOption,
		removeOption,
		handleCorrectAnswerChange,
		handleOptionChange,
	};
};

export default useNewQuestion;
