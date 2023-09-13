import http from './index';
import globalContext from '../context';

export const listTagsAPI = () => new Promise((resolve, reject) => {
  http.get(`${globalContext.backendUrl}/tags/`).then(res => resolve(res), err => reject(err));
});


export const listBoundTagsAPI = () => new Promise((resolve, reject) => {
  http.get(`${globalContext.backendUrl}/tags/bound/`).then(res => resolve(res), err => reject(err));
});
