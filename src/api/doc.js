import http from './index';
import globalContext from '../context';

export const createDocAPI = data => new Promise((resolve, reject) => {
  http.post(
    `${globalContext.backendUrl}/doc/`,
    data,
  ).then(res => resolve(res), err => reject(err));
});

export const updateDocAPI = (id, data) => new Promise((resolve, reject) => {
  http.put(
    `${globalContext.backendUrl}/doc/${id}/`,
    data,
  ).then(res => resolve(res), err => reject(err));
});

export const loadDocDataAPI = id => new Promise((resolve, reject) => {
  http.get(`${globalContext.backendUrl}/doc/${id}`).then(res => resolve(res), err => reject(err));
});
