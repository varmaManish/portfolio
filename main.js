// Mobile Navigation Logic
const ham = document.getElementById('ham');
const mobMenu = document.getElementById('mobMenu');

if (ham && mobMenu) {
  ham.addEventListener('click', () => {
    const isExpanded = ham.getAttribute('aria-expanded') === 'true';
    ham.setAttribute('aria-expanded', !isExpanded);
    mobMenu.classList.toggle('open');
    mobMenu.setAttribute('aria-hidden', isExpanded);
  });
}

// Typing Effect
const typedEl = document.getElementById('typed');
if (typedEl) {
  const phrases = ['Machine Learning models.', 'FastAPI backends.', 'Scalable data pipelines.', 'Practical AI automation.'];
  let phraseIdx = 0, charIdx = 0, isDeleting = false;

  function type() {
    const currentPhrase = phrases[phraseIdx];
    
    if (isDeleting) {
      typedEl.textContent = currentPhrase.substring(0, charIdx - 1);
      charIdx--;
    } else {
      typedEl.textContent = currentPhrase.substring(0, charIdx + 1);
      charIdx++;
    }

    let typeSpeed = isDeleting ? 40 : 80;

    if (!isDeleting && charIdx === currentPhrase.length) {
      typeSpeed = 2000; // Pause at end of word
      isDeleting = true;
    } else if (isDeleting && charIdx === 0) {
      isDeleting = false;
      phraseIdx = (phraseIdx + 1) % phrases.length;
      typeSpeed = 500; // Pause before next word
    }

    setTimeout(type, typeSpeed);
  }
  
  setTimeout(type, 1000);
}

// Intersection Observer for high-performance scroll reveals
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target); // Stop observing once revealed
    }
  });
}, observerOptions);

document.querySelectorAll('.reveal').forEach(el => {
  observer.observe(el);
});// Contact Form Handler
function handleFormSubmit(event) {
  event.preventDefault(); // Prevent page reload
  
  const btn = event.target.querySelector('.submit-btn');
  const btnText = btn.querySelector('span');
  const successMsg = document.getElementById('form-success');
  
  // Visual feedback for loading state
  btnText.textContent = "Sending...";
  btn.style.opacity = "0.8";
  btn.style.cursor = "wait";

  // Simulate network request (Hook this to Formspree/Netlify later)
  setTimeout(() => {
    // Reset form
    event.target.reset();
    
    // Show success state
    btnText.textContent = "Send Message";
    btn.style.opacity = "1";
    btn.style.cursor = "pointer";
    
    successMsg.style.display = "block";
    successMsg.setAttribute('aria-hidden', 'false');

    // Hide success message after 5 seconds
    setTimeout(() => {
      successMsg.style.display = "none";
      successMsg.setAttribute('aria-hidden', 'true');
    }, 5000);
    
  }, 1200);
}