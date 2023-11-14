import toposort from 'toposort';

import { notEmpty } from './arrays.js';

interface OrderRule {
  comesBefore?: string | string[];
  comesAfter?: string | string[];
}

export interface OrderedList<T> {
  addItem(key: string, item: T, orderRules?: OrderRule): OrderedList<T>;
  getItems(): T[];
}

function normalizeArray(array: string | string[]): string[] {
  return Array.isArray(array) ? array : [array];
}

export function createOrderedList<T>(): OrderedList<T> {
  const items: { key: string; item: T; orderRules?: OrderRule }[] = [];

  return {
    addItem(key, item, orderRules?) {
      if (items.find((i) => i.key === key)) {
        throw new Error(`Item with key ${key} already exists`);
      }
      items.push({ key, item, orderRules });
      return this;
    },
    getItems() {
      const comesBeforeRules = items.flatMap((item) =>
        normalizeArray(item.orderRules?.comesBefore ?? []).map(
          (rule): [string, string] => [rule, item.key],
        ),
      );
      const comesAfterRules = items.flatMap((item) =>
        normalizeArray(item.orderRules?.comesAfter ?? []).map(
          (rule): [string, string] => [item.key, rule],
        ),
      );
      return toposort
        .array(
          items.map((item) => item.key),
          [...comesBeforeRules, ...comesAfterRules],
        )
        .map((key) => items.find((item) => item.key === key)?.item)
        .filter(notEmpty);
    },
  };
}
