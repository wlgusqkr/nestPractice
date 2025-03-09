import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie, } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Like, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entitiy/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';

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
    private readonly directorRepository: Repository<Director>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    private readonly dataSource: DataSource
  ) {
  }
  async findAll(title?: string) {
    const qb = await this.movieRepository.createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');

    if (title) {
      qb.where('movie.title LIKE :title', { title: `%${title}%` });
    }
    return await qb.getManyAndCount();
    // const movie = await this.movieRepository.find({
    //   where: {
    //     // title: Like(`%${title}%`)
    //   },
    //   relations: ['detail', 'director', 'genres']
    // });
    // return movie;
  }

  async findOne(id: number) {
    const movie = await this.movieRepository.createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .leftJoinAndSelect('movie.detail', 'detail')
      .where('movie.id = :id', { id })
      .getOne()
    return movie;
    // const movie = await this.movieRepository.findOne({
    //   where: {
    //     id
    //   },
    //   relations: ['detail']
    // })
    // return movie;
  }

  async createMovie(createMovieDto: CreateMovieDto) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect(); // DB 연결
    await qr.startTransaction(); // 제약을 줄 수 있다. 비어 있으면 DB 기본 제약

    try {

      const director = await qr.manager.findOne(Director, {
        where: {
          id: createMovieDto.directorId
        }
      })
      if (!director) {
        throw new NotFoundException("존재하지 않는 감독입니다.")
      }

      const genres = await qr.manager.find(Genre, {
        where: {
          id: In(createMovieDto.genreIds)
        }
      })

      if (genres.length !== createMovieDto.genreIds.length) {
        throw new NotFoundException("존재하지 않는 Genre가 있습니다.")
      }

      const movieDetail = await qr.manager.createQueryBuilder()
        .insert()
        .into(MovieDetail)
        .values({
          detail: createMovieDto.detail
        })
        .execute();

      const movieDetailId = movieDetail.identifiers[0].id;

      const movie = await qr.manager.createQueryBuilder()
        .insert()
        .into(Movie)
        .values({
          title: createMovieDto.title,
          detail: {
            id: movieDetailId
          },
          director,
        })
        .execute();

      const movieId = movie.identifiers[0].id;

      await qr.manager.createQueryBuilder()
        .relation(Movie, 'genres')
        .of(movieId)
        .add(genres.map(genre => genre.id));

      await qr.commitTransaction(); // DB에 COMMIT로 반영

      return await this.movieRepository.findOne({
        where: {
          id: movieId
        },
        relations: ['detail', 'director', 'genres']
      })

      // QueryBuilder는 Cascade가 없어서 이렇게 일일이 해야함.
      // const movie = await this.movieRepository.save({
      //   title: createMovieDto.title,
      //   detail: { // 이러면 알아서 movieDetail을 만들어 주고 넣어줌.
      //     id: movieDetailId
      //   },
      //   director,
      //   genres
      // })
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release(); // database pull에다가 transaction을 되돌려줘야함.
    }

  }


  async updateMovie(id: number, updateMovieDto: UpdateMovieDto) {

    const qr = await this.dataSource.createQueryRunner();
    qr.connect(); qr.startTransaction();

    try {
      const movie = await qr.manager.findOne(Movie, {
        where: {
          id,
        },
        relations: ['detail', 'genres']
      })

      if (!movie) {
        throw new NotFoundException('존재하지 않는 ID입니다')
      }

      const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

      let newDirector;
      if (directorId) {
        const director = await qr.manager.findOne(Director, {
          where: {
            id: directorId
          }
        })
        if (!director) {
          throw new NotFoundException("존재하지 않는 감독입니다.")
        }
        newDirector = director;
      }

      let newGenres;
      if (genreIds) {
        const genre = await qr.manager.find(Genre, {
          where: {
            id: In(updateMovieDto.genreIds)
          }
        })

        if (genre.length !== updateMovieDto.genreIds.length) {
          throw new NotFoundException('존재하지 않는 장르가 있습니다!')
        }
        newGenres = genre;
      }

      const movieUpdateFields = {
        ...movieRest,
        ...(newDirector && { director: newDirector })
      }

      await qr.manager.createQueryBuilder()
        .update(Movie)
        .set(movieUpdateFields)
        .where('id = :id', { id })
        .execute()

      if (detail) {
        await qr.manager.createQueryBuilder()
          .update(MovieDetail)
          .set({ detail })
          .where('id = :id', { id })
          .execute()
      }

      // 원래는 무비를 찾아서 장르를 바꿔치기했는데 QueryBuilder로 한번에 가능
      if (newGenres) {
        await qr.manager.createQueryBuilder()
          .relation(Movie, 'genres')
          .of(id)
          .addAndRemove(newGenres.map(genre => genre.id), movie.genres.map(genre => genre.id))
      }

      await qr.commitTransaction();

      return await this.movieRepository.findOne({
        where: {
          id
        },
        relations: ['detail', 'director', 'genres']
      });
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
    // movie 를 찾고 directorId를 찾고 Genres를 찾고 updateField를 만들어서 movie 테이블을 업데이트
    // director와 genre가 있다면 테이블을 바꿔야함.
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
    // await this.movieRepository.delete(id);
    await this.movieRepository.createQueryBuilder()
      .delete()
      .where('id = :id', { id })
      .execute()
    await this.movieDetailRepository.delete(movie.detail.id);
    return id;
  }
}
