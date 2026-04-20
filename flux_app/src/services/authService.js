export const authService = {
  isAuth: () => !!localStorage.getItem('flux_user'),
  
  getUserRole: () => {
    const user = localStorage.getItem('flux_user');
    if (!user || user === 'GUEST') return 'guest';
    return localStorage.getItem('flux_user_role') || 'registered';
  },
  
  isGuest: () => authService.getUserRole() === 'guest',
  
  logout: () => {
    localStorage.clear();
    sessionStorage.clear();
    location.reload();
  },
  
  simpleHash: (str) => btoa(unescape(encodeURIComponent(str)))
};
