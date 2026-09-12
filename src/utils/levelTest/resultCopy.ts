import type { AssessmentOutcome } from './engine';
import type { CefrLevel } from './types';

const NEXT_CEFR_LEVEL: Record<CefrLevel, CefrLevel | null> = {
	A1: 'A2',
	A2: 'B1',
	B1: 'B2',
	B2: 'C1',
	C1: 'C2',
	C2: null,
};

export const READING_RESULT_HEADLINE = 'Tahmini İngilizce okuma seviyen';
export const READING_RESULT_DISCLAIMER =
	'Bu sonuç resmî bir sertifika değil; okuma anlama sorularındaki performansına dayanan bir tahmindir.';

export const CEFR_BAND_LABELS: Record<CefrLevel, string> = {
	A1: 'Başlangıç',
	A2: 'Temel',
	B1: 'Orta Seviye',
	B2: 'Orta-Üstü',
	C1: 'İleri',
	C2: 'Yetkin',
};

const levelDescriptions: Record<CefrLevel, string> = {
	A1: 'Tanıdık, günlük durumları anlatan kısa ve basit metinleri anlayabiliyorsun.',
	A2: 'Günlük hayattan sade metinleri takip edebiliyor; sık kullanılan tanımları, olayları ve nedenleri anlayabiliyorsun.',
	B1: 'Tanıdık konulardaki bağlantılı metinleri takip edebiliyor, önemli detayları bulabiliyor ve açıkça ima edilenleri anlayabiliyorsun.',
	B2: 'Daha karmaşık metinleri anlayabiliyor, birbiriyle çelişen fikirleri takip edebiliyor ve doğrudan söylenmeyen anlamı fark edebiliyorsun.',
	C1: 'Örtük tutumlar, karmaşık ilişkiler ve soyut fikirler içeren zorlu metinleri anlayabiliyorsun.',
	C2: 'Çok katmanlı metinleri takip edebiliyor; ince ayrımları, imaları, tonu ve retorik anlamı fark edebiliyorsun.',
};

const meaningExtras: Record<CefrLevel, string> = {
	A1: 'Kısa cümleler, günlük kelimeler ve net bir olay örgüsü olan hikayelerle başlamak en hızlı ilerleme yolun.',
	A2: 'Alışveriş, seyahat ve günlük hayat gibi tanıdık konulardaki sade metinler bu seviyeyi güçlendirir.',
	B1: 'Bu seviye, tanıdık konulardaki hikayeleri, blog yazılarını ve günlük metinleri kendi başına okumak için sağlam bir temel.',
	B2: 'Fikirlerin daha dolaylı verildiği metinlerde, yazarın tutumunu ve satır aralarını fark etmeye başlıyorsun.',
	C1: 'Uzun ve soyut metinlerde örtük anlam, üslup ve karmaşık ilişkileri takip edebilecek bir okuma düzeyindesin.',
	C2: 'Çok katmanlı, edebi ya da tartışmacı metinlerde ton, ima ve retorik ayrıntıyı yakalayabiliyorsun.',
};

const nextGoalTips: Record<CefrLevel, string[]> = {
	A1: [
		'Her gün kısa ve tekrarlı cümleler içeren bir hikaye oku.',
		'Metindeki kim, nerede, ne oldu sorularını kendi kendine sor.',
		'Bilmediğin kelimeleri cümlenin geri kalanından tahmin etmeye çalış.',
	],
	A2: [
		'Günlük hayattan kısa metinlerde neden-sonuç bağlarını takip et.',
		'Sık kullanılan bağlaçları ve zaman ifadelerini fark et.',
		'Her bölümden sonra metni bir-iki cümleyle özetle.',
	],
	B1: [
		'Biraz daha uzun hikayelerde ana fikir ile detayı ayırmaya çalış.',
		'Yazarın açıkça söylemediği ama ima ettiği noktaları not et.',
		'Aynı temadaki metinleri arka arkaya okuyarak kelimeyi pekiştir.',
	],
	B2: [
		'Birbiriyle çelişen fikirler içeren metinlerde yazarın duruşunu ara.',
		'Kelimelerin bağlamdaki incelikli anlamını karşılaştırmaya başla.',
		'Bir bölümü okuduktan sonra ‘neden böyle yazılmış?’ diye sor.',
	],
	C1: [
		'Soyut ve tartışmacı metinlerde tutum ve üslup değişimlerini izle.',
		'Uzun cümlelerdeki yan düşünceleri ana fikirden ayırmaya çalış.',
		'Aynı konunun farklı bakış açılarıyla yazılmış hallerini oku.',
	],
	C2: [
		'İma, ironi ve retorik oyunları olan metinlerle pratik yap.',
		'Yazarın söylemediği varsayımları fark etmeye çalış.',
		'Zorlayıcı hikayeleri yavaş ve dikkatli okumaya devam et.',
	],
};

export type ReadingLevelGuide = {
	meaningParagraphs: string[];
	canDoItems: string[];
	suitableTexts: string[];
};

const levelGuides: Record<CefrLevel, ReadingLevelGuide> = {
	A1: {
		meaningParagraphs: [
			'A1, İngilizce okumada başlangıç seviyesidir. Metinler kısadır; cümleler basittir ve günlük hayattan tanıdık kelimeler kullanılır.',
			'Bu seviyede amaç, her kelimeyi bilmek değil; kim, nerede, ne oldu gibi net bilgileri kısa bir metinden çıkarabilmektir.',
		],
		canDoItems: [
			'Çok kısa ve basit cümleleri takip edebilirsin.',
			'Tanıdık günlük kelimeleri metin içinde tanıyabilirsin.',
			'Kısa bir hikayede kim, nerede ve ne olduğunu anlayabilirsin.',
			'Tekrarlanan, net bir olay örgüsünü baştan sona izleyebilirsin.',
		],
		suitableTexts: ['Kısa A1 hikayeleri ve basit diyaloglar', 'Tabelalar, kısa mesajlar ve günlük notlar', 'Tekrarlı cümleler ve net bir sonu olan metinler'],
	},
	A2: {
		meaningParagraphs: [
			'A2, temel okuma seviyesidir. Artık yalnızca tek tek cümleleri değil, günlük hayattan kısa ve bağlantılı metinleri de takip edebilirsin.',
			'Alışveriş, seyahat, ev ve iş gibi tanıdık konularda neden-sonuç ilişkilerini ve sık kullanılan açıklamaları yakalayabilirsin.',
		],
		canDoItems: [
			'Günlük hayattan sade metinlerin ana konusunu anlayabilirsin.',
			'Sık kullanılan tanımları, olayları ve nedenleri takip edebilirsin.',
			'Kısa bir metindeki zaman ve sıra bilgisini çıkarabilirsin.',
			'Bilmediğin bir kelimeyi cümlenin geri kalanından tahmin etmeye başlayabilirsin.',
		],
		suitableTexts: ['Kısa A2 hikayeleri ve günlük yaşam metinleri', 'Basit e-postalar, tarifler ve seyahat notları', 'Neden-sonuç bağları açık olan sade anlatılar'],
	},
	B1: {
		meaningParagraphs: [
			'B1, tanıdık konulardaki bağlantılı metinleri kendi başına okuyabileceğin orta seviyedir. Ana fikri, önemli detayı ve açıkça ima edilen anlamı ayırt etmeye başlarsın.',
			'Bu seviye, hikayeleri, blog yazılarını ve günlük metinleri sözlüğe sürekli bakmadan takip etmek için sağlam bir temeldir.',
		],
		canDoItems: [
			'Tanıdık bir konudaki metnin ana fikrini çıkarabilirsin.',
			'Önemli detayları ve olayların sırasını takip edebilirsin.',
			'Yazarın açıkça söylemediği ama kolayca ima ettiği anlamı fark edebilirsin.',
			'Bir kelimenin metindeki bağlamına göre anlamını tahmin edebilirsin.',
		],
		suitableTexts: ['B1 seviyesinde yazılmış hikayeler ve kişisel anlatılar', 'Blog yazıları, haber özetleri ve günlük yaşam metinleri', 'Ana fikir ile detayın net ayrıldığı bağlantılı metinler'],
	},
	B2: {
		meaningParagraphs: [
			'B2, daha karmaşık ve dolaylı metinleri anlayabildiğin orta-üstü okuma seviyesidir. Birbiriyle çelişen fikirleri takip eder, yazarın duruşunu ve satır aralarını fark etmeye başlarsın.',
			'Metinler daha uzundur; kelimeler tek bir anlamda durmaz ve yazar her şeyi doğrudan söylemez.',
		],
		canDoItems: [
			'Daha uzun ve karmaşık metinlerin ana hatlarını takip edebilirsin.',
			'Birbiriyle çelişen görüşleri ayırt edebilirsin.',
			'Doğrudan söylenmeyen anlamı ve yazarın tutumunu fark edebilirsin.',
			'Kelimelerin bağlamdaki incelikli farklarını karşılaştırmaya başlayabilirsin.',
		],
		suitableTexts: ['B2 hikayeleri, görüş yazıları ve tartışmacı metinler', 'Fikirlerin dolaylı verildiği makaleler ve röportajlar', 'Tutum, karşıtlık ve satır arası anlam içeren anlatılar'],
	},
	C1: {
		meaningParagraphs: [
			'C1, örtük tutumlar, karmaşık ilişkiler ve soyut fikirler içeren zorlu metinleri anlayabildiğin ileri okuma seviyesidir.',
			'Uzun cümlelerdeki yan düşünceleri ana fikirden ayırabilir, üslup ve tutum değişimlerini izleyebilirsin.',
		],
		canDoItems: [
			'Soyut ve tartışmacı metinlerde yazarın tutumunu takip edebilirsin.',
			'Uzun cümlelerdeki yan fikirleri ana düşünceden ayırabilirsin.',
			'Örtük anlam, üslup ve karmaşık ilişkileri fark edebilirsin.',
			'Aynı konunun farklı bakış açılarıyla yazılmış hallerini karşılaştırabilirsin.',
		],
		suitableTexts: ['C1 seviyesinde uzun hikayeler ve denemeler', 'Soyut, tartışmacı veya analitik makaleler', 'Üslup ve örtük anlamın öne çıktığı edebi anlatılar'],
	},
	C2: {
		meaningParagraphs: [
			'C2, çok katmanlı metinleri takip edebildiğin yetkin okuma seviyesidir. İnce ayrımları, imaları, tonu ve retorik anlamı yakalayabilirsin.',
			'Yazarın söylemediği varsayımları, ironiyi ve bilinçli üslup seçimlerini fark etmek bu seviyenin doğal parçasıdır.',
		],
		canDoItems: [
			'Çok katmanlı edebi veya tartışmacı metinleri baştan sona takip edebilirsin.',
			'İma, ironi ve retorik oyunları fark edebilirsin.',
			'Ton, varsayım ve söylemin altındaki duruşu okuyabilirsin.',
			'Zorlayıcı metinleri yavaş ve dikkatli okuyarak incelikli anlamı çıkarabilirsin.',
		],
		suitableTexts: ['C2 hikayeleri, edebi anlatılar ve karmaşık denemeler', 'İma, ton ve retorik ayrıntısı yüksek metinler', 'Birden fazla bakış açısını aynı anda taşıyan uzun yazılar'],
	},
};

const belowA1Guide: ReadingLevelGuide = {
	meaningParagraphs: [
		'A1 henüz net biçimde doğrulanmadı. Şimdilik en sağlam adım, kısa ve basit metinlerle temel okuma becerilerini kurmaktır.',
		'Kısa cümleler, günlük kelimeler ve net bir olay örgüsü olan hikayelerle başlamak en hızlı ilerleme yolun.',
	],
	canDoItems: [
		'Çok kısa ve tekrarlı cümlelerle okumaya başlayabilirsin.',
		'Tanıdık günlük kelimeleri metin içinde fark etmeye başlayabilirsin.',
		'Kısa bir metinde kim ve ne olduğunu adım adım çıkarabilirsin.',
	],
	suitableTexts: ['Çok kısa A1 hikayeleri', 'Basit diyaloglar ve tekrarlı cümleler', 'Tek bir olay üzerine kurulu net metinler'],
};

export function getLevelDescription(level: CefrLevel) {
	return levelDescriptions[level];
}
export function getReadingLevelGuide(outcome: AssessmentOutcome) {
	return outcome.resultType === 'below_a1' || !outcome.finalLevel ? belowA1Guide : levelGuides[outcome.finalLevel];
}

export type ReadingResultCopy = {
	resultLabel: string;
	resultBandLabel: string;
	resultParenthetical: string | null;
	badgeLabel: string;
	lead: string;
	description: string;
	meaningParagraphs: string[];
	approachingNote: string | null;
	nextGoalLevel: CefrLevel | null;
	nextGoalTitle: string;
	nextGoalLead: string;
	nextGoalTips: string[];
	recommendedLevel: CefrLevel;
	booksHeading: string;
	booksCtaLabel: string;
	levelGuide: ReadingLevelGuide;
};

export function getScoreEncouragement(score: number) {
	if (score >= 80) return 'İyi iş çıkardın!';
	if (score >= 60) return 'Güzel bir sonuç.';
	return 'Pratikle daha da güçlenecek.';
}

export function buildResultCopy(outcome: AssessmentOutcome): ReadingResultCopy {
	if (outcome.resultType === 'below_a1' || !outcome.finalLevel) {
		return {
			resultLabel: 'A1',
			resultBandLabel: 'Başlangıç seviyesi',
			resultParenthetical: 'Başlangıç seviyesi',
			badgeLabel: 'İşte sonucun',
			lead: 'A1 seviyesindeki temel okuma becerilerini geliştirmeye başlamanı öneriyoruz.',
			description: 'Kısa ve basit cümlelerle yazılmış hikayelerle başlamak, okuduğunu anlama becerini en hızlı geliştiren yol.',
			meaningParagraphs: [
				'A1 henüz net biçimde doğrulanmadı; şimdilik en sağlam adım kısa ve basit metinlerle temel okuma becerilerini kurmak.',
				'Kısa cümleler, günlük kelimeler ve net bir olay örgüsü olan hikayelerle başlamak en hızlı ilerleme yolun.',
			],
			approachingNote: null,
			nextGoalLevel: 'A1',
			nextGoalTitle: 'Bir sonraki hedefin: A1',
			nextGoalLead: 'Kısa A1 hikayeleriyle günlük kelimeleri ve basit cümleleri daha rahat takip edebilirsin.',
			nextGoalTips: nextGoalTips.A1,
			recommendedLevel: 'A1',
			booksHeading: 'Sana uygun okuma seviyesi: A1',
			booksCtaLabel: 'A1 Hikayelerini Keşfet',
			levelGuide: belowA1Guide,
		};
	}
	const level = outcome.finalLevel;
	const nextLevel = outcome.approachingLevel ?? NEXT_CEFR_LEVEL[level];
	const lead =
		outcome.status === 'developing'
			? `Anlama performansına göre ${level} seviyesindeki temel okuma becerilerini geliştiriyorsun.`
			: `Anlama performansına göre ${level} seviyesindeki İngilizce metinleri rahatça takip edebiliyorsun.`;
	return {
		resultLabel: level,
		resultBandLabel: CEFR_BAND_LABELS[level],
		resultParenthetical: null,
		badgeLabel: 'Tebrikler!',
		lead,
		description: levelDescriptions[level],
		meaningParagraphs: [levelDescriptions[level], meaningExtras[level]],
		approachingNote: outcome.approachingLevel ? `${outcome.approachingLevel} seviyesine yaklaşıyorsun.` : null,
		nextGoalLevel: nextLevel,
		nextGoalTitle: nextLevel ? `Bir sonraki hedefin: ${nextLevel}` : 'Seviyeni koru',
		nextGoalLead: nextLevel
			? `${nextLevel} (${CEFR_BAND_LABELS[nextLevel]}) metinlerinde biraz daha fazla ima, detay ve bağlaç göreceksin. Kısa düzenli okuma bunu açar.`
			: 'C2 doğrulandı. Zorlayıcı metinlerle okuma keskinliğini korumaya devam edebilirsin.',
		nextGoalTips: nextGoalTips[nextLevel ?? 'C2'],
		recommendedLevel: level,
		booksHeading: `Sana uygun okuma seviyesi: ${level}`,
		booksCtaLabel: `${level} Hikayelerini Keşfet`,
		levelGuide: levelGuides[level],
	};
}
