(function() {
  "use strict";

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim()
    if (all) {
      return [...document.querySelectorAll(el)]
    } else {
      return document.querySelector(el)
    }
  }

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    let selectEl = select(el, all)

    if (selectEl) {
      if (all) {
        selectEl.forEach(e => e.addEventListener(type, listener))
      } else {
        selectEl.addEventListener(type, listener)
      }
    }
  }

  /**
   * Typing animation for roles
   */
  const typingAnimation = () => {
    const roles = [
      'QA Engineer',
      'Scrum Master',
      'Software Trainer',
      'Author of Kill All Bugs',
      'Entrepreneur',
      'Founder @AdParcel',
      'Podcaster',
      'Startup Builder',
      'Automation Enthusiast',
      'Digital Product Innovator',
      'LifeLong Learner'
    ];
    
    const typingElement = select('.typing-text');
    if (!typingElement) return;
    
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let currentRole = '';
    
    const type = () => {
      const currentRoleText = roles[roleIndex];
      
      if (isDeleting) {
        currentRole = currentRoleText.substring(0, charIndex - 1);
        charIndex--;
      } else {
        currentRole = currentRoleText.substring(0, charIndex + 1);
        charIndex++;
      }
      
      typingElement.textContent = currentRole;
      
      // Update underline width based on text content
      const textWidth = typingElement.offsetWidth;
      typingElement.style.borderBottom = `1px solid #18d26e`;
      typingElement.style.width = textWidth + 'px';
      
      let typeSpeed = 150;
      
      if (isDeleting) {
        typeSpeed /= 2;
      }
      
      if (!isDeleting && charIndex === currentRoleText.length) {
        typeSpeed = 2000; // Pause at end
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        typeSpeed = 500; // Pause before next word
      }
      
      setTimeout(type, typeSpeed);
    };
    
    type();
  };

  /**
   * About animation for title and description
   */
  const aboutAnimation = () => {
    const titles = [
      'QA Engineer', 'Scrum Master', 'Software Trainer', 'Author of Kill All Bugs',
      'Founder @AdParcel', 'Entrepreneur', 'Podcaster', 'Startup Builder',
      'Automation Enthusiast', 'Lifelong Learner', 'Digital Product Innovator'
    ];
    const descriptions = [
      'Transforming code excellence into exceptional user experiences.',
      'Guiding teams to deliver value with focus and agility.',
      'Turning complex concepts into practical skills for learners.',
      'Sharing my passion for testing through words that stick.',
      'Building the future of digital ownership and online ads.',
      'Exploring opportunities and turning ideas into ventures.',
      'Amplifying voices and stories that inspire the tech world.',
      'Shaping products from scratch into real-world impact.',
      'Empowering efficiency with smart automation.',
      'Always curious, always growing in knowledge and skills.',
      'Reimagining how technology solves everyday challenges.'
    ];
    
    const titleElement = select('.about-title');
    const descriptionElement = select('.about-description');
    if (!titleElement || !descriptionElement) return;
    
    let index = 0;
    let titleCharIndex = 0;
    let descCharIndex = 0;
    let isDeletingTitle = false;
    let isDeletingDesc = false;
    let currentTitle = '';
    let currentDesc = '';
    let phase = 'title-typing'; // title-typing, title-pause, desc-typing, desc-pause, desc-deleting, title-deleting
    
    const animate = () => {
      if (phase === 'title-typing') {
        const currentTitleText = titles[index];
        currentTitle = currentTitleText.substring(0, titleCharIndex + 1);
        titleCharIndex++;
        titleElement.textContent = currentTitle;
        
        if (titleCharIndex === currentTitleText.length) {
          phase = 'title-pause';
          setTimeout(animate, 1500); // Pause after title is complete
        } else {
          setTimeout(animate, 200); // Slower typing speed
        }
      } else if (phase === 'title-pause') {
        phase = 'desc-typing';
        descCharIndex = 0;
        setTimeout(animate, 500);
      } else if (phase === 'desc-typing') {
        const currentDescText = descriptions[index];
        currentDesc = currentDescText.substring(0, descCharIndex + 1);
        descCharIndex++;
        descriptionElement.textContent = currentDesc;
        
        if (descCharIndex === currentDescText.length) {
          phase = 'desc-pause';
          setTimeout(animate, 2000); // Longer pause after description
        } else {
          setTimeout(animate, 150); // Slower typing speed for description
        }
      } else if (phase === 'desc-pause') {
        phase = 'desc-deleting';
        setTimeout(animate, 500);
      } else if (phase === 'desc-deleting') {
        const currentDescText = descriptions[index];
        currentDesc = currentDescText.substring(0, descCharIndex - 1);
        descCharIndex--;
        descriptionElement.textContent = currentDesc;
        
        if (descCharIndex === 0) {
          phase = 'title-deleting';
          setTimeout(animate, 500);
        } else {
          setTimeout(animate, 100); // Faster deleting
        }
      } else if (phase === 'title-deleting') {
        const currentTitleText = titles[index];
        currentTitle = currentTitleText.substring(0, titleCharIndex - 1);
        titleCharIndex--;
        titleElement.textContent = currentTitle;
        
        if (titleCharIndex === 0) {
          phase = 'title-typing';
          index = (index + 1) % titles.length;
          setTimeout(animate, 1000); // Pause before next cycle
        } else {
          setTimeout(animate, 100); // Faster deleting
        }
      }
    };
    
    animate();
  };

  /**
   * Toggle podcast floating player visibility
   */
  const setPodcastVisible = (isVisible) => {
    const pod = select('#podcast-float')
    if (!pod) return
    pod.style.display = isVisible ? 'block' : 'none'
  }

  /**
   * Scrolls to an element with header offset
   */
  const scrollto = (el) => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  /**
   * Mobile nav toggle
   */
  on('click', '.mobile-nav-toggle', function(e) {
    select('#navbar').classList.toggle('navbar-mobile')
    this.classList.toggle('bi-list')
    this.classList.toggle('bi-x')
  })

  /**
   * Scrool with ofset on links with a class name .scrollto
   */
  on('click', '#navbar .nav-link', function(e) {
    let section = select(this.hash)
    if (section) {
      e.preventDefault()

      let navbar = select('#navbar')
      let header = select('#header')
      let sections = select('section', true)
      let navlinks = select('#navbar .nav-link', true)

      navlinks.forEach((item) => {
        item.classList.remove('active')
      })

      this.classList.add('active')

      if (navbar.classList.contains('navbar-mobile')) {
        navbar.classList.remove('navbar-mobile')
        let navbarToggle = select('.mobile-nav-toggle')
        navbarToggle.classList.toggle('bi-list')
        navbarToggle.classList.toggle('bi-x')
      }

      if (this.hash == '#header') {
        header.classList.remove('header-top')
        sections.forEach((item) => {
          item.classList.remove('section-show')
        })
        setPodcastVisible(true)
        return;
      }

      if (!header.classList.contains('header-top')) {
        header.classList.add('header-top')
        setTimeout(function() {
          sections.forEach((item) => {
            item.classList.remove('section-show')
          })
          section.classList.add('section-show')

        }, 350);
      } else {
        sections.forEach((item) => {
          item.classList.remove('section-show')
        })
        section.classList.add('section-show')
      }

      scrollto(this.hash)
      setPodcastVisible(false)
    }
  }, true)

  /**
   * Activate/show sections on load with hash links
   */
  window.addEventListener('load', () => {
    if (window.location.hash) {
      let initial_nav = select(window.location.hash)

      if (initial_nav) {
        let header = select('#header')
        let navlinks = select('#navbar .nav-link', true)

        header.classList.add('header-top')

        navlinks.forEach((item) => {
          if (item.getAttribute('href') == window.location.hash) {
            item.classList.add('active')
          } else {
            item.classList.remove('active')
          }
        })

        setTimeout(function() {
          initial_nav.classList.add('section-show')
        }, 350);

        scrollto(window.location.hash)
        setPodcastVisible(window.location.hash === '#header')
      }
    } else {
      // No hash -> Home
      setPodcastVisible(true)
    }
  });

  /**
   * Skills animation
   */
  let skilsContent = select('.skills-content');
  if (skilsContent) {
    new Waypoint({
      element: skilsContent,
      offset: '80%',
      handler: function(direction) {
        let progress = select('.progress .progress-bar', true);
        progress.forEach((el) => {
          el.style.width = el.getAttribute('aria-valuenow') + '%'
        });
      }
    })
  }

  /**
   * Testimonials slider
   */
  new Swiper('.testimonials-slider', {
    speed: 600,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    slidesPerView: 'auto',
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
      clickable: true
    },
    breakpoints: {
      320: {
        slidesPerView: 1,
        spaceBetween: 20
      },

      1200: {
        slidesPerView: 3,
        spaceBetween: 20
      }
    }
  });

  /**
   * Porfolio isotope and filter
   */
  window.addEventListener('load', () => {
    let portfolioContainer = select('.portfolio-container');
    if (portfolioContainer) {
      let portfolioIsotope = new Isotope(portfolioContainer, {
        itemSelector: '.portfolio-item',
        layoutMode: 'fitRows'
      });

      let portfolioFilters = select('#portfolio-flters li', true);

      on('click', '#portfolio-flters li', function(e) {
        e.preventDefault();
        portfolioFilters.forEach(function(el) {
          el.classList.remove('filter-active');
        });
        this.classList.add('filter-active');

        portfolioIsotope.arrange({
          filter: this.getAttribute('data-filter')
        });
      }, true);
    }

  });

  /**
   * Initiate portfolio lightbox 
   */
  const portfolioLightbox = GLightbox({
    selector: '.portfolio-lightbox'
  });

  /**
   * Initiate portfolio details lightbox 
   */
  const portfolioDetailsLightbox = GLightbox({
    selector: '.portfolio-details-lightbox',
    width: '90%',
    height: '90vh'
  });

  /**
   * Portfolio details slider
   */
  new Swiper('.portfolio-details-slider', {
    speed: 400,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
      clickable: true
    }
  });

  /**
   * Initiate Pure Counter 
   */
  new PureCounter();

  /**
   * Start typing animation
   */
  typingAnimation();
  aboutAnimation();

})()