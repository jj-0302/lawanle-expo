import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
if (existsSync('.env')) { console.log('.env 已存在，保留现有配置。'); }
else { writeFileSync('.env', readFileSync('.env.example', 'utf8').replace('generate_with_npm_run_setup', randomBytes(32).toString('hex'))); console.log('已创建 server/.env 并生成访问码。请在此文件填写 DeepSeek API 密钥，将 APP_ACCESS_TOKEN 填入应用的服务访问码。'); }
