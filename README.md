-git clone 시 설정 사항
1.npm i express
2.npm install -g nodemon
3. .gitignore 파일 생성
/////////////////////////////////////////////////
# Node.js 관련 파일
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 환경변수 파일 (비밀번호, API 키 등 포함)
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# 빌드/캐시 파일
dist/
build/
.cache/
.tmp/
out/

# 로그 파일
logs
*.log
logs/
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*
lerna-debug.log*

# OS 및 IDE 관련 파일
.DS_Store
Thumbs.db
.vscode/
.idea/
*.swp
*.swo

# Git 관련 무시 파일
.git/
.gitignore
///////////////////////////////////////////////

4. .env 파일 생성
카톡방 참고
