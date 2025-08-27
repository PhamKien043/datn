import axios from "axios";

const Momoaxios = axios.create({
    baseURL: "http://localhost:5000/",

    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});


Momoaxios.interceptors.request.use(
    (config) => {
        console.log('MoMo Request:', config);
        return config;
    },
    (error) => {
        console.error('MoMo Request Error:', error);
        return Promise.reject(error);
    }
);


Momoaxios.interceptors.response.use(
    (response) => {
        console.log('MoMo Response:', response.data);
        return response;
    },
    (error) => {
        console.error('MoMo Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default Momoaxios;