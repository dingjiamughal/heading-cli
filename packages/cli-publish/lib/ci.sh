git checkout feature/dev
git pull
git checkout $1
git pull
git merge feature/dev --squash
git commit -m "chore: squash merge feature/dev to branch dev <本地 ci 工具 commitId>"
git push

echo 开始发布 $1 环境
npm run pub
