export const GA_ID = "G-XXXXXXXXXX"; // replace later

export const trackPageView = (url: string) => {
  window.gtag("config", GA_ID, {
    page_path: url,
  });
};

export const trackEvent = (action: string, category: string, label?: string) => {
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
  });
};
