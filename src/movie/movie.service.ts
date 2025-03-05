import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';

@Injectable()
export class MovieService {
  private movies: Movie[] = [];
  private idCounter = 3;
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>) {
  }
  getManyMovies(title?: string) {
    // 나중에 title 필터기능 추가하기
    return this.movieRepository.find({
      where: {
        title: Like(`%${title}%`)
      }
    });
  }

  async getMovieById(id: number) {
    const movie = await this.movieRepository.findOne({
      where: {
        id
      }
    })
    return movie;
  }
  async createMovie(createMovieDto: CreateMovieDto) {
    const movie = await this.movieRepository.save(createMovieDto)
    return movie;
  }

  async updateMovie(id: number, updateMovieDto: UpdateMovieDto) {

    const movie = await this.movieRepository.findOne({
      where: {
        id
      }
    })

    await this.movieRepository.update(
      { id },
      updateMovieDto,
    )
    const newMovie = await this.movieRepository.findOne({
      where: {
        id
      }
    })

    return newMovie;
  }

  async deleteMovie(id: number) {
    const movie = this.movieRepository.findOne({
      where: {
        id
      }
    })
    // const movieIndex = this.movies.findIndex(m => m.id === +id);


    if (!movie) {
      throw new NotFoundException('존재하지않는 ID입니다.');
    }
    await this.movieRepository.delete(id)
    return id;
  }
}
