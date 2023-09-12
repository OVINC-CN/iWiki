import http from './index';
import globalContext from '../context';

export const createDocAPI = data => new Promise((resolve, reject) => {
  http.post(
    `${globalContext.backendUrl}/doc/`,
    data,
  ).then(res => resolve(res), err => reject(err));
});
