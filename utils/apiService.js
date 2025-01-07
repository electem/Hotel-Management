/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
/**
 * @name Hotel Room Booking System
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @version v0.0.1
 *
 */

import axios from 'axios';
import getConfig from 'next/config';
import {
  getSessionToken, removeSessionAndLogoutUser, setSessionToken, getRefreshToken
} from './authentication';

const { publicRuntimeConfig } = getConfig();

const ApiService = axios.create({
  baseURL: publicRuntimeConfig.API_BASE_URL
});

/**
 * Interceptor for all requests
 */
ApiService.interceptors.request.use(
  (config) => {
    config.headers['Content-Type'] = 'application/json';

    if (!config?.noAuth) {
      const token = getSessionToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Interceptor for all responses
 */
ApiService.interceptors.response.use(
  (response) => response?.data || {},

  async (error) => {
    const originalRequest = error.config;

    if (error?.response?.data?.result_code === 11) {
      removeSessionAndLogoutUser();
      return Promise.reject(error);
    }

    // eslint-disable-next-line no-underscore-dangle
    if (error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        }).catch((err) => Promise.reject(err));
      }

      // eslint-disable-next-line no-underscore-dangle
      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();

      const refreshTokengenerate = async () => {
        try {
          const response = await axios.get(
            `${publicRuntimeConfig.API_BASE_URL}/auth/newrefresh`,
            {
              headers: {
                Authorization: `Bearer ${refreshToken}`
              }
            }
          );
          console.log(response.data);
          const { access_token } = response.data; // Assuming response.data contains the access_token

          setSessionToken(access_token);
          ApiService.defaults.headers.common.Authorization = `Bearer ${access_token}`;
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          processQueue(null, access_token);
          console.log('Token generated');

          return axios(originalRequest);
        } catch (err) {
          processQueue(err, null);
          removeSessionAndLogoutUser();
          throw err;
        } finally {
          isRefreshing = false;
        }
      };
    }

    return Promise.reject(error);
  }
);

export default ApiService;
