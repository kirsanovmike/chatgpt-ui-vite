// Грубая оценка: 1 токен ≈ 3 символа (с запасом).
export function estimateTokens(text: string): number {
    if (!text) return 0;
    const chars = text.trim().length;
    return Math.ceil(chars / 3) + 8; // + небольшой оверхед на роль/формат
}

const MODEL_CONTEXT_LIMIT: Record<string, number> = {
    'qwen3:30b-a3b-q4_K_M': 32_000,
    'qwen3-coder:30b': 32_000,
};

const DEFAULT_CONTEXT_LIMIT = 8_000;
const RESERVED_OUTPUT_TOKENS = 2_000;
const SAFETY_MARGIN_TOKENS = 2_000;

export function getMaxContextTokens(model?: string): number {
    if (!model) return DEFAULT_CONTEXT_LIMIT;
    return MODEL_CONTEXT_LIMIT[model] ?? DEFAULT_CONTEXT_LIMIT;
}

export function trimMessagesByTokens(
    allMessages: MessageDto[],
    model?: string,
): MessageDto[] {
    const maxContext = getMaxContextTokens(model);
    const maxHistoryTokens =
        maxContext - RESERVED_OUTPUT_TOKENS - SAFETY_MARGIN_TOKENS;

    // если вдруг лимит получился совсем маленький
    if (maxHistoryTokens <= 0) return allMessages.slice(-1);

    let total = 0;
    const result: MessageDto[] = [];

    // Если появятся system-сообщения — их можно выделить в отдельный массив
    // и всегда отправлять, а историю резать только по user/assistant.
    for (let i = allMessages.length - 1; i >= 0; i--) {
        const msg = allMessages[i];
        const tokens = estimateTokens(msg.content);

        if (total + tokens > maxHistoryTokens) break;

        result.push(msg);
        total += tokens;
    }

    // мы шли с конца, поэтому разворачиваем обратно
    return result.reverse();
}
