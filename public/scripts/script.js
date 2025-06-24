// script.js

document.addEventListener('DOMContentLoaded', () => {
  // FAQ Accordion toggle
  const faqItems = document.querySelectorAll('.faq-item h4');

  faqItems.forEach((header) => {
    header.addEventListener('click', () => {
      const currentlyActive = document.querySelector('.faq-item.active');
      if (currentlyActive && currentlyActive !== header.parentElement) {
        currentlyActive.classList.remove('active');
        currentlyActive.querySelector('p').style.maxHeight = null;
      }
      
      const item = header.parentElement;
      item.classList.toggle('active');
      const answer = header.nextElementSibling;
      
      if (item.classList.contains('active')) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
      } else {
        answer.style.maxHeight = null;
      }
    });
  });

  // Browse page - simple search filter
  const searchInput = document.querySelector('.search-input');
  const carCards = document.querySelectorAll('.car-card');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase().trim();
      carCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }

  // Optional: Smooth scroll for nav links (if anchors used)
  document.querySelectorAll('nav ul li a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      e.preventDefault();
      const targetID = anchor.getAttribute('href').slice(1);
      const targetEl = document.getElementById(targetID);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});
