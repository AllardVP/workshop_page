import { supabase } from './supabase.js'
import { 
    getEnvironments, 
    setEnvironments, 
    getSelectedEnvironments, 
    addSelectedEnvironment, 
    removeSelectedEnvironment, 
    clearSelectedEnvironments,
    getUserVotes,
    addUserVote,
    isEnvironmentSelected,
    canSelectMoreEnvironments,
    isValidEnvironmentSelection,
    hasUserVoted,
    setCarouselImages,
    setCarouselIndex,
    getCarouselState,
    clearCarousel,
    getState
} from './state.js'
import { showToast } from './ui.js'
import { getDOMElement, getDOMElements, countBy } from './utils.js'
import { MESSAGES, TOAST_TYPES, VOTE_TYPES, SELECTORS, SUPPORTED_IMAGE_FORMATS } from './constants.js'

// Load environments from Supabase
export async function loadEnvironments() {
    try {
        const { data, error } = await supabase
            .from('environments')
            .select('*')
            .order('created_at')
        
        if (error) throw error
        
        setEnvironments(data)
        await renderEnvironments()
    } catch (error) {
        console.error('Error loading environments:', error)
        showToast('Error loading environments', TOAST_TYPES.ERROR)
    }
}

// Render environment cards
export async function renderEnvironments() {
    const grid = getDOMElement(SELECTORS.ENVIRONMENTS_GRID)
    const loading = getDOMElement(SELECTORS.ENVIRONMENTS_LOADING)
    
    if (!grid || !loading) return
    
    loading.classList.add('hidden')
    
    const environments = getEnvironments()
    
    if (environments.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                <div class="text-4xl mb-4">🏜️</div>
                <p>No environments available yet.</p>
            </div>
        `
        return
    }
    
    grid.innerHTML = ''
    
    // Create cards with background images
    const cardPromises = environments.map(env => createEnvironmentCard(env))
    const cards = await Promise.all(cardPromises)
    
    cards.forEach(card => {
        if (card) grid.appendChild(card)
    })
    
    await loadEnvironmentVoteCounts()
}

// Load first image from environment bucket
async function loadEnvironmentBackgroundImage(environmentId) {
    try {
        const { data: files, error } = await supabase.storage
            .from(environmentId)
            .list('', {
                limit: 1,
                sortBy: { column: 'name', order: 'asc' }
            })
        
        if (error || !files || files.length === 0) {
            return null
        }
        
        const imageFile = files.find(file => 
            file.name.toLowerCase().match(SUPPORTED_IMAGE_FORMATS)
        )
        
        if (!imageFile) {
            return null
        }
        
        const { data } = supabase.storage
            .from(environmentId)
            .getPublicUrl(imageFile.name)
            
        return data.publicUrl
    } catch (error) {
        console.error(`Error loading background image for ${environmentId}:`, error)
        return null
    }
}

// Create environment card element with background image
async function createEnvironmentCard(env) {
    const card = document.createElement('div')
    card.className = 'environment-card'
    card.dataset.envId = env.id
    
    // Load background image
    const backgroundImageUrl = await loadEnvironmentBackgroundImage(env.id)
    
    card.innerHTML = `
        <div class="environment-card-content ${backgroundImageUrl ? 'has-background' : ''}">
            ${backgroundImageUrl ? `
                <div class="environment-card-background" style="background-image: url('${backgroundImageUrl}')"></div>
                <div class="environment-card-overlay"></div>
            ` : ''}
            <div class="environment-card-text">
                <div class="environment-card-text-bg"></div>
                <div class="absolute top-3 right-3 z-20">
                    <button class="camera-btn bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-full p-2.5 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200/50 dark:border-gray-700/50" 
                            data-env-id="${env.id}" 
                            title="View images">
                        <svg class="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                    </button>
                </div>
                <div class="text-center relative z-10 p-6">
                    <div class="text-4xl mb-4">${env.emoji}</div>
                    <h3 class="font-bold text-2xl mb-3 text-black dark:text-white leading-tight">${env.name}</h3>
                    <p class="text-gray-800 dark:text-gray-100 text-base mb-6 leading-relaxed">${env.description}</p>
                    <div class="vote-count text-sm text-gray-700 dark:text-gray-200 bg-gray-100/90 dark:bg-gray-700/90 backdrop-blur-sm rounded-full px-4 py-2 inline-block font-medium shadow-sm">
                        <span class="votes-num">0</span> votes
                    </div>
                </div>
            </div>
        </div>
    `
    
    // Add event listeners
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.camera-btn')) {
            toggleEnvironmentSelection(env.id, card)
        }
    })
    
    const cameraBtn = card.querySelector('.camera-btn')
    cameraBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        openImageModal(env)
    })
    
    return card
}

// Toggle environment selection
export function toggleEnvironmentSelection(envId, card) {
    const selectedEnvironments = getSelectedEnvironments()
    
    if (isEnvironmentSelected(envId)) {
        removeSelectedEnvironment(envId)
        card.classList.remove('selected')
    } else {
        if (!canSelectMoreEnvironments()) {
            showToast(MESSAGES.ENVIRONMENT_LIMIT, TOAST_TYPES.WARNING)
            return
        }
        addSelectedEnvironment(envId)
        card.classList.add('selected')
    }
    
    updateVoteButton()
}

// Update vote button state
export function updateVoteButton() {
    const btn = getDOMElement(SELECTORS.VOTE_ENVIRONMENTS_BTN)
    if (!btn) return
    
    const isValid = isValidEnvironmentSelection()
    const hasVoted = getUserVotes().environments.size > 0
    
    btn.disabled = !isValid || hasVoted
    
    if (hasVoted) {
        btn.textContent = 'You have already voted'
        btn.className = 'bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 cursor-not-allowed'
    } else {
        btn.textContent = 'Vote for Selected Locations'
        btn.className = 'btn-primary'
    }
}

// Submit environment votes
export async function submitEnvironmentVotes() {
    const selectedEnvironments = getSelectedEnvironments()
    const userVotes = getUserVotes()
    
    if (!isValidEnvironmentSelection()) {
        showToast(MESSAGES.ENVIRONMENT_LIMIT, TOAST_TYPES.WARNING)
        return
    }
    
    if (userVotes.environments.size > 0) {
        showToast(MESSAGES.ALREADY_VOTED_ENV, TOAST_TYPES.WARNING)
        return
    }
    
    try {
        const votes = Array.from(selectedEnvironments).map(envId => ({
            voter_session: getState().userSession,
            vote_type: VOTE_TYPES.ENVIRONMENT,
            target_id: envId
        }))
        
        const { error } = await supabase
            .from('votes')
            .insert(votes)
        
        if (error) throw error
        
        // Update local state
        selectedEnvironments.forEach(envId => addUserVote('environments', envId))
        
        showToast(MESSAGES.VOTE_SUCCESS, TOAST_TYPES.SUCCESS)
        updateVoteButton()
        await loadEnvironmentVoteCounts()
        
        // Clear selections
        clearSelectedEnvironments()
        const cards = getDOMElements('.environment-card')
        cards.forEach(card => card.classList.remove('selected'))
        
    } catch (error) {
        console.error('Error submitting votes:', error)
        showToast(MESSAGES.VOTE_ERROR, TOAST_TYPES.ERROR)
    }
}

// Load environment vote counts
export async function loadEnvironmentVoteCounts() {
    try {
        const { data, error } = await supabase
            .from('votes')
            .select('target_id')
            .eq('vote_type', VOTE_TYPES.ENVIRONMENT)
        
        if (error) throw error
        
        const counts = countBy(data, 'target_id')
        
        // Update UI
        getEnvironments().forEach(env => {
            const card = document.querySelector(`[data-env-id="${env.id}"]`)
            if (card) {
                const voteCount = card.querySelector('.votes-num')
                voteCount.textContent = counts[env.id] || 0
            }
        })
        
    } catch (error) {
        console.error('Error loading vote counts:', error)
    }
}

// Open image modal
export async function openImageModal(environment) {
    const modal = getDOMElement(SELECTORS.IMAGE_MODAL)
    const modalTitle = getDOMElement(SELECTORS.MODAL_TITLE)
    const modalDescription = getDOMElement(SELECTORS.MODAL_DESCRIPTION)
    
    if (!modal || !modalTitle || !modalDescription) return
    
    modalTitle.textContent = `${environment.emoji} ${environment.name}`
    modalDescription.textContent = environment.description
    
    modal.classList.remove('hidden')
    
    // Show loading state
    const loading = getDOMElement(SELECTORS.CAROUSEL_LOADING)
    const images = getDOMElement(SELECTORS.CAROUSEL_IMAGES)
    const dots = getDOMElement(SELECTORS.CAROUSEL_DOTS)
    const error = getDOMElement(SELECTORS.CAROUSEL_ERROR)
    const prev = getDOMElement(SELECTORS.CAROUSEL_PREV)
    const next = getDOMElement(SELECTORS.CAROUSEL_NEXT)
    
    loading?.classList.remove('hidden')
    if (images) images.innerHTML = ''
    if (dots) dots.innerHTML = ''
    error?.classList.add('hidden')
    prev?.classList.add('hidden')
    next?.classList.add('hidden')
    
    try {
        const { data: files, error: storageError } = await supabase.storage
            .from(environment.id)
            .list('', {
                limit: 20,
                sortBy: { column: 'name', order: 'asc' }
            })
        
        if (storageError) throw storageError
        
        if (!files || files.length === 0) {
            loading?.classList.add('hidden')
            error?.classList.remove('hidden')
            return
        }
        
        const imageFiles = files.filter(file => 
            file.name.toLowerCase().match(SUPPORTED_IMAGE_FORMATS)
        )
        
        if (imageFiles.length === 0) {
            loading?.classList.add('hidden')
            error?.classList.remove('hidden')
            return
        }
        
        const imageUrls = imageFiles.map(file => {
            const { data } = supabase.storage
                .from(environment.id)
                .getPublicUrl(file.name)
            return data.publicUrl
        })
        
        setCarouselImages(imageUrls)
        await renderCarousel()
        
    } catch (error) {
        console.error('Error loading environment images:', error)
        loading?.classList.add('hidden')
        error?.classList.remove('hidden')
    }
}

// Render carousel
export async function renderCarousel() {
    const { currentEnvironmentImages, currentImageIndex } = getCarouselState()
    
    if (currentEnvironmentImages.length === 0) return
    
    const loading = getDOMElement(SELECTORS.CAROUSEL_LOADING)
    const imagesContainer = getDOMElement(SELECTORS.CAROUSEL_IMAGES)
    const dotsContainer = getDOMElement(SELECTORS.CAROUSEL_DOTS)
    const prev = getDOMElement(SELECTORS.CAROUSEL_PREV)
    const next = getDOMElement(SELECTORS.CAROUSEL_NEXT)
    
    loading?.classList.add('hidden')
    
    if (imagesContainer) {
        imagesContainer.innerHTML = ''
        
        currentEnvironmentImages.forEach((url, index) => {
            const img = document.createElement('img')
            img.src = url
            img.alt = `Environment image ${index + 1}`
            img.className = `carousel-image ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`
            img.onerror = () => img.style.display = 'none'
            imagesContainer.appendChild(img)
        })
    }
    
    if (dotsContainer && currentEnvironmentImages.length > 1) {
        dotsContainer.innerHTML = ''
        
        currentEnvironmentImages.forEach((_, index) => {
            const dot = document.createElement('button')
            dot.className = `carousel-dot ${index === currentImageIndex ? 'active' : ''}`
            dot.addEventListener('click', () => {
                setCarouselIndex(index)
                updateCarouselDisplay()
            })
            dotsContainer.appendChild(dot)
        })
        
        prev?.classList.remove('hidden')
        next?.classList.remove('hidden')
    }
}

// Navigate carousel
export function navigateCarousel(direction) {
    const { currentEnvironmentImages, currentImageIndex } = getCarouselState()
    
    if (currentEnvironmentImages.length <= 1) return
    
    let newIndex = currentImageIndex + direction
    
    if (newIndex < 0) {
        newIndex = currentEnvironmentImages.length - 1
    } else if (newIndex >= currentEnvironmentImages.length) {
        newIndex = 0
    }
    
    setCarouselIndex(newIndex)
    updateCarouselDisplay()
}

// Update carousel display
export function updateCarouselDisplay() {
    const { currentImageIndex } = getCarouselState()
    
    // Update images
    const images = getDOMElements('.carousel-image')
    images.forEach((img, index) => {
        img.classList.toggle('opacity-100', index === currentImageIndex)
        img.classList.toggle('opacity-0', index !== currentImageIndex)
    })
    
    // Update dots
    const dots = getDOMElements('.carousel-dot')
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentImageIndex)
    })
}

// Close image modal
export function closeImageModal() {
    const modal = getDOMElement(SELECTORS.IMAGE_MODAL)
    modal?.classList.add('hidden')
    clearCarousel()
} 