// storage-models.js
// Зависимости:
// - STORAGE_KEY, MODELS, DEFAULT_MODEL_NAME — из вашего constants-файла
// - useModels(), useApiKey() — из ваших composables

// ----- Storage wrapper (SSR-safe) -----
const storage = {
    get(key, fallback = null) {
        if (process.server) return fallback
        try {
            const raw = localStorage.getItem(key)
            return raw ? JSON.parse(raw) : fallback
        } catch {
            return fallback
        }
    },
    set(key, val) {
        if (process.server) return
        try {
            localStorage.setItem(key, JSON.stringify(val))
        } catch {
            /* noop */
        }
    }
}

// ----- Models helpers -----
// Всегда работаем с именем модели (string).
// Объект-конфиг модели берём через getModelConfig(name).

/** Вернёт конфиг модели по имени (или конфиг дефолтной модели). */
export const getModelConfig = (modelName) => {
    return MODELS[modelName] || MODELS[DEFAULT_MODEL_NAME]
}

/** Сохранить список моделей (как массив строк/имен). */
export const setModels = (val) => {
    const models = useModels?.()
    storage.set(STORAGE_KEY.MODELS, val)
    if (models) models.value = val
}

/** Получить список моделей из storage (массив строк/имен). */
export const getStoredModels = () => {
    // fallback — пустой список, т.к. список моделей вы держите в коде/константах
    return storage.get(STORAGE_KEY.MODELS, [])
}

/** Сохранить текущую модель (имя модели). */
export const saveCurrentModel = (modelName) => {
    storage.set(STORAGE_KEY.CURRENT_MODEL, modelName)
}

/** Получить текущее имя модели (строка). */
export const getCurrentModel = () => {
    return storage.get(STORAGE_KEY.CURRENT_MODEL, DEFAULT_MODEL_NAME)
}

// ----- API key -----

export const setApiKey = (val) => {
    const apiKey = useApiKey?.()
    storage.set(STORAGE_KEY.OPENAI_API_KEY, val)
    if (apiKey) apiKey.value = val
}

export const getStoredApiKey = () => {
    return storage.get(STORAGE_KEY.OPENAI_API_KEY, null)
}