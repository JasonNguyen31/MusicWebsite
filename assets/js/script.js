// JavaScript for the hero image slider
document.addEventListener('DOMContentLoaded', function() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.dot');
    let currentSlide = 0;
    
    // Function to change slide
    function changeSlide(index) {
        // Remove active class from all slides and dots
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        // Add active class to current slide and dot
        slides[index].classList.add('active');
        dots[index].classList.add('active');
        
        // Update current slide index
        currentSlide = index;
    }
    
    // Add click event to dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            changeSlide(index);
        });
    });
    
    // Auto slide change
    function autoSlide() {
        let nextSlide = (currentSlide + 1) % slides.length;
        changeSlide(nextSlide);
    }
    
    // Set interval for auto slide change (every 5 seconds)
    let slideInterval = setInterval(autoSlide, 5000);
    
    // Pause auto slide on mouseover
    const heroSection = document.querySelector('.hero');
    heroSection.addEventListener('mouseover', () => {
        clearInterval(slideInterval);
    });
    
    // Resume auto slide on mouseout
    heroSection.addEventListener('mouseout', () => {
        slideInterval = setInterval(autoSlide, 2000);
    });
});