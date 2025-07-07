import { APP_CONFIG } from './constants.js'

// Session management
export function getOrCreateSession() {
    let session = localStorage.getItem(APP_CONFIG.SESSION_STORAGE_KEY)
    if (!session) {
        session = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem(APP_CONFIG.SESSION_STORAGE_KEY, session)
    }
    return session
}

// HTML escaping for security
export function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}

// Date formatting
export function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Debounce function for performance
export function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

// DOM query helper with caching
const domCache = new Map()

export function getDOMElement(selector) {
    if (!domCache.has(selector)) {
        const element = document.querySelector(selector)
        if (element) {
            domCache.set(selector, element)
        }
    }
    return domCache.get(selector)
}

export function getDOMElements(selector) {
    return document.querySelectorAll(selector)
}

// Keyboard event helpers
export function isEnterWithModifier(event) {
    return event.key === 'Enter' && (event.metaKey || event.ctrlKey)
}

export function isEscapeKey(event) {
    return event.key === 'Escape'
}

export function isArrowKey(event) {
    return event.key === 'ArrowLeft' || event.key === 'ArrowRight'
}

// Array helpers
export function groupBy(array, key) {
    return array.reduce((groups, item) => {
        const group = (groups[item[key]] = groups[item[key]] || [])
        group.push(item)
        return groups
    }, {})
}

export function countBy(array, key) {
    return array.reduce((counts, item) => {
        const value = item[key]
        counts[value] = (counts[value] || 0) + 1
        return counts
    }, {})
}

// Environment variables validation
export function validateEnvironmentConfig() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    console.log('Environment variables:', {
        url: supabaseUrl ? 'loaded' : 'missing',
        key: supabaseKey ? 'loaded' : 'missing'
    })
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase configuration. Please check your environment variables.')
        throw new Error('Missing Supabase configuration')
    }
    
    return { supabaseUrl, supabaseKey }
} 