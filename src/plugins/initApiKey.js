export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.hook('app:created', () => {
        const apiKey = useApiKey()
        const stored = getStoredApiKey()
        if (stored) {
            apiKey.value = stored
        }
    })
})