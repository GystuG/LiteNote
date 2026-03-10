/**
 * 通用 SSE (Server-Sent Events) 解析器
 * 从 fetch Response.body ReadableStream 中逐行解析 event: / data: 字段
 * 被 Claude 适配器和 OpenAI 兼容适配器共享
 */
export async function* parseSSEResponse(
  response: Response,
): AsyncGenerator<{ event: string; data: string }> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let currentEvent = '';
  let currentData = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // 最后一行可能不完整，留在 buffer

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        currentData += line.slice(6);
      } else if (line === '' && currentData) {
        // 空行 = SSE 消息结束
        yield { event: currentEvent, data: currentData };
        currentEvent = '';
        currentData = '';
      }
    }
  }

  // 刷新剩余数据
  if (currentData) {
    yield { event: currentEvent, data: currentData };
  }
}
