// ======================================================
// EmailJS Initialization
// ======================================================

if (typeof emailjs !== 'undefined' && typeof EMAILJS_CONFIG !== 'undefined') {
    emailjs.init({
        publicKey: EMAILJS_CONFIG.PUBLIC_KEY
    });
}

// ======================================================
// NAV SCROLL EFFECT
// ======================================================

const header = document.querySelector("header");

if (header) {
    window.addEventListener(
        "scroll",
        () => {
            header.classList.toggle("scrolled", window.scrollY > 20);
        },
        { passive: true }
    );
}

// ======================================================
// ACTIVE NAV LINK
// ======================================================

function setActiveNav() {
    const path =
        window.location.pathname.split("/").pop() ||
        "index.html";

    document
        .querySelectorAll(".nav-links a, .mob-menu a")
        .forEach((a) => {

            const href = a.getAttribute("href");

            if (!href) return;

            const active =
                (href === "/" &&
                    (path === "" ||
                        path === "index.html")) ||

                (href !== "/" &&
                    path.includes(
                        href
                            .replace("#", "")
                            .replace(".html", "")
                    ));

            a.classList.toggle(
                "active",
                active
            );

        });
}

setActiveNav();

// ======================================================
// MOBILE MENU
// ======================================================

const ham =
    document.getElementById("ham");

const mobMenu =
    document.getElementById("mobMenu");

if (ham && mobMenu) {

    ham.addEventListener("click", () => {

        const expanded =
            ham.getAttribute("aria-expanded") ===
            "true";

        ham.setAttribute(
            "aria-expanded",
            String(!expanded)
        );

        ham.classList.toggle(
            "open",
            !expanded
        );

        mobMenu.classList.toggle(
            "open",
            !expanded
        );

        mobMenu.setAttribute(
            "aria-hidden",
            String(expanded)
        );

    });

    mobMenu
        .querySelectorAll("a")
        .forEach((a) => {

            a.addEventListener(
                "click",
                () => {

                    ham.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                    ham.classList.remove(
                        "open"
                    );

                    mobMenu.classList.remove(
                        "open"
                    );

                    mobMenu.setAttribute(
                        "aria-hidden",
                        "true"
                    );

                }
            );

        });

}

// ======================================================
// TYPING EFFECT
// ======================================================

const typedEl =
    document.getElementById("typed");

if (typedEl) {

    const phrases = window._typingPhrases || [
        "Machine Learning models.",
        "FastAPI backends.",
        "Scalable data pipelines.",
        "Practical AI systems.",
        "Fraud detection tools."
    ];

    let phraseIndex = 0;

    let charIndex = 0;

    let deleting = false;

    function type() {

        const current =
            phrases[phraseIndex];

        typedEl.textContent =
            deleting
                ? current.substring(
                      0,
                      charIndex - 1
                  )
                : current.substring(
                      0,
                      charIndex + 1
                  );

        deleting
            ? charIndex--
            : charIndex++;

        let delay =
            deleting
                ? 40
                : 80;

        if (
            !deleting &&
            charIndex ===
                current.length
        ) {

            delay = 2000;

            deleting = true;

        } else if (
            deleting &&
            charIndex === 0
        ) {

            deleting = false;

            phraseIndex =
                (phraseIndex + 1) %
                phrases.length;

            delay = 400;

        }

        setTimeout(
            type,
            delay
        );

    }

    setTimeout(
        type,
        800
    );

}
// ======================================================
// SCROLL REVEAL
// ======================================================

const observer = new IntersectionObserver(

    (entries, obs) => {

        entries.forEach((entry) => {

            if (entry.isIntersecting) {

                entry.target.classList.add("visible");

                obs.unobserve(entry.target);

            }

        });

    },

    {

        threshold: 0.08,

        rootMargin: "0px 0px -40px 0px"

    }

);

// Expose globally so Firestore-loaded content can be observed after page load
window._revealObserver = observer;

document

.querySelectorAll(".reveal")

.forEach((el) => {

    observer.observe(el);

});

// ======================================================
// STAGGER CHILDREN
// ======================================================

document

.querySelectorAll(".reveal-group")

.forEach((group) => {

    [...group.children].forEach((child, index) => {

        child.classList.add("reveal");

        child.style.transitionDelay = `${index * 80}ms`;

        observer.observe(child);

    });

});

// ======================================================
// BACK TO TOP
// ======================================================

const backTop =

document.querySelector(".back-top");

if (backTop) {

    window.addEventListener(

        "scroll",

        () => {

            backTop.classList.toggle(

                "show",

                window.scrollY > 500

            );

        },

        { passive: true }

    );

    backTop.addEventListener(

        "click",

        () => {

            window.scrollTo({

                top: 0,

                behavior: "smooth"

            });

        }

    );

}

// ======================================================
// SMOOTH SCROLL
// ======================================================

document

.querySelectorAll('a[href^="#"]')

.forEach((link) => {

    link.addEventListener(

        "click",

        (event) => {

            const id =

                link

                    .getAttribute("href")

                    .slice(1);

            const target =

                document.getElementById(id);

            if (!target) return;

            event.preventDefault();

            const offset =

                target

                    .getBoundingClientRect()

                    .top +

                window.scrollY -

                80;

            window.scrollTo({

                top: offset,

                behavior: "smooth"

            });

        }

    );

});
// ======================================================
// CONTACT FORM + EMAILJS
// ======================================================

const contactForm = document.getElementById("contactForm");

if (contactForm) {

    contactForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const button = contactForm.querySelector(".submit-btn");
        const buttonText = button.querySelector("span:first-child");
        const messageBox = document.getElementById("form-success");

        // Prevent duplicate submissions
        button.disabled = true;
        button.style.opacity = "0.7";
        buttonText.textContent = "Sending...";

        try {

            await emailjs.send(

                EMAILJS_CONFIG.SERVICE_ID,

                EMAILJS_CONFIG.TEMPLATE_ID,

                {

                    from_name: contactForm.name.value.trim(),

                    from_email: contactForm.email.value.trim(),

                    message: contactForm.message.value.trim()

                }

            );

            contactForm.reset();

            messageBox.textContent = "✓ Message sent successfully!";
            messageBox.style.display = "block";
            messageBox.setAttribute("aria-hidden", "false");

            console.log("Email sent successfully.");

        }

        catch (error) {

            console.error("EmailJS Error:", error);

            messageBox.textContent =
                "✗ Failed to send message. Please try again.";

            messageBox.style.display = "block";
            messageBox.setAttribute("aria-hidden", "false");

        }

        finally {

            button.disabled = false;
            button.style.opacity = "1";
            buttonText.textContent = "Send Message";

            setTimeout(() => {

                messageBox.style.display = "none";
                messageBox.setAttribute("aria-hidden", "true");

            }, 5000);

        }

    });

}