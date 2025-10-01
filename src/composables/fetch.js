export const useMyFetch = (url, options = {}) => {
    const defaultOptions = {
        headers: {
            Accept: 'application/json'
        }
    }

    if (process.server) {
        defaultOptions.baseURL = process.env.SERVER_DOMAIN
    }

    // Не мутируем defaultOptions — а мержим
    return useFetch(url, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }
    })
}

export const useAuthFetch = async (url, options = {}) => {
    const res = await useMyFetch(url, options)

    if (res.error.value?.status === 401) {
        await logout()
    }

    return res
}