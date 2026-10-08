import { NestFactory } from '@nestjs/core';
import { 
  FastifyAdapter, 
  NestFastifyApplication 
} from '@nestjs/platform-fastify';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(), {
    instrument: ObserveInstrument,
  });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
