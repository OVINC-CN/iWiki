import http from './index';
import globalContext from '../context';

export const getUserInfoAPI = () => new Promise((resolve, reject) => {
  http.get(`${globalContext.backendUrl}/account/user_info/`).then((res) => resolve(res), (err) => reject(err));
});
