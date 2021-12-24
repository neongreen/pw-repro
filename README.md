```
git clone https://github.com/neongreen/pw-repro
cd pw-repro
npm i
npx prisma generate
docker-compose up -d
npx playwright test
```
