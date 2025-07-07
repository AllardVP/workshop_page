import { supabase } from './supabase.js'
import { 
    getScriptIdeas, 
    setScriptIdeas, 
    getUserVotes, 
    addUserVote, 
    getState 
} from './state.js'
import { showToast, updateCharacterCount } from './ui.js'
import { getDOMElement, getDOMElements, escapeHtml, formatDate, countBy, debounce } from './utils.js'
import { MESSAGES, TOAST_TYPES, VOTE_TYPES, SELECTORS, APP_CONFIG } from './constants.js'

// Load script ideas from Supabase
export async function loadScriptIdeas() {
    try {
        const { data, error } = await supabase
            .from('script_ideas')
            .select('*')
            .order('created_at', { ascending: false })
        
        if (error) throw error
        
        setScriptIdeas(data)
        renderScriptIdeas()
    } catch (error) {
        console.error('Error loading script ideas:', error)
        showToast('Error loading script ideas', TOAST_TYPES.ERROR)
    }
}

// Render script ideas
export function renderScriptIdeas() {
    const container = getDOMElement(SELECTORS.SCRIPT_IDEAS_LIST)
    if (!container) return
    
    const scriptIdeas = getScriptIdeas()
    
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
        const card = createScriptCard(idea)
        container.appendChild(card)
    })
    
    loadScriptVoteCounts()
}

// Create script card element
function createScriptCard(idea) {
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
    
    return card
}

// Submit script idea
export async function submitScriptIdea() {
    const input = getDOMElement(SELECTORS.SCRIPT_IDEA_INPUT)
    const submitBtn = getDOMElement(SELECTORS.SUBMIT_SCRIPT_IDEA_BTN)
    
    if (!input || !submitBtn) return
    
    const idea = input.value.trim()
    
    if (!idea) {
        showToast(MESSAGES.SCRIPT_EMPTY, TOAST_TYPES.WARNING)
        return
    }
    
    if (idea.length > APP_CONFIG.MAX_SCRIPT_LENGTH) {
        showToast(MESSAGES.SCRIPT_TOO_LONG, TOAST_TYPES.WARNING)
        return
    }
    
    try {
        submitBtn.disabled = true
        
        const { error } = await supabase
            .from('script_ideas')
            .insert({
                idea: idea,
                author_session: getState().userSession
            })
        
        if (error) throw error
        
        input.value = ''
        updateCharacterCount(input, getDOMElement(SELECTORS.CHAR_COUNT))
        showToast(MESSAGES.SCRIPT_SUCCESS, TOAST_TYPES.SUCCESS)
        
        // Reload script ideas
        await loadScriptIdeas()
        
    } catch (error) {
        console.error('Error submitting script idea:', error)
        showToast(MESSAGES.SCRIPT_ERROR, TOAST_TYPES.ERROR)
    } finally {
        submitBtn.disabled = false
    }
}

// Toggle script vote
export async function toggleScriptVote(ideaId) {
    const userVotes = getUserVotes()
    
    if (userVotes.scripts.has(ideaId)) {
        showToast(MESSAGES.ALREADY_VOTED_SCRIPT, TOAST_TYPES.WARNING)
        return
    }
    
    try {
        const { error } = await supabase
            .from('votes')
            .insert({
                voter_session: getState().userSession,
                vote_type: VOTE_TYPES.SCRIPT,
                target_id: ideaId
            })
        
        if (error) throw error
        
        addUserVote('scripts', ideaId)
        showToast('Vote submitted!', TOAST_TYPES.SUCCESS)
        loadScriptVoteCounts()
        
    } catch (error) {
        console.error('Error voting for script:', error)
        showToast(MESSAGES.VOTE_ERROR, TOAST_TYPES.ERROR)
    }
}

// Load script vote counts
export async function loadScriptVoteCounts() {
    try {
        const { data, error } = await supabase
            .from('votes')
            .select('target_id')
            .eq('vote_type', VOTE_TYPES.SCRIPT)
        
        if (error) throw error
        
        const counts = countBy(data, 'target_id')
        const userVotes = getUserVotes()
        
        // Update UI
        getScriptIdeas().forEach(idea => {
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

// Load user votes for scripts
export async function loadUserVotes() {
    try {
        const { data, error } = await supabase
            .from('votes')
            .select('vote_type, target_id')
            .eq('voter_session', getState().userSession)
        
        if (error) throw error
        
        const userVotes = getUserVotes()
        
        data.forEach(vote => {
            if (vote.vote_type === VOTE_TYPES.ENVIRONMENT) {
                addUserVote('environments', vote.target_id)
            } else if (vote.vote_type === VOTE_TYPES.SCRIPT) {
                addUserVote('scripts', vote.target_id)
            }
        })
        
    } catch (error) {
        console.error('Error loading user votes:', error)
    }
}

// Setup character count with debouncing
export function setupCharacterCount() {
    const input = getDOMElement(SELECTORS.SCRIPT_IDEA_INPUT)
    const counter = getDOMElement(SELECTORS.CHAR_COUNT)
    const submitBtn = getDOMElement(SELECTORS.SUBMIT_SCRIPT_IDEA_BTN)
    
    if (!input || !counter || !submitBtn) return
    
    const debouncedUpdate = debounce(() => {
        const isValid = updateCharacterCount(input, counter, APP_CONFIG.MAX_SCRIPT_LENGTH)
        submitBtn.disabled = !isValid || input.value.trim().length === 0
    }, 100)
    
    input.addEventListener('input', debouncedUpdate)
    
    // Initial update
    debouncedUpdate()
} 