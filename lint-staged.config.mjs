import { existsSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

const root = import.meta.dirname;

// 앱에 의존성이 설치되어 있을 때만 해당 도구를 실행한다.
// 앱 초기화 이전에는 node_modules가 없으므로 lint/format을 조용히 건너뛴다.
function hasBinary(appDir, binary) {
  return existsSync(resolve(root, appDir, 'node_modules', '.bin', binary));
}

function commandsFor(appDir, files) {
  const relativeFiles = files
    .map((file) => relative(resolve(root, appDir), file))
    .join(' ');
  const tasks = [];

  if (hasBinary(appDir, 'eslint')) {
    tasks.push(
      `cd ${appDir} && eslint --max-warnings=0 --no-error-on-unmatched-pattern ${relativeFiles}`,
    );
  }
  if (hasBinary(appDir, 'prettier')) {
    tasks.push(`cd ${appDir} && prettier --write --ignore-unknown ${relativeFiles}`);
  }

  return tasks;
}

export default {
  'apps/front/**/*.{js,jsx,mjs,ts,tsx}': (files) => commandsFor('apps/front', files),
  'apps/back/**/*.{js,mjs,ts}': (files) => commandsFor('apps/back', files),
};
