import type { FieldError } from '../interface';

export function allPromiseFinish(promiseList: Promise<FieldError>[]): Promise<FieldError[]> {
  // 标记校验结果是否有错误
  let hasError = false;
  let count = promiseList.length;
  const results: FieldError[] = [];

  if (!promiseList.length) {
    return Promise.resolve([]);
  }

  // 这里返回的一个新的 Promise 对象
  return new Promise((resolve, reject) => {
    // 遍历 promisList
    promiseList.forEach((promise, index) => {
      promise
        .catch(e => {
          // 将 hasError 标记为 true
          hasError = true;
          return e;
        })
        .then(result => {
          count -= 1;
          results[index] = result;

          // 当还有 promise 没处理时，继续下一个 promise 的处理
          if (count > 0) {
            return;
          }

          // 如果所有的 promise 都处理完成，并且有错误，则 reject
          if (hasError) {
            reject(results);
          }
          // 否则 resolve
          resolve(results);
        });
    });
  });
}
