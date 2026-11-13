export function revealOnScroll(node: HTMLElement, delay = 0) {
  if (
    !('IntersectionObserver' in window) ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }

  node.style.setProperty('--reveal-delay', `${delay * 55}ms`);
  node.classList.add('scroll-reveal-pending');

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      node.classList.remove('scroll-reveal-pending');
      node.classList.add('scroll-reveal-visible');
      observer.unobserve(node);
    },
    { threshold: 0.01, rootMargin: '0px 0px -4% 0px' }
  );

  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();
    }
  };
}
