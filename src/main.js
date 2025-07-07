import { setupRealtimeSubscriptions } from './supabase.js'
import { loadEnvironments, submitEnvironmentVotes, navigateCarousel, closeImageModal } from './environments.js'
import { loadScriptIdeas, submitScriptIdea, setupCharacterCount, loadUserVotes } from './scripts.js'
import { switchTab, showToast, setupKeyboardNavigation, animatePageElements } from './ui.js'
import { getDOMElement, isEnterWithModifier } from './utils.js'
import { SELECTORS, MESSAGES, TOAST_TYPES } from './constants.js'

// Initialize the application
async function initializeApp() {
    try {
        // Load initial data
        await Promise.all([
            loadEnvironments(),
            loadScriptIdeas(),
            loadUserVotes()
        ])
        
        setupEventListeners()
        setupRealtimeSubscriptions({
            onVotesChange: handleVotesChange,
            onScriptIdeasChange: handleScriptIdeasChange
        })
        
        // Animate page elements
        animatePageElements()
        
        console.log('Application initialized successfully')
        
    } catch (error) {
        console.error('Error initializing app:', error)
        showToast(MESSAGES.LOADING_ERROR, TOAST_TYPES.ERROR)
    }
}

// Setup all event listeners
function setupEventListeners() {
    setupTabNavigation()
    setupEnvironmentInteractions()
    setupScriptInteractions()
    setupModalInteractions()
    setupCharacterCount()
}

// Setup tab navigation
function setupTabNavigation() {
    const votingTab = getDOMElement(SELECTORS.VOTING_TAB)
    const workshopTab = getDOMElement(SELECTORS.WORKSHOP_TAB)
    
    votingTab?.addEventListener('click', () => switchTab('voting'))
    workshopTab?.addEventListener('click', () => switchTab('workshop'))
}

// Setup environment-related interactions
function setupEnvironmentInteractions() {
    const voteBtn = getDOMElement(SELECTORS.VOTE_ENVIRONMENTS_BTN)
    voteBtn?.addEventListener('click', submitEnvironmentVotes)
}

// Setup script-related interactions
function setupScriptInteractions() {
    const submitBtn = getDOMElement(SELECTORS.SUBMIT_SCRIPT_IDEA_BTN)
    const input = getDOMElement(SELECTORS.SCRIPT_IDEA_INPUT)
    
    submitBtn?.addEventListener('click', submitScriptIdea)
    
    // Handle Cmd/Ctrl+Enter for quick submission
    input?.addEventListener('keydown', (e) => {
        if (isEnterWithModifier(e)) {
            e.preventDefault()
            submitScriptIdea()
        }
    })
}

// Setup modal interactions
function setupModalInteractions() {
    const modal = getDOMElement(SELECTORS.IMAGE_MODAL)
    const modalClose = getDOMElement(SELECTORS.MODAL_CLOSE)
    const carouselPrev = getDOMElement(SELECTORS.CAROUSEL_PREV)
    const carouselNext = getDOMElement(SELECTORS.CAROUSEL_NEXT)
    
    // Close modal events
    modalClose?.addEventListener('click', closeImageModal)
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeImageModal()
    })
    
    // Carousel navigation
    carouselPrev?.addEventListener('click', () => navigateCarousel(-1))
    carouselNext?.addEventListener('click', () => navigateCarousel(1))
    
    // Keyboard navigation
    setupKeyboardNavigation({
        onEscape: closeImageModal,
        onArrowLeft: () => navigateCarousel(-1),
        onArrowRight: () => navigateCarousel(1)
    })
}

// Handle realtime votes changes
function handleVotesChange() {
    // Reload vote counts when votes change
    import('./environments.js').then(({ loadEnvironmentVoteCounts }) => {
        loadEnvironmentVoteCounts()
    })
    
    import('./scripts.js').then(({ loadScriptVoteCounts }) => {
        loadScriptVoteCounts()
    })
}

// Handle realtime script ideas changes
function handleScriptIdeasChange() {
    // Reload script ideas when new ones are added
    loadScriptIdeas()
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Ensure modal is hidden initially
    const modal = getDOMElement(SELECTORS.IMAGE_MODAL)
    modal?.classList.add('hidden')
    
    // Initialize the application
    initializeApp()
})

// Export for potential external use
export { initializeApp } 