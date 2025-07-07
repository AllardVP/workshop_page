// Application Constants
export const APP_CONFIG = {
    MAX_ENVIRONMENTS: 2,
    MAX_SCRIPT_LENGTH: 500,
    TOAST_DURATION: 3000,
    CAROUSEL_TRANSITION_DURATION: 300,
    FADE_IN_DELAY: 100,
    SESSION_STORAGE_KEY: 'workshop-session'
}

export const VOTE_TYPES = {
    ENVIRONMENT: 'environment',
    SCRIPT: 'script'
}

export const TOAST_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
}

export const SUPPORTED_IMAGE_FORMATS = /\.(jpg|jpeg|png|gif|webp)$/i

export const VIDEO_CONFIG = {
    MOBILE_BREAKPOINT: 768,
    INTERSECTION_THRESHOLD: 0.1,
    LOAD_DELAY: 300,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    LOAD_TIMEOUT: 15000
}

export const MESSAGES = {
    ENVIRONMENT_LIMIT: 'You can only select 2 environments',
    ALREADY_VOTED_ENV: 'You have already voted for environments',
    ALREADY_VOTED_SCRIPT: 'You have already voted for this idea',
    SCRIPT_TOO_LONG: 'Script idea must be 500 characters or less',
    SCRIPT_EMPTY: 'Please enter a script idea',
    VOTE_SUCCESS: 'Vote submitted successfully!',
    SCRIPT_SUCCESS: 'Script idea submitted successfully!',
    LOADING_ERROR: 'Error loading application. Please refresh the page.',
    VOTE_ERROR: 'Error submitting vote',
    SCRIPT_ERROR: 'Error submitting script idea'
}

export const SELECTORS = {
    VOTING_TAB: '#voting-tab',
    WORKSHOP_TAB: '#workshop-tab',
    VOTING_PAGE: '#voting-page',
    WORKSHOP_PAGE: '#workshop-page',
    ENVIRONMENTS_GRID: '#environments-grid',
    ENVIRONMENTS_LOADING: '#environments-loading',
    VOTE_ENVIRONMENTS_BTN: '#vote-environments',
    SCRIPT_IDEAS_LIST: '#script-ideas-list',
    SCRIPT_IDEA_INPUT: '#script-idea-input',
    SUBMIT_SCRIPT_IDEA_BTN: '#submit-script-idea',
    CHAR_COUNT: '#char-count',
    TOAST: '#toast',
    TOAST_MESSAGE: '#toast-message',
    IMAGE_MODAL: '#image-modal',
    MODAL_TITLE: '#modal-title',
    MODAL_DESCRIPTION: '#modal-description',
    MODAL_CLOSE: '#modal-close',
    CAROUSEL_CONTAINER: '#carousel-container',
    CAROUSEL_LOADING: '#carousel-loading',
    CAROUSEL_IMAGES: '#carousel-images',
    CAROUSEL_PREV: '#carousel-prev',
    CAROUSEL_NEXT: '#carousel-next',
    CAROUSEL_DOTS: '#carousel-dots',
    CAROUSEL_ERROR: '#carousel-error'
} 