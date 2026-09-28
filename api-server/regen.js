const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, 'src/modules');
const dirs = fs.readdirSync(modulesDir).filter(d => fs.statSync(path.join(modulesDir, d)).isDirectory());

const imports = dirs.map(d => {
  const words = d.split('-');
  const name = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'Module';
  return { name, path: `./modules/${d}/${d}.module` };
});

const fileContent = `import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
${imports.map(i => \`import { \${i.name} } from '\${i.path}';\`).join('\n')}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3001),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
      }),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                },
              }
            : undefined,
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // 100 requests per minute
      },
    ]),
    PrismaModule,
${imports.map(i => \`    \${i.name},\`).join('\n')}
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
`;

fs.writeFileSync(path.join(__dirname, 'src/app.module.ts'), fileContent);
console.log('Regenerated app.module.ts');
