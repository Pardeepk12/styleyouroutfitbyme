/**
 * script.js — Curated Picks Affiliate Page
 *
 * Lightweight vanilla JS only. No frameworks. No dependencies.
 *
 * Features:
 *  1. Auto-update footer copyright year
 *  2. Scroll-triggered fade-in for product cards (IntersectionObserver)
 *  3. Outbound link click logging (swap console.log for analytics if needed)
 *  4. Read More / Read Less for product descriptions
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     1. FOOTER YEAR
  ---------------------------------------------------------- */
  var yearEl = document.getElementById('footer-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }


  /* ----------------------------------------------------------
     2. SCROLL-TRIGGERED CARD FADE-IN
  ---------------------------------------------------------- */
  var cards = document.querySelectorAll('.product-card');

  if (cards.length) {
    if ('IntersectionObserver' in window) {
      var cardObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              cardObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      cards.forEach(function (card) { cardObserver.observe(card); });
    } else {
      // Fallback for old browsers
      cards.forEach(function (card) { card.classList.add('is-visible'); });
    }
  }


  /* ----------------------------------------------------------
     3. OUTBOUND LINK CLICK LOGGING
     Replace console.log with your analytics call if needed.
  ---------------------------------------------------------- */
  var productLinks = document.querySelectorAll('.btn-view-product');

  productLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      var card  = link.closest('.product-card');
      var title = card
        ? (card.querySelector('.product-title') || {}).textContent || 'Unknown'
        : 'Unknown';

      console.log('[Curated Picks] Affiliate link clicked:', {
        product: title.trim(),
        url:     link.href,
        time:    new Date().toISOString(),
      });

      /*
        Swap the console.log above with your analytics:

        // Google Analytics 4
        gtag('event', 'affiliate_click', {
          event_category: 'Outbound Link',
          event_label: title.trim(),
          transport_type: 'beacon',
        });

        // Plausible
        plausible('Affiliate Click', { props: { product: title.trim() } });
      */
    });
  });


  /* ----------------------------------------------------------
     4. READ MORE / READ LESS
     
     HOW IT WORKS:
     - Each .product-description sits inside a .desc-wrapper div.
     - A <button class="btn-read-more"> follows the wrapper in the HTML.
     - This function measures the description's TRUE natural height by
       temporarily removing all CSS clamping, reading scrollHeight,
       then restoring the styles before the browser paints.
     - If natural height > 4 lines: button shown, wrapper height animated.
     - If natural height <= 4 lines: button hidden, no clamp applied.
     - Works automatically for every current and future product card.
  ---------------------------------------------------------- */
  (function initReadMore() {

    var LINE_CLAMP    = 4;
    var descriptions  = document.querySelectorAll('.product-description');

    if (!descriptions.length) return;

    descriptions.forEach(function (desc) {

      // Expect: .desc-wrapper > .product-description
      // Expect: .desc-wrapper + .btn-read-more
      var wrapper = desc.parentElement;
      var btn     = wrapper ? wrapper.nextElementSibling : null;

      if (
        !wrapper ||
        !wrapper.classList.contains('desc-wrapper') ||
        !btn ||
        !btn.classList.contains('btn-read-more')
      ) {
        return; // Skip if HTML structure doesn't match
      }

      // ── STEP 1: Calculate the collapsed height (4 lines) ──────────
      var computedStyle  = getComputedStyle(desc);
      var lineHeight     = parseFloat(computedStyle.lineHeight);

      // Fallback if lineHeight is 'normal' (not a px value)
      if (isNaN(lineHeight)) {
        var fontSize = parseFloat(computedStyle.fontSize) || 16;
        lineHeight   = fontSize * 1.75; // matches our CSS line-height: 1.75
      }

      var collapsedHeight = lineHeight * LINE_CLAMP;

      // ── STEP 2: Measure the TRUE natural height ────────────────────
      // Temporarily override clamping styles (before first paint — no flicker)
      desc.style.setProperty('display',             'block',   'important');
      desc.style.setProperty('overflow',            'visible', 'important');
      desc.style.setProperty('-webkit-line-clamp',  'unset',   'important');

      var naturalHeight = desc.scrollHeight;

      // Immediately restore — browser hasn't painted yet inside this sync block
      desc.style.removeProperty('display');
      desc.style.removeProperty('overflow');
      desc.style.removeProperty('-webkit-line-clamp');

      // ── STEP 3: Decide whether truncation is needed ────────────────
      var needsTruncation = naturalHeight > collapsedHeight + 4; // 4px tolerance

      if (!needsTruncation) {
        // Short description: remove clamping entirely, hide button
        desc.style.setProperty('display',   'block',   'important');
        desc.style.setProperty('overflow',  'visible', 'important');
        wrapper.style.maxHeight = 'none';
        btn.classList.add('is-hidden');
        return;
      }

      // ── STEP 4: Apply collapsed state ─────────────────────────────
      wrapper.style.maxHeight = collapsedHeight + 'px';

      // ── STEP 5: Wire up the toggle button ─────────────────────────
      btn.addEventListener('click', function () {

        var isExpanded = btn.getAttribute('aria-expanded') === 'true';

        if (isExpanded) {
          // ── COLLAPSE ──
          // Pin to current rendered height so CSS transition has a start point
          wrapper.style.maxHeight = wrapper.scrollHeight + 'px';

          // Force reflow so browser registers the pinned height
          // before we immediately change it to the collapsed value
          wrapper.getBoundingClientRect();

          // Animate back to collapsed height
          wrapper.style.maxHeight = collapsedHeight + 'px';

          // Restore webkit clamp (gives the ellipsis back)
          desc.classList.remove('is-expanded');

          btn.setAttribute('aria-expanded', 'false');
          btn.setAttribute('aria-label', 'Read more about this product');
          // Update only the text node, preserve the icon element
          btn.firstChild.textContent = 'Read more ';

        } else {
          // ── EXPAND ──
          // Animate wrapper to the paragraph's full scroll height
          wrapper.style.maxHeight = naturalHeight + 'px';

          // Remove webkit clamp so full text is visible
          desc.classList.add('is-expanded');

          btn.setAttribute('aria-expanded', 'true');
          btn.setAttribute('aria-label', 'Show less of this description');
          btn.firstChild.textContent = 'Read less ';

          // After the transition ends, release fixed max-height
          // so the layout breathes freely (e.g. if fonts resize)
          wrapper.addEventListener('transitionend', function releaseHeight() {
            if (btn.getAttribute('aria-expanded') === 'true') {
              wrapper.style.maxHeight = 'none';
            }
            wrapper.removeEventListener('transitionend', releaseHeight);
          });
        }
      });

    }); // end forEach

  })(); // end initReadMore


})(); // End main IIFE
