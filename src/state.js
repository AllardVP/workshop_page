import { getOrCreateSession } from './utils.js'

// Application state
export const appState = {
    userSession: getOrCreateSession(),
    environments: [],
    scriptIdeas: [],
    selectedEnvironments: new Set(),
    userVotes: {
        environments: new Set(),
        scripts: new Set()
    },
    carousel: {
        currentImageIndex: 0,
        currentEnvironmentImages: []
    }
}

// State getters
export const getState = () => appState

export const getEnvironments = () => appState.environments
export const getScriptIdeas = () => appState.scriptIdeas
export const getSelectedEnvironments = () => appState.selectedEnvironments
export const getUserVotes = () => appState.userVotes
export const getCarouselState = () => appState.carousel

// State setters
export const setEnvironments = (environments) => {
    appState.environments = environments
}

export const setScriptIdeas = (scriptIdeas) => {
    appState.scriptIdeas = scriptIdeas
}

export const addSelectedEnvironment = (envId) => {
    appState.selectedEnvironments.add(envId)
}

export const removeSelectedEnvironment = (envId) => {
    appState.selectedEnvironments.delete(envId)
}

export const clearSelectedEnvironments = () => {
    appState.selectedEnvironments.clear()
}

export const addUserVote = (voteType, targetId) => {
    appState.userVotes[voteType].add(targetId)
}

export const setCarouselImages = (images) => {
    appState.carousel.currentEnvironmentImages = images
    appState.carousel.currentImageIndex = 0
}

export const setCarouselIndex = (index) => {
    appState.carousel.currentImageIndex = index
}

export const clearCarousel = () => {
    appState.carousel.currentEnvironmentImages = []
    appState.carousel.currentImageIndex = 0
}

// State validators
export const isEnvironmentSelected = (envId) => {
    return appState.selectedEnvironments.has(envId)
}

export const hasUserVoted = (voteType, targetId) => {
    return appState.userVotes[voteType].has(targetId)
}

export const canSelectMoreEnvironments = () => {
    return appState.selectedEnvironments.size < 2
}

export const isValidEnvironmentSelection = () => {
    return appState.selectedEnvironments.size === 2
} 