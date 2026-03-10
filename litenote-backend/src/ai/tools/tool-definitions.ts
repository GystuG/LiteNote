import { ToolDefinition } from '../types/chat.types';

/**
 * AI 可调用的工具定义
 * 遵循 JSON Schema 格式，兼容 Claude 和 OpenAI
 */
export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'create_bills',
    description:
      '识别并创建账单记录。当用户提到了消费或收入，且信息足够完整（至少有金额）时调用此工具。如果用户没有指定日期，使用今天的日期。如果用户没有明确指定分类，根据描述自动推断最合适的分类。',
    parameters: {
      type: 'object',
      properties: {
        bills: {
          type: 'array',
          description: '识别到的账单列表',
          items: {
            type: 'object',
            properties: {
              amount: {
                type: 'number',
                description: '金额，正数',
              },
              type: {
                type: 'string',
                enum: ['income', 'expense'],
                description: '类型：income=收入, expense=支出',
              },
              description: {
                type: 'string',
                description: '简短描述，10字以内',
              },
              categoryName: {
                type: 'string',
                description: '分类名称，必须从用户可用的分类中选择',
              },
              date: {
                type: 'string',
                description: '日期，YYYY-MM-DD 格式',
              },
            },
            required: [
              'amount',
              'type',
              'description',
              'categoryName',
              'date',
            ],
          },
        },
      },
      required: ['bills'],
    },
  },
  {
    name: 'query_bills',
    description:
      '查询用户的账单记录。当用户想查看、搜索或了解某段时间内的账单时调用。',
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: '开始日期，YYYY-MM-DD 格式',
        },
        endDate: {
          type: 'string',
          description: '结束日期，YYYY-MM-DD 格式',
        },
        type: {
          type: 'string',
          enum: ['income', 'expense'],
          description: '筛选类型，不传则返回全部',
        },
        categoryName: {
          type: 'string',
          description: '按分类名称筛选',
        },
        limit: {
          type: 'number',
          description: '返回数量限制，默认20，最大50',
        },
      },
    },
  },
  {
    name: 'delete_bills',
    description:
      '删除指定的账单记录。需要提供要删除的账单ID列表。只有在用户明确要求删除时才调用此工具。',
    parameters: {
      type: 'object',
      properties: {
        billIds: {
          type: 'array',
          items: { type: 'number' },
          description: '要删除的账单ID列表',
        },
      },
      required: ['billIds'],
    },
  },
  {
    name: 'get_statistics',
    description:
      '获取用户的账单统计信息，包括收支总额、分类占比、趋势等。当用户询问统计、消费趋势、分析、总结等问题时调用。',
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: '统计开始日期，YYYY-MM-DD 格式',
        },
        endDate: {
          type: 'string',
          description: '统计结束日期，YYYY-MM-DD 格式',
        },
      },
    },
  },
];
