export const getDefaultConversationData = () => {
    return {
        id: null,
        topic: null,
        messages: [],
        loadingMessages: false,
    }
}

export const getConversations = async () => {
    const { data, error } = await useAuthFetch('/api/chat/conversations/')
    if (!error.value) {
        return data.value
    }
    return []
}

export const addConversation = (conversation) => {
    const conversations = useConversations()
    conversations.value = [conversation, ...conversations.value]
}

export const genTitle = async (conversationId) => {
    const { $settings } = useNuxtApp()
    const openaiApiKey = useApiKey()

    const prompt =
        'Generate a short, human-readable title for this conversation. ' +
        'Rules: 1) max 5 words, 2) no quotes, 3) title case if English, ' +
        '4) reflect the main topic, 5) no personal data.'

    const { data, error } = await useAuthFetch('/api/gen_title/', {
        method: 'POST',
        body: JSON.stringify({
            conversationId,
            prompt,
            openaiApiKey: $settings.open_api_key_setting === 'True' ? openaiApiKey.value : null,
        }),
    })

    if (!error.value) {
        const conversations = useConversations()
        let index = conversations.value.findIndex((item) => item.id === conversationId)
        if (index === -1) {
            // если беседа ещё не в списке — добавим заглушку и поставим topic
            conversations.value.unshift({ ...getDefaultConversationData(), id: conversationId, topic: data.value.title })
            index = 0
        } else {
            conversations.value[index].topic = data.value.title
        }
        return data.value.title
    }
    return null
}

export const fetchUser = async () => {
    return useMyFetch('/api/account/user/')
}

export const setUser = (userData) => {
    const user = useUser()
    user.value = userData
}

export const logout = () => {
    const user = useUser()
    user.value = null
    return navigateTo('/account/signin')
}