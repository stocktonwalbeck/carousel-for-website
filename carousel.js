/* =========================================================
   LIGHTWEIGHT CAROUSEL JAVASCRIPT
   Vanilla JS implementation with modern features
========================================================= */

class LightweightCarousel {
  constructor(options = {}) {
    // Configuration
    this.config = {
      autoplayDelay: 3000,
      transitionDuration: 300,
      enableAutoplay: true,
      enableTouch: true,
      centeredSlides: true,
      ...options
    };
    
    // DOM elements
    this.wrapper = document.getElementById('carousel-wrapper');
    this.track = document.getElementById('carousel-track');
    this.slides = [...document.querySelectorAll('.carousel-slide')];
    this.pagination = document.getElementById('carousel-pagination');
    
    // State
    this.currentIndex = 0;
    this.isTransitioning = false;
    this.autoplayTimer = null;
    this.startX = 0;
    this.currentX = 0;
    this.isDragging = false;
    
    // Initialize
    this.init();
  }
  
  init() {
    if (!this.track || this.slides.length === 0) {
      console.warn('Carousel: Required elements not found');
      return;
    }
    
    // Ensure all slides are visible initially
    this.slides.forEach(slide => {
      slide.style.visibility = 'visible';
      slide.style.opacity = '1';
    });
    
    this.createPagination();
    
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      this.updateSlidePositions();
      this.updateActiveSlide();
    });
    
    this.bindEvents();
    this.startAutoplay();
    
    // Handle image loading for better performance
    this.handleImageLoading();
  }
  
  createPagination() {
    if (!this.pagination) return;
    
    // Get unique categories for pagination
    const categories = [...new Set(this.slides.map(slide => 
      slide.dataset.category || 'Slide'
    ))];
    
    this.pagination.innerHTML = '';
    
    categories.forEach((category, index) => {
      const button = document.createElement('button');
      button.className = 'pagination-button';
      button.textContent = category;
      button.setAttribute('data-index', index);
      button.setAttribute('aria-label', `Go to ${category} slide`);
      
      if (index === 0) button.classList.add('active');
      
      this.pagination.appendChild(button);
    });
  }
  
  updateSlidePositions() {
    const slideWidth = this.getSlideWidth();
    const centerOffset = this.getCenterOffset();
    
    this.slides.forEach((slide, index) => {
      const offset = (index - this.currentIndex) * slideWidth + centerOffset;
      slide.style.transform = `translateX(${offset}px)`;
      slide.style.visibility = 'visible';
      slide.style.opacity = '1';
    });
  }
  
  getSlideWidth() {
    if (this.slides.length > 0) {
      const firstSlide = this.slides[0];
      const slideRect = firstSlide.getBoundingClientRect();
      const slideStyle = getComputedStyle(firstSlide);
      const marginLeft = parseFloat(slideStyle.marginLeft);
      const marginRight = parseFloat(slideStyle.marginRight);
      return slideRect.width + marginLeft + marginRight;
    }
    
    // Fallback if no slides
    if (window.innerWidth <= 480) {
      return 272; // 16rem + margins
    }
    return 972; // 60rem + margins
  }
  
  getCenterOffset() {
    const containerWidth = this.wrapper.clientWidth;
    const slideWidth = this.getSlideWidth();
    return (containerWidth - slideWidth) / 2;
  }
  
  goToSlide(index, smooth = true) {
    if (this.isTransitioning || index === this.currentIndex) return;
    
    this.isTransitioning = true;
    this.currentIndex = Math.max(0, Math.min(index, this.slides.length - 1));
    
    if (smooth) {
      this.track.style.transition = `transform ${this.config.transitionDuration}ms ease`;
    } else {
      this.track.style.transition = 'none';
    }
    
    this.updateSlidePositions();
    this.updateActiveSlide();
    this.updatePagination();
    
    // Reset transition flag
    setTimeout(() => {
      this.isTransitioning = false;
      this.track.style.transition = '';
    }, this.config.transitionDuration);
  }
  
  next() {
    const nextIndex = this.currentIndex + 1;
    if (nextIndex >= this.slides.length) {
      this.goToSlide(0); // Loop back to start
    } else {
      this.goToSlide(nextIndex);
    }
  }
  
  previous() {
    const prevIndex = this.currentIndex - 1;
    if (prevIndex < 0) {
      this.goToSlide(this.slides.length - 1); // Loop to end
    } else {
      this.goToSlide(prevIndex);
    }
  }
  
  updateActiveSlide() {
    this.slides.forEach((slide, index) => {
      slide.classList.toggle('active', index === this.currentIndex);
    });
  }
  
  updatePagination() {
    const buttons = this.pagination?.querySelectorAll('.pagination-button');
    if (!buttons) return;
    
    // Find which category the current slide belongs to
    const currentCategory = this.slides[this.currentIndex]?.dataset.category;
    const categories = [...new Set(this.slides.map(slide => slide.dataset.category))];
    const categoryIndex = categories.indexOf(currentCategory);
    
    buttons.forEach((button, index) => {
      button.classList.toggle('active', index === categoryIndex);
    });
  }
  
  startAutoplay() {
    if (!this.config.enableAutoplay) return;
    
    this.stopAutoplay();
    this.autoplayTimer = setInterval(() => {
      if (!document.hidden && !this.isDragging) {
        this.next();
      }
    }, this.config.autoplayDelay);
  }
  
  stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }
  
  bindEvents() {
    // Pagination clicks
    this.pagination?.addEventListener('click', (e) => {
      if (e.target.classList.contains('pagination-button')) {
        const categoryIndex = parseInt(e.target.dataset.index);
        // Find first slide of this category
        const targetSlide = this.slides.findIndex(slide => 
          slide.dataset.category === e.target.textContent
        );
        if (targetSlide !== -1) {
          this.goToSlide(targetSlide);
          this.stopAutoplay();
          this.startAutoplay(); // Restart autoplay
        }
      }
    });
    
    // Touch events for mobile swiping
    if (this.config.enableTouch) {
      this.bindTouchEvents();
    }
    
    // Keyboard navigation
    this.bindKeyboardEvents();
    
    // Visibility change (pause autoplay when tab is hidden)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopAutoplay();
      } else if (this.config.enableAutoplay) {
        this.startAutoplay();
      }
    });
    
    // Resize handling
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.updateSlidePositions();
      }, 250);
    });
    
    // Pause on hover
    this.wrapper.addEventListener('mouseenter', () => this.stopAutoplay());
    this.wrapper.addEventListener('mouseleave', () => {
      if (this.config.enableAutoplay) this.startAutoplay();
    });
  }
  
  bindTouchEvents() {
    // Touch start
    this.wrapper.addEventListener('touchstart', (e) => {
      this.startX = e.touches[0].clientX;
      this.isDragging = true;
      this.stopAutoplay();
    }, { passive: true });
    
    // Touch move
    this.wrapper.addEventListener('touchmove', (e) => {
      if (!this.isDragging) return;
      this.currentX = e.touches[0].clientX;
      e.preventDefault();
    }, { passive: false });
    
    // Touch end
    this.wrapper.addEventListener('touchend', () => {
      if (!this.isDragging) return;
      
      const diffX = this.startX - this.currentX;
      const threshold = 50;
      
      if (Math.abs(diffX) > threshold) {
        if (diffX > 0) {
          this.next();
        } else {
          this.previous();
        }
      }
      
      this.isDragging = false;
      if (this.config.enableAutoplay) {
        this.startAutoplay();
      }
    }, { passive: true });
  }
  
  bindKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
      if (!this.wrapper.matches(':hover')) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.previous();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.next();
          break;
        case ' ':
          e.preventDefault();
          if (this.autoplayTimer) {
            this.stopAutoplay();
          } else {
            this.startAutoplay();
          }
          break;
      }
    });
  }
  
  handleImageLoading() {
    this.slides.forEach(slide => {
      const img = slide.querySelector('img');
      if (img && img.getAttribute('loading') === 'lazy') {
        img.addEventListener('load', () => {
          img.classList.add('loaded');
        });
      }
    });
  }
  
  // Public API methods
  destroy() {
    this.stopAutoplay();
    // Remove event listeners if needed
  }
  
  pause() {
    this.stopAutoplay();
  }
  
  play() {
    this.startAutoplay();
  }
  
  getCurrentIndex() {
    return this.currentIndex;
  }
  
  getSlideCount() {
    return this.slides.length;
  }
}

// Initialize carousel when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the carousel
  const carousel = new LightweightCarousel({
    autoplayDelay: 3000,
    enableAutoplay: true,
    enableTouch: true,
    centeredSlides: true
  });
  
  // Make carousel globally accessible if needed
  window.carousel = carousel;
});

// Optional: Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LightweightCarousel;
}