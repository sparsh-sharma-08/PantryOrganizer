// Mobile Navigation Toggle
const hamburger = document.getElementById('hamburgerBtn');
const navLinks = document.querySelector('.nav-links');
const navActions = document.querySelector('.nav-actions');

hamburger.addEventListener('click', function() {
  navLinks.classList.toggle('open');
  navActions.classList.toggle('open');
  hamburger.classList.toggle('open');
  
  const expanded = hamburger.getAttribute('aria-expanded') === 'true';
  hamburger.setAttribute('aria-expanded', !expanded);
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    const targetSection = document.querySelector(targetId);
    
    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      
      // Close mobile navigation after clicking a link
      navLinks.classList.remove('open');
      navActions.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
});

// Contact Form Handling
const contactForm = document.getElementById('contactForm');
const contactFormStatus = document.getElementById('contactFormStatus');

if (contactForm) {
  contactForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const submitButton = this.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    // Show loading state
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;
    contactFormStatus.style.display = 'none';
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          message: formData.get('message')
        })
      });
      
      if (response.ok) {
        showFormStatus('Message sent successfully! We\'ll get back to you soon.', 'success');
        contactForm.reset();
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      showFormStatus('Failed to send message. Please try again.', 'error');
    } finally {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  });
}

function showFormStatus(message, type) {
  contactFormStatus.textContent = message;
  contactFormStatus.className = `form-status ${type}`;
  contactFormStatus.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    contactFormStatus.style.display = 'none';
  }, 5000);
}

// Intersection Observer for animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
  const animatedElements = document.querySelectorAll('.feature-card, .step-card, .testimonial-card, .benefit-item');
  
  animatedElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    navbar.style.background = 'rgba(255, 255, 255, 0.98)';
    navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
  } else {
    navbar.style.background = 'rgba(255, 255, 255, 0.95)';
    navbar.style.boxShadow = 'none';
  }
});

// Stats counter animation
function animateCounters() {
  const stats = document.querySelectorAll('.stat-number');
  
  stats.forEach(stat => {
    const target = stat.textContent;
    const isPercentage = target.includes('%');
    const isNumber = target.includes('+');
    
    let finalValue;
    if (isPercentage) {
      finalValue = parseInt(target);
    } else if (isNumber) {
      finalValue = parseInt(target.replace('+', ''));
    } else {
      finalValue = target;
    }
    
    if (typeof finalValue === 'number') {
      let current = 0;
      const increment = finalValue / 50;
      const timer = setInterval(() => {
        current += increment;
        if (current >= finalValue) {
          current = finalValue;
          clearInterval(timer);
        }
        stat.textContent = Math.floor(current) + (isPercentage ? '%' : isNumber ? '+' : '');
      }, 30);
    }
  });
}

// Trigger counter animation when stats section is visible
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounters();
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
  statsObserver.observe(heroStats);
}

// Add CSS for mobile navigation
const style = document.createElement('style');
style.textContent = `
  @media (max-width: 768px) {
    .nav-links,
    .nav-actions {
      position: fixed;
      top: 70px;
      left: 0;
      right: 0;
      background: white;
      flex-direction: column;
      padding: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transform: translateY(-100%);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      z-index: 999;
    }
    
    .nav-links.open,
    .nav-actions.open {
      transform: translateY(0);
      opacity: 1;
      visibility: visible;
    }
    
    .nav-links a {
      padding: 1rem 0;
      border-bottom: 1px solid #f1f5f9;
      width: 100%;
      text-align: center;
    }
    
    .nav-actions {
      top: 200px;
    }
    
    .hamburger.open span:nth-child(1) {
      transform: rotate(45deg) translate(5px, 5px);
    }
    
    .hamburger.open span:nth-child(2) {
      opacity: 0;
    }
    
    .hamburger.open span:nth-child(3) {
      transform: rotate(-45deg) translate(7px, -6px);
    }
  }
  
  .form-status {
    padding: 1rem;
    border-radius: 8px;
    margin-top: 1rem;
    font-weight: 500;
  }
  
  .form-status.success {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
  }
  
  .form-status.error {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
  }
`;

document.head.appendChild(style); 