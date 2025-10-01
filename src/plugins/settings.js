const transformData = (list = []) =>
    list.reduce((acc, item) => {
        acc[item.name] = item.value
        return acc
    }, {})

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.hook('app:created', async () => {
        let settings = {}

        try {
            const { data, error } = await useAuthFetch('/api/chat/settings/', {
                method: 'GET',
            })

            if (!error.value && Array.isArray(data.value)) {
                settings = transformData(data.value)
            }
        } catch (e) {
            console.error('Failed to fetch settings:', e)
        }

        nuxtApp.provide('settings', settings)
    })
})