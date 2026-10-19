document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Animate elements on scroll
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

    // Observe feature cards and benefit items
    document.querySelectorAll('.feature-card, .benefit-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Phone mockup hover effect
    const phoneMockup = document.querySelector('.phone-mockup');
    if (phoneMockup) {
        phoneMockup.addEventListener('mouseenter', () => {
            phoneMockup.style.transform = 'rotateY(-10deg) rotateX(2deg) scale(1.05)';
        });
        
        phoneMockup.addEventListener('mouseleave', () => {
            phoneMockup.style.transform = 'rotateY(-15deg) rotateX(5deg) scale(1)';
        });
    }

    // Interactive demo elements
    const demoItems = document.querySelectorAll('.demo-item-card');
    demoItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateX(5px)';
            item.style.boxShadow = '0 4px 15px rgba(67, 97, 238, 0.2)';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateX(0)';
            item.style.boxShadow = 'none';
        });
    });

    // Shopping list demo interactions
    const shoppingItems = document.querySelectorAll('.shopping-item input[type="checkbox"]');
    shoppingItems.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const item = checkbox.closest('.shopping-item');
            if (checkbox.checked) {
                item.style.opacity = '0.6';
                item.style.textDecoration = 'line-through';
            } else {
                item.style.opacity = '1';
                item.style.textDecoration = 'none';
            }
        });
    });

    // Settings toggle animations
    const settingToggles = document.querySelectorAll('.switch input');
    settingToggles.forEach(toggle => {
        toggle.addEventListener('change', () => {
            const settingItem = toggle.closest('.setting-item');
            if (toggle.checked) {
                settingItem.style.backgroundColor = '#e8f5e8';
                settingItem.style.borderLeft = '4px solid #28a745';
            } else {
                settingItem.style.backgroundColor = '#f8f9fa';
                settingItem.style.borderLeft = 'none';
            }
        });
    });

    // Add some dynamic content to make the demo more engaging
    const stats = document.querySelectorAll('.stat');
    if (stats.length > 0) {
        // Animate stats on tab switch
        const animateStats = () => {
            stats.forEach((stat, index) => {
                setTimeout(() => {
                    stat.style.transform = 'scale(1.1)';
                    setTimeout(() => {
                        stat.style.transform = 'scale(1)';
                    }, 200);
                }, index * 100);
            });
        };

        // Trigger animation when dashboard tab is clicked
        document.querySelector('[data-tab="dashboard"]').addEventListener('click', animateStats);
    }

    // Add loading animation for demo content
    const demoContainer = document.querySelector('.demo-container');
    if (demoContainer) {
        demoContainer.style.opacity = '0';
        demoContainer.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            demoContainer.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            demoContainer.style.opacity = '1';
            demoContainer.style.transform = 'translateY(0)';
        }, 500);
    }

    // Parallax effect for hero section
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        if (hero) {
            const rate = scrolled * -0.5;
            hero.style.transform = `translateY(${rate}px)`;
        }
    });

    // Add click effects to buttons
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Add CSS for ripple effect
    const style = document.createElement('style');
    style.textContent = `
        .btn-primary, .btn-secondary {
            position: relative;
            overflow: hidden;
        }
        
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Auto-rotate through demo tabs for showcase
    let currentTabIndex = 0;
    const autoRotateTabs = () => {
        if (tabBtns.length > 0) {
            tabBtns[currentTabIndex].click();
            currentTabIndex = (currentTabIndex + 1) % tabBtns.length;
        }
    };

    // Start auto-rotation after 5 seconds, change every 4 seconds
    setTimeout(() => {
        setInterval(autoRotateTabs, 4000);
    }, 5000);

    // Pause auto-rotation when user interacts with tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Reset auto-rotation timer
            clearInterval(window.autoRotateInterval);
            setTimeout(() => {
                window.autoRotateInterval = setInterval(autoRotateTabs, 4000);
            }, 10000); // Resume after 10 seconds of inactivity
        });
    });

    // Add some fun micro-interactions
    const featureIcons = document.querySelectorAll('.feature-icon');
    featureIcons.forEach(icon => {
        icon.addEventListener('mouseenter', () => {
            icon.style.transform = 'rotate(10deg) scale(1.1)';
        });
        
        icon.addEventListener('mouseleave', () => {
            icon.style.transform = 'rotate(0deg) scale(1)';
        });
    });

    // Add a subtle pulse animation to the CTA button
    const ctaButton = document.querySelector('.cta .btn-primary');
    if (ctaButton) {
        setInterval(() => {
            ctaButton.style.animation = 'pulse 2s infinite';
        }, 3000);
    }

    // Add CSS for pulse animation
    const pulseStyle = document.createElement('style');
    pulseStyle.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(pulseStyle);
}); 