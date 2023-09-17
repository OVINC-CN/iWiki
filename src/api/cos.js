import http from './index';
import globalContext from '../context';

export const getCOSTempSecretAPI = (filename) => new Promise((resolve, reject) => {
  http.post(
      `${globalContext.backendUrl}/cos/temp_secret/`,
      {filename},
  ).then((res) => resolve(res), (err) => reject(err));
});
