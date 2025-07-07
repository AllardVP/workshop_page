// Video management for PeerTube embeds
import { getDOMElement, getDOMElements, debounce } from './utils.js'
import { VIDEO_CONFIG } from './constants.js'

// Device detection
function isMobileDevice() {
    return window.innerWidth <= VIDEO_CONFIG.MOBILE_BREAKPOINT || 
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Network detection
function isSlowConnection() {
    return navigator.connection && 
           (navigator.connection.effectiveType === 'slow-2g' || 
            navigator.connection.effectiveType === '2g' || 
            navigator.connection.saveData)
}

// Video container class
class VideoContainer {
    constructor(element) {
        this.element = element
        this.iframe = null
        this.loaded = false
        this.loading = false
        this.error = false
        this.retryCount = 0
        this.src = element.dataset.videoSrc
        this.title = element.dataset.videoTitle || 'Video'
        this.thumbnail = element.dataset.videoThumbnail
        this.autoplay = element.dataset.videoAutoplay === 'true'
        this.isMobile = isMobileDevice()
        this.isSlowConnection = isSlowConnection()
        
        this.init()
    }
    
    init() {
        this.createPlaceholder()
        this.setupClickHandler()
        
        // For mobile optimization, we'll still respect autoplay but add loading improvements
        // Don't disable autoplay completely - just optimize the loading
    }
    
    createPlaceholder() {
        const placeholder = document.createElement('div')
        placeholder.className = 'video-placeholder absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden transition-all duration-300'
        
        if (this.autoplay) {
            // For autoplay videos, show loading state immediately
            placeholder.innerHTML = `
                <div class="video-loading absolute inset-0 flex items-center justify-center bg-gray-100/90 dark:bg-gray-700/90 backdrop-blur-sm">
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Loading video...</p>
                        <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">${this.title}</p>
                    </div>
                </div>
                <div class="video-error hidden absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/20 backdrop-blur-sm">
                    <div class="text-center p-4">
                        <div class="text-red-500 text-3xl mb-2">⚠️</div>
                        <p class="text-sm text-red-600 dark:text-red-400 mb-2">Failed to load video</p>
                        <button class="video-retry text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors duration-200">
                            Retry
                        </button>
                    </div>
                </div>
            `
        } else {
            // For click-to-play videos, show play button
            placeholder.className += ' cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600'
            placeholder.innerHTML = `
                <div class="text-center p-6">
                    <div class="video-play-button w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg hover:bg-primary-600 transition-colors duration-200">
                        <svg class="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">${this.title}</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Click to load video</p>
                    ${this.isMobile ? '<p class="text-xs text-gray-500 dark:text-gray-500 mt-1">Optimized for mobile</p>' : ''}
                </div>
                <div class="video-loading hidden absolute inset-0 flex items-center justify-center bg-gray-100/90 dark:bg-gray-700/90 backdrop-blur-sm">
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Loading video...</p>
                    </div>
                </div>
                <div class="video-error hidden absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/20 backdrop-blur-sm">
                    <div class="text-center p-4">
                        <div class="text-red-500 text-3xl mb-2">⚠️</div>
                        <p class="text-sm text-red-600 dark:text-red-400 mb-2">Failed to load video</p>
                        <button class="video-retry text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors duration-200">
                            Retry
                        </button>
                    </div>
                </div>
            `
        }
        
        this.element.appendChild(placeholder)
        this.placeholder = placeholder
        
        // Add thumbnail if available
        if (this.thumbnail) {
            const thumbnailImg = document.createElement('img')
            thumbnailImg.src = this.thumbnail
            thumbnailImg.className = 'absolute inset-0 w-full h-full object-cover opacity-20'
            thumbnailImg.alt = this.title
            placeholder.style.backgroundImage = `url(${this.thumbnail})`
            placeholder.style.backgroundSize = 'cover'
            placeholder.style.backgroundPosition = 'center'
        }
    }
    
    setupClickHandler() {
        // Only add click handler for non-autoplay videos
        if (!this.autoplay) {
            this.placeholder.addEventListener('click', () => {
                if (!this.loading && !this.loaded) {
                    this.loadVideo()
                }
            })
        }
        
        // Retry button for all videos
        const retryBtn = this.placeholder.querySelector('.video-retry')
        retryBtn?.addEventListener('click', (e) => {
            e.stopPropagation()
            this.retryLoad()
        })
    }
    
    async loadVideo() {
        if (this.loading || this.loaded) return
        
        this.loading = true
        this.showLoading()
        
        try {
            await this.createIframe()
            this.loaded = true
            this.hidePlaceholder()
        } catch (error) {
            console.error('Error loading video:', error)
            this.showError()
        } finally {
            this.loading = false
        }
    }
    
    async createIframe() {
        return new Promise((resolve, reject) => {
            const iframe = document.createElement('iframe')
            iframe.className = 'absolute inset-0 w-full h-full transition-opacity duration-300 opacity-0'
            iframe.allowFullscreen = true
            iframe.sandbox = 'allow-same-origin allow-scripts allow-popups allow-forms'
            iframe.title = this.title
            
            // Optimize parameters for mobile
            let src = this.src
            if (this.isMobile || this.isSlowConnection) {
                // Only disable autoplay for non-autoplay videos
                if (!this.autoplay) {
                    src = src.replace('autoplay=1', 'autoplay=0')
                }
                // Add mobile-friendly parameters
                src += '&responsive=1&quality=480'
            }
            
            const loadTimeout = setTimeout(() => {
                reject(new Error('Video load timeout'))
            }, VIDEO_CONFIG.LOAD_TIMEOUT)
            
            iframe.onload = () => {
                clearTimeout(loadTimeout)
                // Fade in the iframe
                setTimeout(() => {
                    iframe.classList.remove('opacity-0')
                    iframe.classList.add('opacity-100')
                }, 100)
                resolve()
            }
            
            iframe.onerror = () => {
                clearTimeout(loadTimeout)
                reject(new Error('Failed to load video'))
            }
            
            iframe.src = src
            this.element.appendChild(iframe)
            this.iframe = iframe
        })
    }
    
    showLoading() {
        const loading = this.placeholder.querySelector('.video-loading')
        const playButton = this.placeholder.querySelector('.video-play-button')
        loading?.classList.remove('hidden')
        playButton?.classList.add('hidden')
    }
    
    hideLoading() {
        const loading = this.placeholder.querySelector('.video-loading')
        const playButton = this.placeholder.querySelector('.video-play-button')
        loading?.classList.add('hidden')
        playButton?.classList.remove('hidden')
    }
    
    showError() {
        this.error = true
        const error = this.placeholder.querySelector('.video-error')
        const loading = this.placeholder.querySelector('.video-loading')
        error?.classList.remove('hidden')
        loading?.classList.add('hidden')
    }
    
    hideError() {
        this.error = false
        const error = this.placeholder.querySelector('.video-error')
        error?.classList.add('hidden')
    }
    
    hidePlaceholder() {
        this.placeholder.classList.add('opacity-0', 'pointer-events-none')
        setTimeout(() => {
            this.placeholder.style.display = 'none'
        }, 300)
    }
    
    async retryLoad() {
        if (this.retryCount >= VIDEO_CONFIG.RETRY_ATTEMPTS) {
            console.error('Max retry attempts reached for video:', this.src)
            return
        }
        
        this.retryCount++
        this.hideError()
        this.loading = false
        this.loaded = false
        
        // Remove existing iframe if any
        if (this.iframe) {
            this.iframe.remove()
            this.iframe = null
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, VIDEO_CONFIG.RETRY_DELAY))
        
        this.loadVideo()
    }
}

// Intersection Observer for lazy loading
class VideoLazyLoader {
    constructor() {
        this.containers = new Map()
        this.observer = null
        this.init()
    }
    
    init() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                this.handleIntersection.bind(this),
                {
                    root: null,
                    rootMargin: '50px',
                    threshold: VIDEO_CONFIG.INTERSECTION_THRESHOLD
                }
            )
        }
    }
    
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const container = this.containers.get(entry.target)
                if (container && !container.loaded && !container.loading) {
                    if (container.autoplay) {
                        // Autoplay videos load immediately when in view
                        const delay = container.isMobile ? VIDEO_CONFIG.LOAD_DELAY : 0
                        setTimeout(() => {
                            container.loadVideo()
                        }, delay)
                    }
                    // Non-autoplay videos just wait for user interaction
                }
            }
        })
    }
    
    observe(element) {
        const container = new VideoContainer(element)
        this.containers.set(element, container)
        
        if (this.observer) {
            this.observer.observe(element)
        }
        
        return container
    }
    
    unobserve(element) {
        if (this.observer) {
            this.observer.unobserve(element)
        }
        this.containers.delete(element)
    }
}

// Initialize video system
let videoLoader = null

export function initializeVideoSystem() {
    videoLoader = new VideoLazyLoader()
    
    // Find all video containers
    const videoContainers = getDOMElements('[data-video-src]')
    
    videoContainers.forEach(container => {
        videoLoader.observe(container)
    })
    
    // Handle window resize
    const handleResize = debounce(() => {
        // Reinitialize on significant viewport changes
        const newIsMobile = isMobileDevice()
        videoLoader.containers.forEach(container => {
            if (container.isMobile !== newIsMobile) {
                container.isMobile = newIsMobile
                // Reload video with new parameters if needed
                if (container.loaded && container.iframe) {
                    container.iframe.src = container.src + (newIsMobile ? '&responsive=1&quality=480' : '')
                }
            }
        })
    }, 250)
    
    window.addEventListener('resize', handleResize)
    
    console.log('Video system initialized with', videoContainers.length, 'containers')
}

// Preconnect to video domains
export function preconnectVideoSources() {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = 'https://tube.allardvp.nl'
    document.head.appendChild(link)
    
    const dnsPrefetch = document.createElement('link')
    dnsPrefetch.rel = 'dns-prefetch'
    dnsPrefetch.href = 'https://tube.allardvp.nl'
    document.head.appendChild(dnsPrefetch)
}

// Export for external use
export { VideoContainer, VideoLazyLoader } 