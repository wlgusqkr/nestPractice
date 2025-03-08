import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie, } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entitiy/director.entity';

@Injectable()
export class MovieService {
  private movies: Movie[] = [];
  private idCounter = 3;
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>
  ) {
  }
  async getManyMovies(title?: string) {
    const movie = await this.movieRepository.find({
      where: {
        // title: Like(`%${title}%`)
      },
      relations: ['detail', 'director']
    });
    // 나중에 title 필터기능 추가하기
    return movie;
  }

  async getMovieById(id: number) {
    const movie = await this.movieRepository.findOne({
      where: {
        id
      },
      relations: ['detail']
    })
    return movie;
  }

  async createMovie(createMovieDto: CreateMovieDto) {
    const director = await this.directorRepository.findOne({
      where: {
        id: createMovieDto.directorId
      }
    })
    if (!director) {
      throw new NotFoundException("존재하지 않는 감독입니다.")
    }

    const movie = await this.movieRepository.save({
      title: createMovieDto.title,
      genre: createMovieDto.genre,
      detail: { // 이러면 알아서 movieDetail을 만들어 주고 넣어줌.
        detail: createMovieDto.detail
      },
      director
    })
    return movie;
  }


  async updateMovie(id: number, updateMovieDto: UpdateMovieDto) {

    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
      relations: ['detail']
    })

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID입니다')
    }

    const { detail, directorId, ...movieRest } = updateMovieDto;

    let newDirector;
    if (directorId) {
      const director = await this.directorRepository.findOne({
        where: {
          id: directorId
        }
      })
      if (!director) {
        throw new NotFoundException("존재하지 않는 감독입니다.")
      }
      newDirector = director;
    }

    const movieUpdateFields = {
      ...movieRest,
      ...(newDirector && { director: newDirector })
    }

    await this.movieRepository.update(
      { id },
      movieRest
    )

    if (detail) {
      this.movieDetailRepository.update(
        { id: movie.detail.id },
        { detail }
      )
    }

    const newMovie = await this.movieRepository.findOne({
      where: {
        id
      },
      relations: ['detail', 'director']
    })

    return newMovie;
  }

  async deleteMovie(id: number) {
    const movie = await this.movieRepository.findOne({
      where: {
        id
      },
      relations: ['detail']
    })


    if (!movie) {
      throw new NotFoundException('존재하지않는 ID입니다.');
    }
    await this.movieRepository.delete(id);
    await this.movieDetailRepository.delete(movie.detail.id);
    return id;
  }
}
