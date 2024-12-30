import globalContext from '../context';

export const redirectToLogin = () => {
  window.location.href = `${globalContext.ovincWebUrl}/login/?next=${encodeURIComponent(window.location.href)}`;
};
