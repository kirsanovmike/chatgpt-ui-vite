export interface MessageDto {
    role: number;
    content: string;
}

export interface PromptOptionsDto {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
}

export interface GenerateRequest {
    promptOptions?: PromptOptionsDto;
    messages: MessageDto[];
}

class Llm {
    async generate(request: GenerateRequest): Promise<any> {
        const response = await fetch("/api/v1/llm/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(request)
        });

        const contentType = response.headers.get("content-type") || "";
        const data = contentType.includes("application/json")
            ? await response.json()
            : await response.text();

        if (!response.ok) {
            throw { status: response.status, data };
        }

        return data;
    }
}

export default new Llm();