/** Landing site routes (separate from /app workbench). */
export const LANDING_PATHS = {
  home: '/',
  scenarios: '/scenarios',
  workflow: '/workflow',
  faq: '/faq',
  updates: '/updates',
};

const PATH_TO_PAGE = Object.fromEntries(
  Object.entries(LANDING_PATHS).map(([page, path]) => [path, page]),
);

export function getLandingPageFromPath(pathname = '/') {
  return PATH_TO_PAGE[pathname] ?? 'home';
}

export function getLandingPath(page = 'home') {
  return LANDING_PATHS[page] ?? LANDING_PATHS.home;
}

export function isLandingPath(pathname) {
  return pathname === '/app' ? false : pathname in PATH_TO_PAGE || pathname === '/';
}

export function isWorkbenchPath(pathname) {
  return pathname === '/app';
}