import { getServerUrl, getCookie } from '../utils/function.js';

export const userLogin = async (email, password) => {
    const result = await fetch(`${getServerUrl()}/users/login`, {
        method: 'POST',
        credentials: 'include', // 쿠키/세션 포함
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: email,
            password: password,
        }),
    });
    return result;
};

export const checkEmail = async email => {
    const result = fetch(
        `${getServerUrl()}/users/nickname/check?nickname=${email}`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        },
    );
    return result;
};
