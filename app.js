import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration. Please check your environment variables.')
    throw new Error('Missing Supabase configuration')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Session management
let userSession = localStorage.getItem('workshop-session')
if (!userSession) {
    userSession = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('workshop-session', userSession)
}

// State management
let environments = []
let scriptIdeas = []
let selectedEnvironments = new Set()
let userVotes = {
    environments: new Set(),
    scripts: new Set()
}

// Carousel state
let currentImageIndex = 0
let currentEnvironmentImages = []

// DOM elements
const votingTab = document.getElementById('voting-tab')
const workshopTab = document.getElementById('workshop-tab')
const votingPage = document.getElementById('voting-page')
const workshopPage = document.getElementById('workshop-page')
const environmentsGrid = document.getElementById('environments-grid')
const environmentsLoading = document.getElementById('environments-loading')
const voteEnvironmentsBtn = document.getElementById('vote-environments')
const scriptIdeasList = document.getElementById('script-ideas-list')
const scriptIdeaInput = document.getElementById('script-idea-input')
const submitScriptIdeaBtn = document.getElementById('submit-script-idea')
const charCount = document.getElementById('char-count')
const toast = document.getElementById('toast')
const toastMessage = document.getElementById('toast-message')

// Modal elements
const imageModal = document.getElementById('image-modal')
const modalTitle = document.getElementById('modal-title')
const modalDescription = document.getElementById('modal-description')
const modalClose = document.getElementById('modal-close')
const carouselContainer = document.getElementById('carousel-container')
const carouselLoading = document.getElementById('carousel-loading')
const carouselImages = document.getElementById('carousel-images')
const carouselPrev = document.getElementById('carousel-prev')
const carouselNext = document.getElementById('carousel-next')
const carouselDots = document.getElementById('carousel-dots')
const carouselError = document.getElementById('carousel-error')

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await Promise.all([
            loadEnvironments(),
            loadScriptIdeas(),
            loadUserVotes()
        ])
        
        setupEventListeners()
        setupRealtimeSubscriptions()
        
        // Animate page elements
        setTimeout(() => {
            const fadeElements = document.querySelectorAll('.animate-fade-in')
            fadeElements.forEach(el => el.classList.add('visible'))
        }, 100)
    } catch (error) {
        console.error('Error initializing app:', error)
        showToast('Error loading application. Please refresh the page.', 'error')
    }
})

// Setup event listeners
function setupEventListeners() {
    // Tab navigation
    votingTab.addEventListener('click', () => switchTab('voting'))
    workshopTab.addEventListener('click', () => switchTab('workshop'))
    
    // Environment voting
    voteEnvironmentsBtn.addEventListener('click', submitEnvironmentVotes)
    
    // Script idea submission
    scriptIdeaInput.addEventListener('input', updateCharCount)
    submitScriptIdeaBtn.addEventListener('click', submitScriptIdea)
    
    // Enter key to submit script idea
    scriptIdeaInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            submitScriptIdea()
        }
    })
    
    // Modal events
    modalClose.addEventListener('click', closeImageModal)
    imageModal.addEventListener('click', (e) => {
        if (e.target === imageModal) closeImageModal()
    })
    
    // Carousel navigation
    carouselPrev.addEventListener('click', () => navigateCarousel(-1))
    carouselNext.addEventListener('click', () => navigateCarousel(1))
    
    // Keyboard navigation for modal
    document.addEventListener('keydown', (e) => {
        if (imageModal.classList.contains('hidden')) return
        
        if (e.key === 'Escape') {
            closeImageModal()
        } else if (e.key === 'ArrowLeft') {
            navigateCarousel(-1)
        } else if (e.key === 'ArrowRight') {
            navigateCarousel(1)
        }
    })
}

// Tab switching
function switchTab(tab) {
    if (tab === 'voting') {
        votingTab.classList.add('bg-primary-100', 'text-primary-800', 'dark:bg-primary-800', 'dark:text-primary-100')
        votingTab.classList.remove('text-gray-600', 'dark:text-gray-400')
        workshopTab.classList.remove('bg-primary-100', 'text-primary-800', 'dark:bg-primary-800', 'dark:text-primary-100')
        workshopTab.classList.add('text-gray-600', 'dark:text-gray-400')
        
        votingPage.classList.remove('hidden')
        workshopPage.classList.add('hidden')
    } else {
        workshopTab.classList.add('bg-primary-100', 'text-primary-800', 'dark:bg-primary-800', 'dark:text-primary-100')
        workshopTab.classList.remove('text-gray-600', 'dark:text-gray-400')
        votingTab.classList.remove('bg-primary-100', 'text-primary-800', 'dark:bg-primary-800', 'dark:text-primary-100')
        votingTab.classList.add('text-gray-600', 'dark:text-gray-400')
        
        workshopPage.classList.remove('hidden')
        votingPage.classList.add('hidden')
    }
}

// Load environments from Supabase
async function loadEnvironments() {
    try {
        const { data, error } = await supabase
            .from('environments')
            .select('*')
            .order('created_at')
        
        if (error) throw error
        
        environments = data
        await renderEnvironments()
    } catch (error) {
        console.error('Error loading environments:', error)
        showToast('Error loading environments', 'error')
    }
}

// Render environment cards
async function renderEnvironments() {
    const grid = environmentsGrid
    
    // Hide loading state
    environmentsLoading.classList.add('hidden')
    
    if (environments.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                <div class="text-4xl mb-4">🏜️</div>
                <p>No environments available yet.</p>
            </div>
        `
        return
    }
    
    // Clear existing content
    grid.innerHTML = ''
    
    for (const env of environments) {
        const card = document.createElement('div')
        card.className = 'environment-card'
        card.dataset.envId = env.id
        
        card.innerHTML = `
            <div class="text-center relative">
                <div class="absolute top-2 right-2">
                    <button class="camera-btn bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow duration-200" 
                            data-env-id="${env.id}" 
                            title="View images">
                        <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                    </button>
                </div>
                <div class="text-4xl mb-3">${env.emoji}</div>
                <h3 class="font-semibold text-lg mb-2">${env.name}</h3>
                <p class="text-gray-600 dark:text-gray-300 text-sm mb-4">${env.description}</p>
                <div class="vote-count text-sm text-gray-500 dark:text-gray-400">
                    <span class="votes-num">0</span> votes
                </div>
            </div>
        `
        
        // Add click event for selection
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.camera-btn')) {
                toggleEnvironmentSelection(env.id, card)
            }
        })
        
        // Add camera button click event
        const cameraBtn = card.querySelector('.camera-btn')
        cameraBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            openImageModal(env)
        })
        
        grid.appendChild(card)
    }
    
    // Load vote counts
    await loadEnvironmentVoteCounts()
}

// Toggle environment selection
function toggleEnvironmentSelection(envId, card) {
    if (selectedEnvironments.has(envId)) {
        selectedEnvironments.delete(envId)
        card.classList.remove('selected')
    } else {
        if (selectedEnvironments.size >= 2) {
            showToast('You can only select 2 environments', 'warning')
            return
        }
        selectedEnvironments.add(envId)
        card.classList.add('selected')
    }
    
    updateVoteButton()
}

// Update vote button state
function updateVoteButton() {
    const btn = voteEnvironmentsBtn
    const isValid = selectedEnvironments.size === 2
    const hasVoted = userVotes.environments.size > 0
    
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
async function submitEnvironmentVotes() {
    if (selectedEnvironments.size !== 2) {
        showToast('Please select exactly 2 environments', 'warning')
        return
    }
    
    if (userVotes.environments.size > 0) {
        showToast('You have already voted for environments', 'warning')
        return
    }
    
    try {
        const votes = Array.from(selectedEnvironments).map(envId => ({
            voter_session: userSession,
            vote_type: 'environment',
            target_id: envId
        }))
        
        const { error } = await supabase
            .from('votes')
            .insert(votes)
        
        if (error) throw error
        
        // Update local state
        selectedEnvironments.forEach(envId => userVotes.environments.add(envId))
        
        showToast('Votes submitted successfully!', 'success')
        updateVoteButton()
        await loadEnvironmentVoteCounts()
        
        // Clear selections
        selectedEnvironments.clear()
        const cards = document.querySelectorAll('.environment-card')
        cards.forEach(card => card.classList.remove('selected'))
        
    } catch (error) {
        console.error('Error submitting votes:', error)
        showToast('Error submitting votes', 'error')
    }
}

// Load environment vote counts
async function loadEnvironmentVoteCounts() {
    try {
        const { data, error } = await supabase
            .from('votes')
            .select('target_id')
            .eq('vote_type', 'environment')
        
        if (error) throw error
        
        const counts = {}
        data.forEach(vote => {
            counts[vote.target_id] = (counts[vote.target_id] || 0) + 1
        })
        
        // Update UI
        environments.forEach(env => {
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
async function openImageModal(environment) {
    modalTitle.textContent = `${environment.emoji} ${environment.name}`
    modalDescription.textContent = environment.description
    
    // Show modal
    imageModal.classList.remove('hidden')
    
    // Show loading state
    carouselLoading.classList.remove('hidden')
    carouselImages.innerHTML = ''
    carouselDots.innerHTML = ''
    carouselError.classList.add('hidden')
    carouselPrev.classList.add('hidden')
    carouselNext.classList.add('hidden')
    
    try {
        // Load images from Supabase storage
        const { data: files, error } = await supabase.storage
            .from('environments')
            .list(environment.id, {
                limit: 20,
                sortBy: { column: 'name', order: 'asc' }
            })
        
        if (error) throw error
        
        // Filter for image files
        const imageFiles = files.filter(file => 
            file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)
        )
        
        if (imageFiles.length === 0) {
            carouselLoading.classList.add('hidden')
            carouselError.classList.remove('hidden')
            return
        }
        
        // Get public URLs for images
        const imageUrls = imageFiles.map(file => {
            const { data } = supabase.storage
                .from('environments')
                .getPublicUrl(`${environment.id}/${file.name}`)
            return data.publicUrl
        })
        
        currentEnvironmentImages = imageUrls
        currentImageIndex = 0
        
        await renderCarousel()
        
    } catch (error) {
        console.error('Error loading environment images:', error)
        carouselLoading.classList.add('hidden')
        carouselError.classList.remove('hidden')
    }
}

// Render carousel
async function renderCarousel() {
    if (currentEnvironmentImages.length === 0) return
    
    carouselLoading.classList.add('hidden')
    carouselImages.innerHTML = ''
    carouselDots.innerHTML = ''
    
    // Create image elements
    currentEnvironmentImages.forEach((url, index) => {
        const img = document.createElement('img')
        img.src = url
        img.alt = `Environment image ${index + 1}`
        img.className = `carousel-image ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`
        img.onerror = () => {
            img.style.display = 'none'
        }
        carouselImages.appendChild(img)
    })
    
    // Create dots
    if (currentEnvironmentImages.length > 1) {
        currentEnvironmentImages.forEach((_, index) => {
            const dot = document.createElement('button')
            dot.className = `carousel-dot ${index === currentImageIndex ? 'active' : ''}`
            dot.addEventListener('click', () => {
                currentImageIndex = index
                updateCarouselDisplay()
            })
            carouselDots.appendChild(dot)
        })
        
        // Show navigation buttons
        carouselPrev.classList.remove('hidden')
        carouselNext.classList.remove('hidden')
    }
}

// Navigate carousel
function navigateCarousel(direction) {
    if (currentEnvironmentImages.length <= 1) return
    
    currentImageIndex += direction
    
    if (currentImageIndex < 0) {
        currentImageIndex = currentEnvironmentImages.length - 1
    } else if (currentImageIndex >= currentEnvironmentImages.length) {
        currentImageIndex = 0
    }
    
    updateCarouselDisplay()
}

// Update carousel display
function updateCarouselDisplay() {
    // Update images
    const images = carouselImages.querySelectorAll('.carousel-image')
    images.forEach((img, index) => {
        img.classList.toggle('opacity-100', index === currentImageIndex)
        img.classList.toggle('opacity-0', index !== currentImageIndex)
    })
    
    // Update dots
    const dots = carouselDots.querySelectorAll('.carousel-dot')
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentImageIndex)
    })
}

// Close image modal
function closeImageModal() {
    imageModal.classList.add('hidden')
    currentEnvironmentImages = []
    currentImageIndex = 0
}

// Load script ideas
async function loadScriptIdeas() {
    try {
        const { data, error } = await supabase
            .from('script_ideas')
            .select('*')
            .order('created_at', { ascending: false })
        
        if (error) throw error
        
        scriptIdeas = data
        renderScriptIdeas()
    } catch (error) {
        console.error('Error loading script ideas:', error)
        showToast('Error loading script ideas', 'error')
    }
}

// Render script ideas
function renderScriptIdeas() {
    const container = scriptIdeasList
    
    if (scriptIdeas.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <div class="text-4xl mb-4">💡</div>
                <p>No script ideas yet. Be the first to share your creativity!</p>
            </div>
        `
        return
    }
    
    container.innerHTML = ''
    
    scriptIdeas.forEach(idea => {
        const card = document.createElement('div')
        card.className = 'script-card'
        card.dataset.ideaId = idea.id
        
        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                    <p class="text-gray-800 dark:text-gray-200 leading-relaxed">${escapeHtml(idea.idea)}</p>
                </div>
                <div class="ml-4 flex flex-col items-center">
                    <button class="vote-script-btn p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200" data-idea-id="${idea.id}">
                        <svg class="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                    </button>
                    <span class="vote-count text-sm text-gray-500 dark:text-gray-400 mt-1">0</span>
                </div>
            </div>
            <div class="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                <span>Submitted ${formatDate(idea.created_at)}</span>
                <span class="vote-status"></span>
            </div>
        `
        
        const voteBtn = card.querySelector('.vote-script-btn')
        voteBtn.addEventListener('click', () => toggleScriptVote(idea.id))
        
        container.appendChild(card)
    })
    
    loadScriptVoteCounts()
}

// Submit script idea
async function submitScriptIdea() {
    const idea = scriptIdeaInput.value.trim()
    
    if (!idea) {
        showToast('Please enter a script idea', 'warning')
        return
    }
    
    if (idea.length > 500) {
        showToast('Script idea must be 500 characters or less', 'warning')
        return
    }
    
    try {
        const { error } = await supabase
            .from('script_ideas')
            .insert({
                idea: idea,
                author_session: userSession
            })
        
        if (error) throw error
        
        scriptIdeaInput.value = ''
        updateCharCount()
        showToast('Script idea submitted successfully!', 'success')
        
        // Reload script ideas
        await loadScriptIdeas()
        
    } catch (error) {
        console.error('Error submitting script idea:', error)
        showToast('Error submitting script idea', 'error')
    }
}

// Toggle script vote
async function toggleScriptVote(ideaId) {
    if (userVotes.scripts.has(ideaId)) {
        showToast('You have already voted for this idea', 'warning')
        return
    }
    
    try {
        const { error } = await supabase
            .from('votes')
            .insert({
                voter_session: userSession,
                vote_type: 'script',
                target_id: ideaId
            })
        
        if (error) throw error
        
        userVotes.scripts.add(ideaId)
        showToast('Vote submitted!', 'success')
        loadScriptVoteCounts()
        
    } catch (error) {
        console.error('Error voting for script:', error)
        showToast('Error submitting vote', 'error')
    }
}

// Load script vote counts
async function loadScriptVoteCounts() {
    try {
        const { data, error } = await supabase
            .from('votes')
            .select('target_id')
            .eq('vote_type', 'script')
        
        if (error) throw error
        
        const counts = {}
        data.forEach(vote => {
            counts[vote.target_id] = (counts[vote.target_id] || 0) + 1
        })
        
        // Update UI
        scriptIdeas.forEach(idea => {
            const card = document.querySelector(`[data-idea-id="${idea.id}"]`)
            if (card) {
                const voteCount = card.querySelector('.vote-count')
                const voteBtn = card.querySelector('.vote-script-btn')
                const voteStatus = card.querySelector('.vote-status')
                
                voteCount.textContent = counts[idea.id] || 0
                
                if (userVotes.scripts.has(idea.id)) {
                    voteBtn.classList.add('text-red-500')
                    voteStatus.textContent = 'You voted for this'
                } else {
                    voteBtn.classList.remove('text-red-500')
                    voteStatus.textContent = ''
                }
            }
        })
        
    } catch (error) {
        console.error('Error loading script vote counts:', error)
    }
}

// Load user votes
async function loadUserVotes() {
    try {
        const { data, error } = await supabase
            .from('votes')
            .select('vote_type, target_id')
            .eq('voter_session', userSession)
        
        if (error) throw error
        
        data.forEach(vote => {
            if (vote.vote_type === 'environment') {
                userVotes.environments.add(vote.target_id)
            } else if (vote.vote_type === 'script') {
                userVotes.scripts.add(vote.target_id)
            }
        })
        
        updateVoteButton()
        
    } catch (error) {
        console.error('Error loading user votes:', error)
    }
}

// Update character count
function updateCharCount() {
    const count = scriptIdeaInput.value.length
    charCount.textContent = `${count} / 500`
    
    if (count > 500) {
        charCount.classList.add('text-red-500')
        submitScriptIdeaBtn.disabled = true
    } else {
        charCount.classList.remove('text-red-500')
        submitScriptIdeaBtn.disabled = count === 0
    }
}

// Setup real-time subscriptions
function setupRealtimeSubscriptions() {
    // Subscribe to votes changes
    supabase
        .channel('votes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes' }, () => {
            loadEnvironmentVoteCounts()
            loadScriptVoteCounts()
        })
        .subscribe()
    
    // Subscribe to script ideas changes
    supabase
        .channel('script_ideas')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'script_ideas' }, () => {
            loadScriptIdeas()
        })
        .subscribe()
}

// Utility functions
function showToast(message, type = 'success') {
    const toastEl = toast
    const messageEl = toastMessage
    
    // Set color based on type
    toastEl.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 z-50 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        type === 'warning' ? 'bg-yellow-500 text-white' :
        'bg-blue-500 text-white'
    }`
    
    messageEl.textContent = message
    
    // Show toast
    toastEl.classList.remove('translate-x-full')
    
    // Hide after 3 seconds
    setTimeout(() => {
        toastEl.classList.add('translate-x-full')
    }, 3000)
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
} 