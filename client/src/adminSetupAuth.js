export const ADMIN_SETUP_ACCESS_KEY = 'adminCouncilSetupAccess';
export const ADMIN_SETUP_TOKEN_KEY = 'adminCouncilSetupToken';

export function getAdminSetupToken() {
  return sessionStorage.getItem(ADMIN_SETUP_TOKEN_KEY);
}

export function hasAdminSetupAccess() {
  return sessionStorage.getItem(ADMIN_SETUP_ACCESS_KEY) === 'true' && Boolean(getAdminSetupToken());
}

export function setAdminSetupSession(token) {
  sessionStorage.setItem(ADMIN_SETUP_ACCESS_KEY, 'true');
  sessionStorage.setItem(ADMIN_SETUP_TOKEN_KEY, token);
}

export function clearAdminSetupSession() {
  sessionStorage.removeItem(ADMIN_SETUP_ACCESS_KEY);
  sessionStorage.removeItem(ADMIN_SETUP_TOKEN_KEY);
}
