import http from './index';
import globalContext from '../context';

export const loadPermissionAPI = () => new Promise((resolve, reject) => {
  http.get(`${globalContext.backendUrl}/permissions/`).then((res) => resolve(res), (err) => reject(err));
});
