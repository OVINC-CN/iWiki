import http from './index';

export const homeAPI = () => new Promise((resolve, reject) => {
  http.get('/').then(res => resolve(res), err => reject(err));
});


export const changeLangAPI = language => new Promise((resolve, reject) => {
  http.post('/i18n/', { language }).then(res => resolve(res), err => reject(err));
});
