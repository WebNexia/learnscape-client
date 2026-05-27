import { useRef, useState } from 'react';

export interface WordAssistData {
	pronunciation: string;
	meaningEn: string;
	meaningTr: string;
	meanings: {
		partOfSpeech: string;
		meaningEn: string;
		meaningTr: string;
	}[];
}

interface MeaningCandidate {
	definition: string;
	partOfSpeech: string;
	synonyms: string[];
}

const ARCHAIC_DEFINITION_MARKERS = /\((archaic|obsolete|dated|rare|historical|uncommon|old)\)/i;

export const wrapWordsForHover = (html: string): string => {
	if (!html) return '';
	const htmlEntityPattern = /(&(?:[A-Za-z][A-Za-z0-9]+|#\d+|#x[0-9A-Fa-f]+);)/g;
	const htmlEntityExactPattern = /^&(?!$)(?:[A-Za-z][A-Za-z0-9]+|#\d+|#x[0-9A-Fa-f]+);$/;
	const wordPattern = /([\p{L}]+(?:['’-][\p{L}]+)*)/gu;

	return html
		.split(/(<[^>]+>)/g)
		.map((chunk) => {
			if (!chunk || chunk.startsWith('<')) return chunk;

			// Keep HTML entities untouched (e.g. &nbsp;, &amp;) so they don't get corrupted by word wrapping.
			return chunk
				.split(htmlEntityPattern)
				.map((part) => {
					if (!part || htmlEntityExactPattern.test(part)) return part;
					return part.replace(wordPattern, '<span class="pronounceable-word" data-word="$1">$1</span>');
				})
				.join('');
		})
		.join('');
};

const GENERAL_PARTS_OF_SPEECH = new Set(['noun', 'verb', 'adjective', 'adverb']);

const DOMAIN_KEYWORDS = [
	'blood vessel',
	'lymph',
	'anatomy',
	'medicine',
	'biochemistry',
	'physics',
	'geology',
	'botany',
	'zoology',
	'law',
	'finance',
	'billiards',
	'bowling',
	'betting',
	'ranking',
	'wager',
	'gambling',
	'vessel',
	'artery',
	'vein',
];

const SENSITIVE_OR_SLANG_KEYWORDS = [
	'fuck',
	'motherfuck',
	'fucker',
	'shit',
	'bitch',
	'asshole',
	'bastard',
	'dick',
	'cock',
	'pussy',
	'sexual',
	'sexually',
	'homosexual',
	'erotic',
	'porn',
	'pornographic',
	'genital',
	'penis',
	'vagina',
	'semen',
	'ejaculat',
	'orgasm',
	'masturbat',
	'fetish',
	'bdsm',
	'rape',
	'molest',
	'incest',
	'prostitute',
	'prostitution',
	'brothel',
	'slang',
	'colloquial',
	'informal',
	'idiom',
	'jargon',
	'vulgar',
	'obscene',
	'offensive',
	'derogatory',
	'pejorative',
	'disparaging',
	'insulting',
	'profane',
	'taboo',
	'insult',
	'swear',
	'curse',
	'curse word',
	'expletive',
	'drug',
	'narcotic',
	'cocaine',
	'heroin',
	'opioid',
	'cannabis',
	'marijuana',
	'amphetamine',
	'meth',
	'ecstasy',
	'lsd',
	'hallucinogen',
	'intoxicat',
	'drunk',
	'drunken',
	'hangover',
	'alcoholic',
	'violence',
	'violent',
	'murder',
	'kill',
	'homicide',
	'suicide',
	'self-harm',
	'abuse',
];

const EDUCATIONAL_STYLE_WARNING_KEYWORDS = [
	'slang',
	'informal',
	'vulgar',
	'offensive',
	'derogatory',
	'pejorative',
	'taboo',
	'obscene',
	'profane',
	'archaic',
	'obsolete',
	'dated',
];

const containsAnyKeyword = (text: string, keywords: string[]): boolean => {
	return keywords.some((keyword) => text.includes(keyword));
};

const buildMeaningCandidates = (entries: any[]): MeaningCandidate[] => {
	return entries.flatMap((entry) =>
		(entry?.meanings || []).flatMap((meaning: any) => {
			const meaningSynonyms = (meaning?.synonyms || []).map((synonym: unknown) => String(synonym).toLowerCase().trim()).filter(Boolean);

			return (meaning?.definitions || [])
				.map((definitionItem: any) => {
					const definitionSynonyms = (definitionItem?.synonyms || [])
						.map((synonym: unknown) => String(synonym).toLowerCase().trim())
						.filter(Boolean);

					return {
						definition: String(definitionItem?.definition || '').trim(),
						partOfSpeech: String(meaning?.partOfSpeech || '').toLowerCase(),
						synonyms: [...new Set([...definitionSynonyms, ...meaningSynonyms])],
					};
				})
				.filter((candidate: MeaningCandidate) => candidate.definition.length > 0);
		})
	);
};

const sharesLookupStem = (text: string, lookupWord: string): boolean => {
	const normalizedText = text.toLowerCase();
	const normalizedLookup = lookupWord.toLowerCase().trim();
	if (!normalizedLookup) return false;

	for (let len = Math.min(normalizedLookup.length, 10); len >= 4; len--) {
		if (normalizedText.includes(normalizedLookup.slice(0, len))) return true;
	}

	return false;
};

const isGlossRelatedToLookup = (glossLemma: string, lookupWord: string, candidateSynonyms: string[]): boolean => {
	const lemma = glossLemma.toLowerCase().trim();
	const lookup = lookupWord.toLowerCase().trim();
	if (!lemma || !lookup) return false;
	if (lemma === lookup) return true;
	if (sharesLookupStem(lemma, lookup)) return true;

	return candidateSynonyms.some((synonym) => synonym === lemma || sharesLookupStem(synonym, lookup));
};

const toConciseGloss = (text: string, maxLength = 180): string => {
	const normalized = text.replace(/\s+/g, ' ').trim();
	if (!normalized) return '';
	const firstSentence = normalized.split(/(?<=[.!?])\s+/)[0] || normalized;
	return firstSentence.length <= maxLength ? firstSentence : `${firstSentence.slice(0, maxLength).trimEnd()}...`;
};

const scoreMeaningCandidate = (candidate: MeaningCandidate, lookupWord = ''): number => {
	const lowerDefinition = candidate.definition.toLowerCase();
	const wordCount = candidate.definition.split(/\s+/).length;

	let score = 0;
	if (GENERAL_PARTS_OF_SPEECH.has(candidate.partOfSpeech)) score += 30;
	score += Math.max(0, 24 - wordCount); // Prefer simpler, shorter definitions.

	if (candidate.definition.length > 220) score -= 20;
	if (candidate.definition.includes(';')) score -= 6;
	if (candidate.definition.includes(':')) score -= 4;
	if (containsAnyKeyword(lowerDefinition, DOMAIN_KEYWORDS)) score -= 25;
	if (containsAnyKeyword(lowerDefinition, EDUCATIONAL_STYLE_WARNING_KEYWORDS)) score -= 60;
	if (containsAnyKeyword(lowerDefinition, SENSITIVE_OR_SLANG_KEYWORDS)) score -= 180;

	const normalizedLookup = lookupWord.toLowerCase().trim();
	if (normalizedLookup) {
		if (sharesLookupStem(lowerDefinition, normalizedLookup)) {
			score += 35;
		}

		if (ARCHAIC_DEFINITION_MARKERS.test(lowerDefinition)) {
			score -= 55;
		}

		// Only penalize single-word glosses that are not the lookup word or a listed synonym (e.g. "Pregnant." for "interesting").
		const glossLemma = lowerDefinition.replace(/[^a-z]/g, '');
		if (wordCount === 1 && glossLemma.length > 0 && glossLemma.length < 20) {
			if (!isGlossRelatedToLookup(glossLemma, normalizedLookup, candidate.synonyms)) {
				score -= 45;
			}
		}
	}

	return score;
};

const selectBestMeaningCandidate = (candidates: MeaningCandidate[], lookupWord = ''): MeaningCandidate | null => {
	if (!candidates.length) return null;

	return candidates
		.map((candidate) => ({ candidate, score: scoreMeaningCandidate(candidate, lookupWord) }))
		.sort((left, right) => right.score - left.score)[0].candidate;
};

const selectTopMeaningCandidates = (candidates: MeaningCandidate[], lookupWord = '', limit = 3): MeaningCandidate[] => {
	if (!candidates.length) return [];

	const safeCandidates = candidates.filter(
		(candidate) =>
			!containsAnyKeyword(candidate.definition.toLowerCase(), SENSITIVE_OR_SLANG_KEYWORDS) &&
			!containsAnyKeyword(candidate.definition.toLowerCase(), EDUCATIONAL_STYLE_WARNING_KEYWORDS)
	);
	const rankingSource = safeCandidates.length > 0 ? safeCandidates : candidates;

	const scoredCandidates = rankingSource
		.map((candidate) => ({ candidate, score: scoreMeaningCandidate(candidate, lookupWord) }))
		.sort((left, right) => right.score - left.score)
		.map(({ candidate }) => candidate);

	const seen = new Set<string>();
	const deduplicated: MeaningCandidate[] = [];
	for (const candidate of scoredCandidates) {
		const key = candidate.definition.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		deduplicated.push(candidate);
		if (deduplicated.length >= limit) break;
	}

	return deduplicated;
};

interface UseWordAssistOptions {
	enabled?: boolean;
	hoverDelayMs?: number;
}

const startsWithUppercaseLetter = (word: string): boolean => {
	if (!word) return false;
	return /^\p{Lu}/u.test(word);
};

const isFirstWordOfSentence = (target: HTMLElement): boolean => {
	const rootContainer =
		target.closest('.rich-text-content') || target.closest('[class*="MuiTypography-root"]') || target.parentElement;
	if (!rootContainer) return false;

	const range = document.createRange();
	range.selectNodeContents(rootContainer);
	range.setEndBefore(target);
	const textBeforeTarget = range.toString();

	const sentenceFragment = textBeforeTarget.split(/[.!?]+[\s\n]*/).pop() || '';
	const wordsInCurrentSentence = sentenceFragment.match(/\p{L}+/gu) || [];
	return wordsInCurrentSentence.length === 0;
};

const WORD_ASSIST_POPPER_SELECTOR = '[data-word-assist-popper="true"]';

const isInsideWordAssistUi = (node: EventTarget | null): boolean => {
	if (!(node instanceof Element)) return false;
	return Boolean(node.closest('.pronounceable-word') || node.closest(WORD_ASSIST_POPPER_SELECTOR));
};

export const useWordAssist = ({ enabled = true, hoverDelayMs = 1000 }: UseWordAssistOptions = {}) => {
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
	const [activeWord, setActiveWord] = useState<string>('');
	const [wordInfo, setWordInfo] = useState<WordAssistData | null>(null);
	const [isLoadingWordInfo, setIsLoadingWordInfo] = useState<boolean>(false);
	const hoverTimerRef = useRef<number | null>(null);
	const wordInfoCacheRef = useRef<Record<string, WordAssistData>>({});
	const fetchRequestIdRef = useRef(0);

	const clearHoverTimer = () => {
		if (hoverTimerRef.current) {
			window.clearTimeout(hoverTimerRef.current);
			hoverTimerRef.current = null;
		}
	};

	const dismissWordAssist = () => {
		clearHoverTimer();
		fetchRequestIdRef.current += 1;
		setAnchorEl(null);
		setActiveWord('');
		setWordInfo(null);
		setIsLoadingWordInfo(false);
	};

	const handleWordAssistMouseOut = (event: React.MouseEvent<HTMLElement>) => {
		if (!enabled) return;
		if (isInsideWordAssistUi(event.relatedTarget)) return;
		dismissWordAssist();
	};

	const handlePopperMouseOut = (event: React.MouseEvent<HTMLElement>) => {
		if (!enabled) return;
		if (isInsideWordAssistUi(event.relatedTarget)) return;
		dismissWordAssist();
	};

	const speakWord = (word: string) => {
		if (!enabled || !word || typeof window === 'undefined' || !window.speechSynthesis) return;
		window.speechSynthesis.cancel();
		const utterance = new SpeechSynthesisUtterance(word);
		utterance.lang = 'en-US';
		utterance.rate = 0.95;
		window.speechSynthesis.speak(utterance);
	};

	const fetchWordInfo = async (word: string, options?: { preferProperNoun?: boolean }) => {
		const requestId = ++fetchRequestIdRef.current;
		const isStale = () => requestId !== fetchRequestIdRef.current;

		const normalizedWord = word.toLowerCase();
		const preferProperNoun = Boolean(options?.preferProperNoun);
		const cacheKey = `${normalizedWord}|${preferProperNoun ? 'proper' : 'default'}|v3`;

		if (wordInfoCacheRef.current[cacheKey]) {
			if (isStale()) return;
			setWordInfo(wordInfoCacheRef.current[cacheKey]);
			setIsLoadingWordInfo(false);
			return;
		}

		setIsLoadingWordInfo(true);
		try {
			const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalizedWord)}`);
			if (isStale()) return;
			const data = await response.json();
			const entries = Array.isArray(data) ? data : [];
			const firstEntry = entries[0] || null;
			const pronunciation = firstEntry?.phonetic || firstEntry?.phonetics?.find((entry: { text?: string }) => entry?.text)?.text || 'N/A';

			let resolvedMeanings: { partOfSpeech: string; meaningEn: string; meaningTr: string }[] = [];

			if (preferProperNoun) {
				let properMeaningTr = 'Anlam bulunamadi.';
				try {
					const trResponse = await fetch(
						`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|tr`
					);
					const trData = await trResponse.json();
					properMeaningTr = trData?.responseData?.translatedText || properMeaningTr;
				} catch (error) {
					properMeaningTr = 'Anlam bulunamadi.';
				}

				resolvedMeanings = [
					{
						partOfSpeech: 'proper noun',
						meaningEn: word,
						meaningTr: properMeaningTr,
					},
				];
			} else {
				const candidates = buildMeaningCandidates(entries);
				const topCandidates = selectTopMeaningCandidates(candidates, normalizedWord, 3);

				resolvedMeanings = await Promise.all(
					(topCandidates.length ? topCandidates : [{ definition: normalizedWord, partOfSpeech: '', synonyms: [] }]).map(async (candidate) => {
						const meaningEnCandidate = toConciseGloss(candidate.definition) || normalizedWord;

						let meaningTrCandidate = 'Anlam bulunamadi.';
						try {
							const trResponse = await fetch(
								`https://api.mymemory.translated.net/get?q=${encodeURIComponent(meaningEnCandidate)}&langpair=en|tr`
							);
							const trData = await trResponse.json();
							meaningTrCandidate = trData?.responseData?.translatedText || meaningTrCandidate;
						} catch (error) {
							meaningTrCandidate = 'Anlam bulunamadi.';
						}

						return {
							partOfSpeech: candidate.partOfSpeech || '',
							meaningEn: meaningEnCandidate,
							meaningTr: meaningTrCandidate,
						};
					})
				);
				if (isStale()) return;
			}

			const primaryMeaning = resolvedMeanings[0] || {
				partOfSpeech: '',
				meaningEn: 'Meaning unavailable.',
				meaningTr: 'Anlam bulunamadi.',
			};

			const parsedInfo = {
				pronunciation,
				meaningEn: primaryMeaning.meaningEn,
				meaningTr: primaryMeaning.meaningTr,
				meanings: resolvedMeanings,
			};
			wordInfoCacheRef.current[cacheKey] = parsedInfo;
			if (isStale()) return;
			setWordInfo(parsedInfo);
		} catch (error) {
			if (isStale()) return;
			setWordInfo({
				pronunciation: 'N/A',
				meaningEn: 'Meaning unavailable.',
				meaningTr: 'Anlam bulunamadi.',
				meanings: [
					{
						partOfSpeech: '',
						meaningEn: 'Meaning unavailable.',
						meaningTr: 'Anlam bulunamadi.',
					},
				],
			});
		} finally {
			if (!isStale()) {
				setIsLoadingWordInfo(false);
			}
		}
	};

	const handleWordHover = (event: React.MouseEvent<HTMLElement>) => {
		if (!enabled) return;
		const target = (event.target as HTMLElement).closest('.pronounceable-word') as HTMLElement | null;
		if (!target) return;
		const rawWord = target.dataset.word?.trim();
		if (!rawWord) return;
		const preferProperNoun = startsWithUppercaseLetter(rawWord) && !isFirstWordOfSentence(target);

		clearHoverTimer();
		hoverTimerRef.current = window.setTimeout(() => {
			setAnchorEl(target);
			setActiveWord(rawWord.toLowerCase());
			setWordInfo(null);
			speakWord(rawWord);
			void fetchWordInfo(rawWord, { preferProperNoun });
		}, hoverDelayMs);
	};

	const handleWordTouchStart = (event: React.TouchEvent<HTMLElement>) => {
		if (!enabled) return;
		const target = (event.target as HTMLElement).closest('.pronounceable-word') as HTMLElement | null;
		if (!target) return;
		const rawWord = target.dataset.word?.trim();
		if (!rawWord) return;
		const preferProperNoun = startsWithUppercaseLetter(rawWord) && !isFirstWordOfSentence(target);

		clearHoverTimer();
		hoverTimerRef.current = window.setTimeout(() => {
			setAnchorEl(target);
			setActiveWord(rawWord.toLowerCase());
			setWordInfo(null);
			speakWord(rawWord);
			void fetchWordInfo(rawWord, { preferProperNoun });
		}, hoverDelayMs);
	};

	const handleWordTouchEnd = () => {
		dismissWordAssist();
	};

	return {
		anchorEl,
		activeWord,
		wordInfo,
		isLoadingWordInfo,
		handleWordHover,
		handleWordTouchStart,
		handleWordTouchEnd,
		handleMouseLeave: handleWordAssistMouseOut,
		handleWordAssistMouseOut,
		handlePopperMouseOut,
	};
};
