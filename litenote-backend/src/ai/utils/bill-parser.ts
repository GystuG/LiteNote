import { ParsedBillDto } from '../dto/parse-bill.dto';

/**
 * 账单解析的系统提示词
 */
export const BILL_PARSE_PROMPT = `你是一个专业的记账助手。请从以下内容中提取所有的消费或收入记录。

对于每条记录，请提取：
- amount: 金额（数字，保留小数）
- type: 类型（expense=支出, income=收入）
- categoryName: 分类（餐饮/交通/购物/居住/娱乐/医疗/教育/工资/理财/其他）
- description: 简短描述（10字以内）
- date: 日期（YYYY-MM-DD 格式，如无法确定则使用今天日期）

请以 JSON 数组格式返回，例如：
[{"amount": 25.6, "type": "expense", "categoryName": "餐饮", "description": "星巴克咖啡", "date": "2026-01-25"}]

注意：
1. 如果无法识别任何账单信息，返回空数组 []
2. 只返回 JSON 数组，不要返回任何其他内容
3. 金额必须是正数
4. 分类必须是上述列表中的一个

用户输入：`;

/**
 * 解析 AI 返回的 JSON
 */
export function parseAIResponse(response: string): ParsedBillDto[] {
  try {
    // 尝试提取 JSON 数组
    const jsonMatch = response.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) {
      return [];
    }

    // 验证和清理数据
    return parsed
      .filter(
        (item) =>
          typeof item.amount === 'number' &&
          item.amount > 0 &&
          ['income', 'expense'].includes(item.type) &&
          typeof item.categoryName === 'string' &&
          typeof item.description === 'string' &&
          typeof item.date === 'string',
      )
      .map((item) => ({
        amount: Number(item.amount.toFixed(2)),
        type: item.type as 'income' | 'expense',
        categoryName: item.categoryName,
        description: item.description.slice(0, 100),
        date: item.date,
      }));
  } catch (error) {
    console.error('解析 AI 响应失败:', error);
    return [];
  }
}
