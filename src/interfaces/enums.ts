export const enum AuthForms {
	SIGN_IN = 'sign_in',
	SIGN_UP = 'sign_up',
	RESET = 'reset',
}

export const enum TextFieldTypes {
	EMAIL = 'email',
	PASSWORD = 'password',
	TEXT = 'text',
}

export const enum AuthFormErrorMessages {
	EMAIL_EXISTS = 'Bu e-posta adresi zaten kullanımda!',
	INVALID_CREDENTIALS = 'Geçersiz e-posta adresi veya şifre',
	USERNAME_EXISTS = 'Bu kullanıcı adı zaten alınmış',
	PHONE_NUMBER_EXISTS = 'Bu telefon numarası zaten kayıtlı',
	EMAIL_NOT_VERIFIED = 'E-posta doğrulanmadı',
	UNKNOWN_ERROR_OCCURRED = 'Bilinmeyen bir hata oluştu',
	PASSWORD_TOO_SHORT = 'Şifre en az 6 karakter olmalıdır',
	PASSWORD_NO_LETTER = 'Şifre en az bir harf içermelidir',
	// PASSWORD_NO_UPPERCASE = 'Şifre en az bir büyük harf içermelidir.',
	// PASSWORD_NO_LOWERCASE = 'Şifre en az bir küçük harf içermelidir.',
	PASSWORD_NO_NUMBER = 'Şifre en az bir rakam içermelidir',
	// PASSWORD_NO_SPECIAL_CHAR = 'Şifre en az bir özel karakter içermelidir.',
	NETWORK_ERROR = 'Ağ hatası oluştu. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.',
	INVALID_PHONE_NUMBER = 'Lütfen geçerli bir telefon numarası girin.',
	USERNAME_TOO_SHORT = 'Kullanıcı adı en az 5 karakter olmalıdır',
	USERNAME_TOO_LONG = 'Kullanıcı adı en fazla 15 karakter olmalıdır',
	VISIBILITY_CHECK_ERROR = 'Lütfen tekrar giriş yapmayı deneyin. Sorun devam ederse, sayfayı yenileyin.',
	VERIFICATION_EMAIL_SENT = 'Doğrulama e-postası gönderildi. Lütfen gelen kutunuzu kontrol edin.',
	VERIFICATION_EMAIL_ERROR = 'Doğrulama e-postası gönderilirken bir hata oluştu. Lütfen tekrar deneyin.',
	RECAPTCHA_ERROR = 'Lütfen reCAPTCHA doğrulamasını tamamlayın.',
	RECAPTCHA_ERROR_OCCURRED = 'reCAPTCHA doğrulaması sırasında hata oluştu.',
	USER_INACTIVE = 'Şu anda hesabınıza ulaşamazsınız. Lütfen yönetici ile iletişime geçin.',
}

export const enum PasswordUpdateErrorMessages {
	PASSWORD_TOO_SHORT = 'Password must be at least 6 characters long',
	PASSWORD_NO_LETTER = 'Password must contain at least one letter',
	// PASSWORD_NO_UPPERCASE = 'Password must contain at least one uppercase letter.',
	// PASSWORD_NO_LOWERCASE = 'Password must contain at least one lowercase letter.',
	PASSWORD_NO_NUMBER = 'Password must contain at least one number',
	PASSWORDS_DO_NOT_MATCH = 'Passwords do not match',
	INVALID_CURRENT_PASSWORD = 'Invalid current password',
	SAME_PASSWORD = 'Enter a different password',
	// PASSWORD_NO_SPECIAL_CHAR = 'Password must contain at least one special character.',
}

export const enum Mode {
	DARK_MODE = 'dark',
	LIGHT_MODE = 'light',
}

export const enum PageName {
	ADMIN_DASHBOARD = 'Dashboard',
	ADMIN_USERS = 'Users',
	ADMIN_COURSES = 'Courses',
	ADMIN_LESSONS = 'Lessons',
	ADMIN_QUESTIONS = 'Questions',
	ADMIN_DOCUMENTS = 'Documents',
	ADMIN_FORMS = 'Forms',
	ADMIN_FEEDBACKS = 'Feedbacks',

	ADMIN_MESSAGES = 'Messages',
	ADMIN_COMMUNITY = 'Community',
	ADMIN_SETTINGS = 'Settings',
	ADMIN_QUIZ_SUBMISSIONS = 'Submissions',
	ADMIN_PAYMENTS = 'Payments',
	INSTRUCTOR_DASHBOARD = 'Dashboard',
	INSTRUCTOR_COURSES = 'Courses',
	INSTRUCTOR_LESSONS = 'Lessons',
	INSTRUCTOR_QUESTIONS = 'Questions',
	INSTRUCTOR_DOCUMENTS = 'Documents',
	INSTRUCTOR_FORMS = 'Forms',
	INSTRUCTOR_SUBMISSIONS = 'Submissions',
	INSTRUCTOR_EVENTS = 'Calendar',
	INSTRUCTOR_MESSAGES = 'Messages',
	INSTRUCTOR_COMMUNITY = 'Community',
	INSTRUCTOR_SETTINGS = 'Settings',
	DASHBOARD = 'Dashboard',
	COURSES = 'Courses',
	SUBMISSIONS = 'Submissions',
	CALENDAR = 'Calendar',
	MESSAGES = 'Messages',
	COMMUNITY = 'Community',
	SETTINGS = 'Settings',
}

export const enum Roles {
	ADMIN = 'admin',
	USER = 'learner',
	INSTRUCTOR = 'instructor',
	SUPER_ADMIN = 'super-admin',
	OWNER = 'owner',
}

export const enum QuestionType {
	MULTIPLE_CHOICE = 'Multiple Choice',
	OPEN_ENDED = 'Open-ended',
	TRUE_FALSE = 'True-False',
	FLIP_CARD = 'Flip Card',
	AUDIO_VIDEO = 'Audio/Video',
	MATCHING = 'Matching',
	FITB_TYPING = 'FITB-Typing',
	FITB_DRAG_DROP = 'FITB-Drag/Drop',
	TRANSLATE = 'Translate',
}

export const enum LessonType {
	INSTRUCTIONAL_LESSON = 'Instructional Lesson',
	PRACTICE_LESSON = 'Practice Lesson',
	QUIZ = 'Quiz',
}

export const enum NotificationType {
	QUIZ_SUBMISSION = 'QuizSubmission',
	MESSAGE_RECEIVED = 'MessageReceived',
	REPORT_TOPIC = 'ReportTopic',
	REPORT_MESSAGE = 'ReportMessage',
	REPLY_TO_COMMUNITY_MESSAGE = 'ReplyToCommunityMessage',
	REPLY_TO_COMMUNITY_TOPIC = 'ReplyToCommunityTopic',
	NEW_COMMUNITY_TOPIC = 'NewCommunityTopic',
	MENTION_USER = 'MentionUser',
	COMMUNITY_NOTIFICATION = 'CommunityNotification',
	ADD_TO_EVENT = 'AddToEvent',
	PUBLIC_EVENT = 'PublicEvent',
	COURSE_INSTRUCTOR_ASSIGNMENT = 'CourseInstructorAssignment',
}
