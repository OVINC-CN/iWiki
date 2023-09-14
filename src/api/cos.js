import http from './index';
import globalContext from '../context';

export const uploadFileAPI = (data) => new Promise((resolve, reject) => {
  http.post(
      `${globalContext.backendUrl}/cos/upload/`,
      data,
      {headers: {'Content-Type': 'multipart/form-data'}},
  ).then((res) => resolve(res), (err) => reject(err));
});
