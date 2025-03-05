import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie, Serise } from './entity/movie.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Movie,
      Serise,
    ])
  ],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule { }
