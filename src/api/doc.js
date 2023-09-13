import http from './index';
import globalContext from '../context';

export const createDocAPI = data => new Promise((resolve, reject) => {
  http.post(
    `${globalContext.backendUrl}/docs/`,
    data,
  ).then(res => resolve(res), err => reject(err));
});

export const updateDocAPI = (id, data) => new Promise((resolve, reject) => {
  http.put(
    `${globalContext.backendUrl}/docs/${id}/`,
    data,
  ).then(res => resolve(res), err => reject(err));
});

export const loadDocDataAPI = id => new Promise((resolve, reject) => {
  http.get(`${globalContext.backendUrl}/docs/${id}/`).then(res => resolve(res), err => reject(err));
});


export const listDocsAPI = params => new Promise((resolve, reject) => {
  http.get(`${globalContext.backendUrl}/docs/`, { params }).then(res => resolve(res), err => reject(err));
});

