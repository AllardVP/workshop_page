import { TOAST_TYPES, APP_CONFIG, SELECTORS } from './constants.js'
import { getDOMElement, isEscapeKey, isArrowKey } from './utils.js'

// Toast functionality
export function showToast(message, type = TOAST_TYPES.SUCCESS) {
    const toast = getDOMElement(SELECTORS.TOAST)
    const toastMessage = getDOMElement(SELECTORS.TOAST_MESSAGE)
    
    if (!toast || !toastMessage) return
    
    // Set color based on type
    const colorClasses = {
        [TOAST_TYPES.SUCCESS]: 'bg-green-500 text-white',
        [TOAST_TYPES.ERROR]: 'bg-red-500 text-white',
        [TOAST_TYPES.WARNING]: 'bg-yellow-500 text-white',
        [TOAST_TYPES.INFO]: 'bg-blue-500 text-white'
    }
    
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 z-50 ${colorClasses[type] || colorClasses[TOAST_TYPES.INFO]}`
    
    toastMessage.textContent = message
    
    // Show toast
    toast.classList.remove('hidden', 'translate-x-full')
    
    // Hide after configured duration
    setTimeout(() => {
        toast.classList.add('translate-x-full')
        
        // Hide completely after animation
        setTimeout(() => {
            toast.classList.add('hidden')
        }, 300) // Match the transition duration
    }, APP_CONFIG.TOAST_DURATION)
}

// Tab switching functionality
export function switchTab(activeTab) {
    const votingTab = getDOMElement(SELECTORS.VOTING_TAB)
    const workshopTab = getDOMElement(SELECTORS.WORKSHOP_TAB)
    const votingPage = getDOMElement(SELECTORS.VOTING_PAGE)
    const workshopPage = getDOMElement(SELECTORS.WORKSHOP_PAGE)
    
    if (!votingTab || !workshopTab || !votingPage || !workshopPage) return
    
    const activeClasses = 'bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-primary-100'
    const inactiveClasses = 'text-gray-600 dark:text-gray-400'
    
    if (activeTab === 'voting') {
        votingTab.className = `px-4 py-2 rounded-md font-medium transition-colors duration-200 ${activeClasses}`
        workshopTab.className = `px-4 py-2 rounded-md font-medium transition-colors duration-200 ${inactiveClasses} hover:text-primary-600 dark:hover:text-primary-400`
        
        votingPage.classList.remove('hidden')
        workshopPage.classList.add('hidden')
    } else {
        workshopTab.className = `px-4 py-2 rounded-md font-medium transition-colors duration-200 ${activeClasses}`
        votingTab.className = `px-4 py-2 rounded-md font-medium transition-colors duration-200 ${inactiveClasses} hover:text-primary-600 dark:hover:text-primary-400`
        
        workshopPage.classList.remove('hidden')
        votingPage.classList.add('hidden')
    }
}

// Modal functionality
export function openModal() {
    const modal = getDOMElement(SELECTORS.IMAGE_MODAL)
    if (modal) {
        modal.classList.remove('hidden')
    }
}

export function closeModal() {
    const modal = getDOMElement(SELECTORS.IMAGE_MODAL)
    if (modal) {
        modal.classList.add('hidden')
    }
}

// Character counter with debouncing
export function updateCharacterCount(inputElement, counterElement, maxLength = APP_CONFIG.MAX_SCRIPT_LENGTH) {
    const count = inputElement.value.length
    counterElement.textContent = `${count} / ${maxLength}`
    
    if (count > maxLength) {
        counterElement.classList.add('text-red-500')
        return false
    } else {
        counterElement.classList.remove('text-red-500')
        return true
    }
}

// Keyboard event handlers
export function setupKeyboardNavigation(callbacks) {
    const { onEscape, onArrowLeft, onArrowRight } = callbacks
    
    document.addEventListener('keydown', (e) => {
        const modal = getDOMElement(SELECTORS.IMAGE_MODAL)
        if (modal?.classList.contains('hidden')) return
        
        if (isEscapeKey(e)) {
            onEscape?.()
        } else if (e.key === 'ArrowLeft') {
            onArrowLeft?.()
        } else if (e.key === 'ArrowRight') {
            onArrowRight?.()
        }
    })
}

// Animate elements on page load
export function animatePageElements() {
    setTimeout(() => {
        const fadeElements = document.querySelectorAll('.animate-fade-in')
        fadeElements.forEach(el => el.classList.add('visible'))
    }, APP_CONFIG.FADE_IN_DELAY)
}

// Loading state management
export function showLoading(element) {
    element?.classList.remove('hidden')
}

export function hideLoading(element) {
    element?.classList.add('hidden')
}

// Error state management
export function showError(element) {
    element?.classList.remove('hidden')
}

export function hideError(element) {
    element?.classList.add('hidden')
} 