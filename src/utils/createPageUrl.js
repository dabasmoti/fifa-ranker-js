export const createPageUrl = (pageName) => {
  return `/${pageName.toLowerCase().replace(/\s+/g, '-')}`;
}; 