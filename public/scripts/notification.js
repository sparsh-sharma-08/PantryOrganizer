document.addEventListener('DOMContentLoaded', () => {
  const notificationCards = document.querySelectorAll('.notification-card');

  // --- View/Hide Button Logic ---
  notificationCards.forEach(card => {
    const viewBtn = card.querySelector('.view-btn');
    if (viewBtn) {
      viewBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card click from firing
        const isExpanded = card.classList.contains('expanded');
        
        // Collapse all other cards
        document.querySelectorAll('.notification-card.expanded').forEach(openCard => {
          if (openCard !== card) {
            openCard.classList.remove('expanded');
            openCard.querySelector('.view-btn').textContent = 'View';
          }
        });

        // Toggle the current card
        card.classList.toggle('expanded');
        viewBtn.textContent = isExpanded ? 'View' : 'Hide';
      });
    }

    // --- Dismiss Button Logic ---
    const dismissBtn = card.querySelector('.dismiss-btn');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease, margin-bottom 0.3s ease, padding 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.95)';
        card.style.marginBottom = `-${card.offsetHeight}px`;
        card.style.padding = '0';
        
        setTimeout(() => {
          card.remove();
        }, 300);
      });
    }
  });
});